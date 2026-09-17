export type AIErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_RESPONSE"
  | "NOT_CONFIGURED";

export class AIServiceError extends Error {
  code: AIErrorCode;
  status: number;

  constructor({
    message,
    code,
    status,
  }: {
    message: string;
    code: AIErrorCode;
    status: number;
  }) {
    super(message);

    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
  }
}