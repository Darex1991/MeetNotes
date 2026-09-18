import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FileStorageModule } from "src/file-storage";
import { AiModule } from "src/ai";
import { MeetingsController } from "./api/meetings.controller";
import { MeetingsService } from "./meetings.service";
import { MeetingsProcessingService } from "./meetings-processing.service";
import { MeetingsProcessingConsumer } from "./meetings-processing.consumer";
import { MeetingsPipelineService } from "./meetings-pipeline.service";
import { MEETING_PROCESSING_QUEUE } from "./meetings.queue";

@Module({
  imports: [
    FileStorageModule,
    AiModule,
    BullModule.registerQueue({ name: MEETING_PROCESSING_QUEUE.name }),
    BullBoardModule.forFeature({
      name: MEETING_PROCESSING_QUEUE.name,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    MeetingsProcessingService,
    MeetingsPipelineService,
    MeetingsProcessingConsumer,
  ],
  exports: [MeetingsService],
})
export class MeetingsModule {}
