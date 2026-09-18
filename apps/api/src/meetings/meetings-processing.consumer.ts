import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import {
  ACTION_TO_STAGE,
  MEETING_PROCESSING_QUEUE,
  MeetingProcessingAction,
  MeetingProcessingJobPayload,
} from "./meetings.queue";
import { MeetingsPipelineService } from "./meetings-pipeline.service";

type MeetingJob = Job<
  MeetingProcessingJobPayload,
  unknown,
  MeetingProcessingAction
>;

@Processor(MEETING_PROCESSING_QUEUE.name, { concurrency: 2 })
export class MeetingsProcessingConsumer extends WorkerHost {
  private readonly logger = new Logger(MeetingsProcessingConsumer.name);

  constructor(private readonly pipeline: MeetingsPipelineService) {
    super();
  }

  async process(job: MeetingJob): Promise<unknown> {
    const { meetingId } = job.data;
    const report = (progress: number) => job.updateProgress(progress);

    switch (job.name) {
      case MEETING_PROCESSING_QUEUE.actions.TRANSCRIBE:
        return this.pipeline.transcribe(meetingId, report);
      case MEETING_PROCESSING_QUEUE.actions.DIARIZE:
        return this.pipeline.diarize(meetingId, report);
      case MEETING_PROCESSING_QUEUE.actions.SUMMARIZE:
        return this.pipeline.summarize(meetingId, report);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent("failed")
  async onFailed(job: MeetingJob | undefined, error: Error) {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;
    const exhausted = job.attemptsMade >= maxAttempts;

    this.logger.warn(
      `Job ${job.name} for meeting ${job.data.meetingId} failed (attempt ${job.attemptsMade}/${maxAttempts}): ${error.message}`,
    );

    if (exhausted) {
      await this.pipeline.markFailed(
        job.data.meetingId,
        ACTION_TO_STAGE[job.name],
        error.message,
      );
    }
  }
}
