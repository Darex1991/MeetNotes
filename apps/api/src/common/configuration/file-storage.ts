import { registerAs } from "@nestjs/config";
import { Static, Type } from "@sinclair/typebox";
import { configValidator } from "src/utils/configValidator";

const schema = Type.Object({
  FILE_STORAGE_ADAPTER: Type.Union([Type.Literal("s3")]),
  AWS_BUCKET_NAME: Type.Optional(Type.String()),
  S3_ENDPOINT: Type.Optional(Type.String()),
  S3_PUBLIC_ENDPOINT: Type.Optional(Type.String()),
  S3_FORCE_PATH_STYLE: Type.Optional(Type.Boolean()),
});

export type FileStorageConfigSchema = Static<typeof schema>;

const validateFileStorageConfig = configValidator(schema);

export default registerAs("fileStorage", (): FileStorageConfigSchema => {
  const values = {
    FILE_STORAGE_ADAPTER: process.env.FILE_STORAGE_ADAPTER,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PUBLIC_ENDPOINT: process.env.S3_PUBLIC_ENDPOINT || undefined,
    S3_FORCE_PATH_STYLE:
      process.env.S3_FORCE_PATH_STYLE === undefined
        ? undefined
        : process.env.S3_FORCE_PATH_STYLE === "true",
  };
  return validateFileStorageConfig(values);
});
