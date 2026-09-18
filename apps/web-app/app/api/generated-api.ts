/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface GetUsersResponse {
  data: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: date;
    updatedAt: date;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: date | null;
  }[];
}

export interface GetUserByIdResponse {
  data: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: date;
    updatedAt: date;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: date | null;
  };
}

export interface UploadUserImageResponse {
  data: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: date;
    updatedAt: date;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: date | null;
  };
}

export interface UpdateUserBody {
  /** @format email */
  email?: string;
}

export interface UpdateUserResponse {
  data: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: date;
    updatedAt: date;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    banExpires: date | null;
  };
}

export type DeleteUserResponse = null;

export interface CreateMeetingBody {
  /**
   * Audio or video recording (multipart/form-data field `file`).
   * @format binary
   */
  file?: File;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string;
  /**
   * ISO-639-1 hint for Whisper, e.g. 'pl' or 'en'. Auto-detected when omitted.
   * @minLength 2
   * @maxLength 5
   */
  language?: string;
}

export interface CreateMeetingResponse {
  data: {
    /** @format uuid */
    id: string;
    title: string;
    status:
      | "uploaded"
      | "transcribing"
      | "diarizing"
      | "summarizing"
      | "completed"
      | "failed";
    progress: number;
    failedStage: ("transcribe" | "diarize" | "summarize") | null;
    errorMessage: string | null;
    language: string | null;
    durationSeconds: number | null;
    fileName: string;
    mimeType: string;
    byteSize: number;
    actionItemsCount: number;
    decisionsCount: number;
    speakersCount: number;
    processingStartedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    transcript:
      | {
          id: number;
          start: number;
          end: number;
          text: string;
          speaker: string | null;
        }[]
      | null;
    speakers: Record<string, string>;
    summary: string | null;
    keyTopics: string[];
    actionItems: {
      title: string;
      owner: string | null;
      dueDate: string | null;
      priority: "low" | "medium" | "high";
      sourceSegmentIds: number[];
    }[];
    decisions: {
      title: string;
      rationale: string | null;
      sourceSegmentIds: number[];
    }[];
  };
}

