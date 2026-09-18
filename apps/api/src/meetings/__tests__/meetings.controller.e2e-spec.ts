import { INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Readable } from "stream";
import { createE2ETest } from "../../../test/create-e2e-test";
import { createUserFactory, User } from "../../../test/factory/user.factory";
import { DatabasePg } from "../../../src/common";
import { truncateTables } from "../../../test/helpers/test-helpers";
import {
  createQueueTestHarness,
  QueueTestHarness,
} from "../../../test/helpers/bullmq-test-utils";
import { FileStorageAdapter } from "src/file-storage/adapters/file-storage.adapter";
import { UploadFileInput } from "src/file-storage";
import { MEETING_PROCESSING_QUEUE } from "../meetings.queue";

/** In-memory object storage so e2e tests do not need RustFS/S3. */
class InMemoryStorageAdapter extends FileStorageAdapter {
  objects = new Map<string, Buffer>();

  async uploadFile(input: UploadFileInput) {
    const body = input.body;
    let buffer: Buffer;
    if (Buffer.isBuffer(body)) buffer = body;
    else if (typeof body === "string") buffer = Buffer.from(body);
    else if (body instanceof Uint8Array) buffer = Buffer.from(body);
    else {
      const chunks: Buffer[] = [];
      for await (const chunk of body as Readable)
        chunks.push(Buffer.from(chunk));
      buffer = Buffer.concat(chunks);
    }
    this.objects.set(input.key, buffer);
    return { bucket: "test", key: input.key };
  }

  async deleteFile(key: string) {
    this.objects.delete(key);
  }

  async getFileStream(key: string) {
    const buffer = this.objects.get(key);
    if (!buffer) throw new Error(`missing ${key}`);
    return Readable.from(buffer);
  }

  async getSignedDownloadUrl(key: string) {
    return `http://storage.test/${key}?signed=1`;
  }
}

describe("MeetingsController (e2e)", () => {
  let app: INestApplication;
  let db: DatabasePg;
  let cookies: string;
  let testUser: User;
  let userFactory: ReturnType<typeof createUserFactory>;
  let queueHarness: QueueTestHarness;
  const storage = new InMemoryStorageAdapter();

  beforeAll(async () => {
    const created = await createE2ETest([
      { provide: FileStorageAdapter, useValue: storage },
    ]);
    app = created.app;
    db = created.db;
    userFactory = createUserFactory(db);
    queueHarness = await createQueueTestHarness(
      app,
      MEETING_PROCESSING_QUEUE.name,
    );
  });

  afterAll(async () => {
    await queueHarness?.dispose();
    await app?.close();
  });

  beforeEach(async () => {
    testUser = userFactory.build();
    const registerResponse = await request(app.getHttpServer())
      .post("/api/auth/sign-up/email")
      .send({
        email: testUser.email,
        password: "password123",
        name: testUser.name,
      });
    testUser.id = registerResponse.body.user.id;
    cookies = registerResponse.headers["set-cookie"];
  });

  afterEach(async () => {
    await queueHarness.cleanQueue();
    await truncateTables(db, ["meeting", "file", "user"]);
    storage.objects.clear();
  });

  const upload = (title = "Sprint review") =>
    request(app.getHttpServer())
      .post("/api/v1/meetings")
      .set("Cookie", cookies)
      .field("title", title)
      .attach("file", Buffer.from("fake-audio-bytes"), {
        filename: "review.mp3",
        contentType: "audio/mpeg",
      });

  it("rejects non-media uploads", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/meetings")
      .set("Cookie", cookies)
      .attach("file", Buffer.from("hello"), {
        filename: "notes.txt",
        contentType: "text/plain",
      })
      .expect(400);
  });

  it("uploads a recording, processes it through all stages and exposes the notes", async () => {
    const firstJob = queueHarness.waitForJobCompletion();
    const response = await upload().expect(201);

    expect(response.body.data).toMatchObject({
      title: "Sprint review",
      status: "uploaded",
      fileName: "review.mp3",
      progress: 0,
    });
    const meetingId = response.body.data.id;
    expect(storage.objects.size).toBe(1);

    // TRANSCRIBE -> DIARIZE -> SUMMARIZE
    await firstJob;
    await queueHarness.waitForJobCompletion();
    await queueHarness.waitForJobCompletion();

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/meetings/${meetingId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(detail.body.data.status).toBe("completed");
    expect(detail.body.data.progress).toBe(100);
    expect(detail.body.data.transcript.length).toBeGreaterThan(0);
    expect(Object.keys(detail.body.data.speakers).length).toBeGreaterThan(0);
    expect(detail.body.data.summary).toContain("Sprint review");
    expect(detail.body.data.actionItems.length).toBeGreaterThan(0);
    expect(detail.body.data.decisions.length).toBeGreaterThan(0);

    const list = await request(app.getHttpServer())
      .get("/api/v1/meetings")
      .set("Cookie", cookies)
      .expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].actionItemsCount).toBe(
      detail.body.data.actionItems.length,
    );

    const exported = await request(app.getHttpServer())
      .get(`/api/v1/meetings/${meetingId}/export`)
      .set("Cookie", cookies)
      .expect(200);
    expect(exported.headers["content-type"]).toContain("text/markdown");
    expect(exported.text).toContain("# Sprint review");
    expect(exported.text).toContain("## Action items");

    const media = await request(app.getHttpServer())
      .get(`/api/v1/meetings/${meetingId}/media-url`)
      .set("Cookie", cookies)
      .expect(200);
    expect(media.body.data.url).toContain("signed=1");
  });

  it("lets the owner rename the meeting and its speakers", async () => {
    const done = queueHarness.waitForJobCompletion();
    const { body } = await upload().expect(201);
    await done;

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/meetings/${body.data.id}`)
      .set("Cookie", cookies)
      .send({ title: "Renamed", speakers: { SPEAKER_00: "Ola" } })
      .expect(200);

    expect(updated.body.data.title).toBe("Renamed");
    expect(updated.body.data.speakers.SPEAKER_00).toBe("Ola");
  });

  it("hides meetings from other users and deletes on request", async () => {
    const done = queueHarness.waitForJobCompletion();
    const { body } = await upload().expect(201);
    await done;

    const other = userFactory.build();
    const otherRegister = await request(app.getHttpServer())
      .post("/api/auth/sign-up/email")
      .send({ email: other.email, password: "password123", name: other.name });

    await request(app.getHttpServer())
      .get(`/api/v1/meetings/${body.data.id}`)
      .set("Cookie", otherRegister.headers["set-cookie"])
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/meetings/${body.data.id}`)
      .set("Cookie", cookies)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/meetings/${body.data.id}`)
      .set("Cookie", cookies)
      .expect(404);
    expect(storage.objects.size).toBe(0);
  });

  it("refuses to retry a meeting that has not failed", async () => {
    const done = queueHarness.waitForJobCompletion();
    const { body } = await upload().expect(201);
    await done;

    await request(app.getHttpServer())
      .post(`/api/v1/meetings/${body.data.id}/retry`)
      .set("Cookie", cookies)
      .expect(409);
  });
});
