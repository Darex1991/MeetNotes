import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClaudeClient } from "./claude/claude.client";
import { TranscriptionProvider } from "./transcription/transcription.provider";
import { OpenAiWhisperAdapter } from "./transcription/openai-whisper.adapter";
import { LocalWhisperAdapter } from "./transcription/local-whisper.adapter";
import { MockTranscriptionAdapter } from "./transcription/mock-transcription.adapter";
import { DiarizationProvider } from "./diarization/diarization.provider";
import { HeuristicDiarizationAdapter } from "./diarization/heuristic-diarization.adapter";
import { ClaudeDiarizationAdapter } from "./diarization/claude-diarization.adapter";
import { PyannoteHttpDiarizationAdapter } from "./diarization/pyannote-http.adapter";
import { SummaryProvider } from "./summary/summary.provider";
import { ClaudeSummaryAdapter } from "./summary/claude-summary.adapter";
import { MockSummaryAdapter } from "./summary/mock-summary.adapter";

@Module({
  imports: [ConfigModule],
  providers: [
    ClaudeClient,
    {
      provide: TranscriptionProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService): TranscriptionProvider => {
        switch (config.get<string>("ai.TRANSCRIPTION_ADAPTER")) {
          case "openai":
            return new OpenAiWhisperAdapter(config);
          case "local":
            return new LocalWhisperAdapter(config);
          case "mock":
            return new MockTranscriptionAdapter();
          default:
            throw new Error("Unknown TRANSCRIPTION_ADAPTER");
        }
      },
    },
    {
      provide: DiarizationProvider,
      inject: [ConfigService, ClaudeClient],
      useFactory: (
        config: ConfigService,
        claude: ClaudeClient,
      ): DiarizationProvider => {
        switch (config.get<string>("ai.DIARIZATION_ADAPTER")) {
          case "heuristic":
            return new HeuristicDiarizationAdapter();
          case "claude":
            return new ClaudeDiarizationAdapter(claude);
          case "pyannote":
            return new PyannoteHttpDiarizationAdapter(config);
          default:
            throw new Error("Unknown DIARIZATION_ADAPTER");
        }
      },
    },
    {
      provide: SummaryProvider,
      inject: [ConfigService, ClaudeClient],
      useFactory: (
        config: ConfigService,
        claude: ClaudeClient,
      ): SummaryProvider => {
        switch (config.get<string>("ai.SUMMARY_ADAPTER")) {
          case "claude":
            return new ClaudeSummaryAdapter(claude);
          case "mock":
            return new MockSummaryAdapter();
          default:
            throw new Error("Unknown SUMMARY_ADAPTER");
        }
      },
    },
  ],
  exports: [
    TranscriptionProvider,
    DiarizationProvider,
    SummaryProvider,
    ClaudeClient,
  ],
})
export class AiModule {}
