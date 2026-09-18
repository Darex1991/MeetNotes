import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import {
  MEETING_PROCESSING_QUEUE,
  MeetingProcessingJobPayload,
  STAGE_TO_ACTION,
} from "./meetings.queue";
import type { ProcessingStage } from "./meetings-schema";

/**
 * Producer side of the processing pipeline. Each stage is its own job so a failure in
 * summarisation never re-runs a 40-minute transcription.
 */
@Injectable()
export class MeetingsProcessingService {
  private readonly logger = new Logger(MeetingsProcessingService.name);

  constructor(
    @InjectQueue(MEETING_PROCESSING_QUEUE.name)
    private readonly queue: Queue<MeetingProcessingJobPayload>,
  ) {}

  async enqueueStage(stage: ProcessingStage, meetingId: string) {
    const action = STAGE_TO_ACTION[stage];
    this.logger.log(`Enqueue ${action} for meeting ${meetingId}`);

    await this.queue.add(
      action,
      { meetingId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    );
  }
}
