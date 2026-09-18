import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { TranscriptionInput, TranscriptionResult } from "../ai.types";
import { TranscriptionProvider } from "./transcription.provider";

type WhisperJsonOutput = {
  text?: string;
  language?: string;
  segments?: Array<{ id: number; start: number; end: number; text: string }>;
};

/**
 * Runs the open-source `whisper` CLI (https://github.com/openai/whisper) on the worker host.
 * No file size limit, but requires Python + ffmpeg installed next to the API.
 */
@Injectable()
export class LocalWhisperAdapter extends TranscriptionProvider {
  readonly name = "local";
  private readonly logger = new Logger(LocalWhisperAdapter.name);
  private readonly binary: string;
  private readonly model: string;

  constructor(configService: ConfigService) {
    super();
    this.binary = configService.get<string>("ai.LOCAL_WHISPER_BINARY")!;
    this.model = configService.get<string>("ai.LOCAL_WHISPER_MODEL")!;
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "whisper-"));

    try {
      const args = [
        input.filePath,
        "--model",
        this.model,
        "--output_format",
        "json",
        "--output_dir",
        outputDir,
        "--verbose",
        "False",
      ];

      if (input.language) {
        args.push("--language", input.language);
      }

      this.logger.log(`Running ${this.binary} ${args.join(" ")}`);
      await this.run(this.binary, args);

      const baseName = path.parse(input.filePath).name;
      const raw = await fs.readFile(
        path.join(outputDir, `${baseName}.json`),
        "utf8",
      );
      const payload = JSON.parse(raw) as WhisperJsonOutput;
      const segments = (payload.segments ?? []).map((segment, index) => ({
        id: index,
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
        speaker: null,
      }));
      const last = segments[segments.length - 1];

      return {
        segments,
        language: payload.language ?? input.language ?? null,
        durationSeconds: last ? last.end : null,
      };
    } finally {
      await fs.rm(outputDir, { recursive: true, force: true });
    }
  }

  private run(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) =>
        reject(
          new Error(
            `Failed to start ${command}: ${error.message}. Install openai-whisper or switch TRANSCRIPTION_ADAPTER.`,
          ),
        ),
      );
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`${command} exited with ${code}: ${stderr.slice(-800)}`),
          );
        }
      });
    });
  }
}
