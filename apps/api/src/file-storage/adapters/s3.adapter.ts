import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { FileStorageAdapter } from "./file-storage.adapter";
import { UploadFileInput, UploadFileResult } from "../file-storage.types";

@Injectable()
export class S3Adapter extends FileStorageAdapter {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly publicClient: S3Client;

  constructor(private readonly configService: ConfigService) {
    super();
    const bucket = this.configService.get<string>(
      "fileStorage.AWS_BUCKET_NAME",
    );

    if (!bucket) {
      throw new Error("Missing AWS_BUCKET_NAME configuration");
    }

    this.bucket = bucket;
    this.client = this.createClient();
    this.publicClient = this.createClient(
      this.configService.get<string>("fileStorage.S3_PUBLIC_ENDPOINT"),
    );
  }

  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
      Metadata: input.metadata,
      ACL: input.acl,
      CacheControl: input.cacheControl,
    });

    const response = await this.client.send(command);

    return {
      bucket: this.bucket,
      key: input.key,
      eTag: response.ETag,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.client.send(command);
  }

  async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Object ${key} has no body`);
    }

    return response.Body as Readable;
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });

    return getSignedUrl(this.publicClient, command, {
      expiresIn: expiresInSeconds,
    });
  }

  private createClient(endpointOverride?: string) {
    const region = this.configService.get<string>("aws.AWS_REGION");
    const accessKeyId = this.configService.get<string>("aws.AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>(
      "aws.AWS_SECRET_ACCESS_KEY",
    );
    const endpoint =
      endpointOverride ??
      this.configService.get<string>("fileStorage.S3_ENDPOINT");
    const forcePathStyle = this.configService.get<boolean>(
      "fileStorage.S3_FORCE_PATH_STYLE",
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing AWS credentials configuration");
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(endpoint ? { endpoint } : {}),
      ...(typeof forcePathStyle === "boolean" ? { forcePathStyle } : {}),
    });
  }
}