export interface ListMeetingsResponse {
  data: {
    /** @format uuid */
    id: string;
    title: string;
    status:
      | "uploaded"
      | "transcribing"
      | "diarizing"
      | "summarizing"
      | "completed"
      | "failed";
    progress: number;
    failedStage: ("transcribe" | "diarize" | "summarize") | null;
    errorMessage: string | null;
    language: string | null;
    durationSeconds: number | null;
    fileName: string;
    mimeType: string;
    byteSize: number;
    actionItemsCount: number;
    decisionsCount: number;
    speakersCount: number;
    processingStartedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface GetMeetingResponse {
  data: {
    /** @format uuid */
    id: string;
    title: string;
    status:
      | "uploaded"
      | "transcribing"
      | "diarizing"
      | "summarizing"
      | "completed"
      | "failed";
    progress: number;
    failedStage: ("transcribe" | "diarize" | "summarize") | null;
    errorMessage: string | null;
    language: string | null;
    durationSeconds: number | null;
    fileName: string;
    mimeType: string;
    byteSize: number;
    actionItemsCount: number;
    decisionsCount: number;
    speakersCount: number;
    processingStartedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    transcript:
      | {
          id: number;
          start: number;
          end: number;
          text: string;
          speaker: string | null;
        }[]
      | null;
    speakers: Record<string, string>;
    summary: string | null;
    keyTopics: string[];
    actionItems: {
      title: string;
      owner: string | null;
      dueDate: string | null;
      priority: "low" | "medium" | "high";
      sourceSegmentIds: number[];
    }[];
    decisions: {
      title: string;
      rationale: string | null;
      sourceSegmentIds: number[];
    }[];
  };
}

export interface UpdateMeetingBody {
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string;
  speakers?: Record<string, string>;
}

export interface UpdateMeetingResponse {
  data: {
    /** @format uuid */
    id: string;
    title: string;
    status:
      | "uploaded"
      | "transcribing"
      | "diarizing"
      | "summarizing"
      | "completed"
      | "failed";
    progress: number;
    failedStage: ("transcribe" | "diarize" | "summarize") | null;
    errorMessage: string | null;
    language: string | null;
    durationSeconds: number | null;
    fileName: string;
    mimeType: string;
    byteSize: number;
    actionItemsCount: number;
    decisionsCount: number;
    speakersCount: number;
    processingStartedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    transcript:
      | {
          id: number;
          start: number;
          end: number;
          text: string;
          speaker: string | null;
        }[]
      | null;
    speakers: Record<string, string>;
    summary: string | null;
    keyTopics: string[];
    actionItems: {
      title: string;
      owner: string | null;
      dueDate: string | null;
      priority: "low" | "medium" | "high";
      sourceSegmentIds: number[];
    }[];
    decisions: {
      title: string;
      rationale: string | null;
      sourceSegmentIds: number[];
    }[];
  };
}

export interface RetryMeetingResponse {
  data: {
    /** @format uuid */
    id: string;
    title: string;
    status:
      | "uploaded"
      | "transcribing"
      | "diarizing"
      | "summarizing"
      | "completed"
      | "failed";
    progress: number;
    failedStage: ("transcribe" | "diarize" | "summarize") | null;
    errorMessage: string | null;
    language: string | null;
    durationSeconds: number | null;
    fileName: string;
    mimeType: string;
    byteSize: number;
    actionItemsCount: number;
    decisionsCount: number;
    speakersCount: number;
    processingStartedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    transcript:
      | {
          id: number;
          start: number;
          end: number;
          text: string;
          speaker: string | null;
        }[]
      | null;
    speakers: Record<string, string>;
    summary: string | null;
    keyTopics: string[];
    actionItems: {
      title: string;
      owner: string | null;
      dueDate: string | null;
      priority: "low" | "medium" | "high";
      sourceSegmentIds: number[];
    }[];
    decisions: {
      title: string;
      rationale: string | null;
      sourceSegmentIds: number[];
    }[];
  };
}

export interface GetMediaUrlResponse {
  data: {
    url: string;
    expiresAt: string;
  };
}

export type DeleteMeetingResponse = null;

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<
  AxiosRequestConfig,
  "data" | "params" | "url" | "responseType"
> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<
  AxiosRequestConfig,
  "data" | "cancelToken"
> {
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain"
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || ""
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {})
      }
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {})
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path
    });
  };
}

/**
 * @title Meeting Notes API
 * @version 1.0
 * @contact
 *
 * Upload meeting recordings, process them in the background (Whisper transcription, diarization, Claude summaries) and read the resulting notes.
 */
