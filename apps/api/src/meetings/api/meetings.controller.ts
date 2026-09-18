import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiProduces,
} from "@nestjs/swagger";
import { Validate } from "nestjs-typebox";
import { diskStorage } from "multer";
import os from "os";
import type { Express, Response } from "express";
import {
  BaseResponse,
  baseResponse,
  nullResponse,
  UUIDSchema,
} from "src/common";
import { Session, UserSession } from "src/auth";
import { DEFAULT_MAX_UPLOAD_MB } from "src/common/configuration/ai";
import { MeetingsService } from "../meetings.service";
import {
  CreateMeetingBody,
  createMeetingSchema,
} from "../schemas/create-meeting.schema";
import {
  UpdateMeetingBody,
  updateMeetingSchema,
} from "../schemas/update-meeting.schema";
import {
  mediaUrlSchema,
  MediaUrlResponse,
  meetingListSchema,
  MeetingListItem,
  MeetingResponse,
  meetingSchema,
} from "../schemas/meeting.schema";

// Multer limits are evaluated at decoration time, so the cap is read straight from env.
const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_MB ?? DEFAULT_MAX_UPLOAD_MB) * 1024 * 1024;

@Controller({ path: "meetings", version: "1" })
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({ destination: os.tmpdir() }),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: { type: "string", format: "binary" },
        title: { type: "string" },
        language: { type: "string" },
      },
    },
  })
  @Validate({
    request: [{ type: "body", schema: createMeetingSchema }],
    response: baseResponse(meetingSchema),
  })
  async createMeeting(
    @Body() body: CreateMeetingBody,
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ): Promise<BaseResponse<MeetingResponse>> {
    const created = await this.meetingsService.createFromUpload(
      session.user.id,
      file,
      body,
    );

    return new BaseResponse(created);
  }

  @Get()
  @Validate({ response: baseResponse(meetingListSchema) })
  async listMeetings(
    @Session() session: UserSession,
  ): Promise<BaseResponse<MeetingListItem[]>> {
    return new BaseResponse(
      await this.meetingsService.listForUser(session.user.id),
    );
  }

  @Get(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: baseResponse(meetingSchema),
  })
  async getMeeting(
    id: string,
    @Session() session: UserSession,
  ): Promise<BaseResponse<MeetingResponse>> {
    return new BaseResponse(
      await this.meetingsService.getForUser(session.user.id, id),
    );
  }

  @Patch(":id")
  @Validate({
    request: [
      { type: "param", name: "id", schema: UUIDSchema },
      { type: "body", schema: updateMeetingSchema },
    ],
    response: baseResponse(meetingSchema),
  })
  async updateMeeting(
    id: string,
    @Body() body: UpdateMeetingBody,
    @Session() session: UserSession,
  ): Promise<BaseResponse<MeetingResponse>> {
    return new BaseResponse(
      await this.meetingsService.update(session.user.id, id, body),
    );
  }

  @Post(":id/retry")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: baseResponse(meetingSchema),
  })
  async retryMeeting(
    id: string,
    @Session() session: UserSession,
  ): Promise<BaseResponse<MeetingResponse>> {
    return new BaseResponse(
      await this.meetingsService.retry(session.user.id, id),
    );
  }

  @Get(":id/media-url")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: baseResponse(mediaUrlSchema),
  })
  async getMediaUrl(
    id: string,
    @Session() session: UserSession,
  ): Promise<BaseResponse<MediaUrlResponse>> {
    return new BaseResponse(
      await this.meetingsService.getMediaUrl(session.user.id, id),
    );
  }

  @Get(":id/export")
  @Header("Content-Type", "text/markdown; charset=utf-8")
  @ApiProduces("text/markdown")
  @ApiOkResponse({
    description: "Meeting notes as a Markdown document",
    schema: { type: "string" },
  })
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
  })
  async exportMeeting(
    id: string,
    @Session() session: UserSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const { filename, content } = await this.meetingsService.exportMarkdown(
      session.user.id,
      id,
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return content;
  }

  @Delete(":id")
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema }],
    response: nullResponse(),
  })
  async deleteMeeting(
    id: string,
    @Session() session: UserSession,
  ): Promise<null> {
    await this.meetingsService.delete(session.user.id, id);

    return null;
  }
}
