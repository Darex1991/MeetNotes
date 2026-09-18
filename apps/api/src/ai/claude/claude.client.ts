import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { Static, TObject } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export type StructuredRequest<T extends TObject> = {
  system: string;
  prompt: string;
  schema: T;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
};

/**
 * Thin wrapper over the Anthropic SDK that always returns schema-validated JSON.
 * Uses `output_config.format` (structured outputs) so the model emits exactly the
 * TypeBox schema we hand it, then re-validates before returning.
 */
@Injectable()
export class ClaudeClient {
  private readonly logger = new Logger(ClaudeClient.name);
  private readonly client: Anthropic;
  readonly model: string;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>("ai.ANTHROPIC_API_KEY");
    this.model = configService.get<string>("ai.ANTHROPIC_MODEL")!;
    // The SDK also resolves credentials from ANTHROPIC_API_KEY / `ant auth login`.
    this.client = new Anthropic(apiKey ? { apiKey } : {});
  }

  async generateStructured<T extends TObject>(
    request: StructuredRequest<T>,
  ): Promise<Static<T>> {
    const schema = Value.Clean(request.schema, structuredClone(request.schema));

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: request.maxTokens ?? 16000,
      system: request.system,
      messages: [{ role: "user", content: request.prompt }],
      output_config: {
        format: {
          type: "json_schema",
          schema: schema as Record<string, unknown>,
        },
        ...(request.effort ? { effort: request.effort } : {}),
      },
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new Error(
        `Claude declined the request${
          message.stop_details?.explanation
            ? `: ${message.stop_details.explanation}`
            : ""
        }`,
      );
    }

    if (message.stop_reason === "max_tokens") {
      throw new Error("Claude response was truncated (max_tokens reached)");
    }

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.logger.error(
        `Claude returned non-JSON output: ${text.slice(0, 300)}`,
      );
      throw new Error("Claude returned invalid JSON");
    }

    if (!Value.Check(request.schema, parsed)) {
      const errors = [...Value.Errors(request.schema, parsed)]
        .slice(0, 5)
        .map((e) => `${e.path}: ${e.message}`)
        .join("; ");
      throw new Error(`Claude output did not match schema: ${errors}`);
    }

    this.logger.debug(
      `Claude ${this.model} usage: in=${message.usage.input_tokens} out=${message.usage.output_tokens}`,
    );

    return parsed;
  }
}