export class API<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerGetProfileV1
     * @request GET:/api/v1/users/me
     */
    usersControllerGetProfileV1: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/users/me`,
        method: "GET",
        ...params
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerScheduleAlertEmailV1
     * @request GET:/api/v1/users/me/alert-email
     */
    usersControllerScheduleAlertEmailV1: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/users/me/alert-email`,
        method: "GET",
        ...params
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerGetUsersV1
     * @request GET:/api/v1/users
     */
    usersControllerGetUsersV1: (params: RequestParams = {}) =>
      this.request<GetUsersResponse, any>({
        path: `/api/v1/users`,
        method: "GET",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerGetUserByIdV1
     * @request GET:/api/v1/users/{id}
     */
    usersControllerGetUserByIdV1: (id: string, params: RequestParams = {}) =>
      this.request<GetUserByIdResponse, any>({
        path: `/api/v1/users/${id}`,
        method: "GET",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerUpdateUserV1
     * @request PATCH:/api/v1/users/{id}
     */
    usersControllerUpdateUserV1: (
      id: string,
      data: UpdateUserBody,
      params: RequestParams = {}
    ) =>
      this.request<UpdateUserResponse, any>({
        path: `/api/v1/users/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerDeleteUserV1
     * @request DELETE:/api/v1/users/{id}
     */
    usersControllerDeleteUserV1: (id: string, params: RequestParams = {}) =>
      this.request<DeleteUserResponse, any>({
        path: `/api/v1/users/${id}`,
        method: "DELETE",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerUploadUserImageV1
     * @request POST:/api/v1/users/{id}/image
     */
    usersControllerUploadUserImageV1: (id: string, params: RequestParams = {}) =>
      this.request<UploadUserImageResponse, any>({
        path: `/api/v1/users/${id}/image`,
        method: "POST",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerCreateMeetingV1
     * @request POST:/api/v1/meetings
     */
    meetingsControllerCreateMeetingV1: (
      data: CreateMeetingBody,
      params: RequestParams = {}
    ) =>
      this.request<CreateMeetingResponse, any>({
        path: `/api/v1/meetings`,
        method: "POST",
        body: data,
        type: ContentType.FormData,
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerListMeetingsV1
     * @request GET:/api/v1/meetings
     */
    meetingsControllerListMeetingsV1: (params: RequestParams = {}) =>
      this.request<ListMeetingsResponse, any>({
        path: `/api/v1/meetings`,
        method: "GET",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerGetMeetingV1
     * @request GET:/api/v1/meetings/{id}
     */
    meetingsControllerGetMeetingV1: (id: string, params: RequestParams = {}) =>
      this.request<GetMeetingResponse, any>({
        path: `/api/v1/meetings/${id}`,
        method: "GET",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerUpdateMeetingV1
     * @request PATCH:/api/v1/meetings/{id}
     */
    meetingsControllerUpdateMeetingV1: (
      id: string,
      data: UpdateMeetingBody,
      params: RequestParams = {}
    ) =>
      this.request<UpdateMeetingResponse, any>({
        path: `/api/v1/meetings/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerDeleteMeetingV1
     * @request DELETE:/api/v1/meetings/{id}
     */
    meetingsControllerDeleteMeetingV1: (id: string, params: RequestParams = {}) =>
      this.request<DeleteMeetingResponse, any>({
        path: `/api/v1/meetings/${id}`,
        method: "DELETE",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerRetryMeetingV1
     * @request POST:/api/v1/meetings/{id}/retry
     */
    meetingsControllerRetryMeetingV1: (id: string, params: RequestParams = {}) =>
      this.request<RetryMeetingResponse, any>({
        path: `/api/v1/meetings/${id}/retry`,
        method: "POST",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerGetMediaUrlV1
     * @request GET:/api/v1/meetings/{id}/media-url
     */
    meetingsControllerGetMediaUrlV1: (id: string, params: RequestParams = {}) =>
      this.request<GetMediaUrlResponse, any>({
        path: `/api/v1/meetings/${id}/media-url`,
        method: "GET",
        format: "json",
        ...params
      }),

    /**
     * No description
     *
     * @tags Meetings
     * @name MeetingsControllerExportMeetingV1
     * @request GET:/api/v1/meetings/{id}/export
     */
    meetingsControllerExportMeetingV1: (id: string, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/api/v1/meetings/${id}/export`,
        method: "GET",
        ...params
      }),

    /**
     * No description
     *
     * @tags TestConfig
     * @name TestConfigControllerSetupV1
     * @request POST:/api/v1/test-config/setup
     */
    testConfigControllerSetupV1: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/test-config/setup`,
        method: "POST",
        ...params
      }),

    /**
     * No description
     *
     * @tags TestConfig
     * @name TestConfigControllerTeardownV1
     * @request POST:/api/v1/test-config/teardown
     */
    testConfigControllerTeardownV1: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/v1/test-config/teardown`,
        method: "POST",
        ...params
      }),

    /**
     * No description
     *
     * @tags Health
     * @name HealthControllerCheck
     * @request GET:/api/health
     */
    healthControllerCheck: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        {
          /** @example "error" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"redis":{"status":"down","message":"Could not connect"}} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        }
      >({
        path: `/api/health`,
        method: "GET",
        format: "json",
        ...params
      })
  };
}
