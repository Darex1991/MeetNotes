import { FormatRegistry } from "@sinclair/typebox";
import { validate as uuidValidate } from "uuid";

export function setupValidation() {
  FormatRegistry.Set("uuid", (value) => uuidValidate(value));
  // Multipart file fields are documented as `string/binary`; multer removes them from the
  // body before validation, so the format only needs to exist for the compiler.
  FormatRegistry.Set("binary", () => true);
}
