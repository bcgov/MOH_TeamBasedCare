import { ConflictException } from '@nestjs/common';

export interface TemplateVersionConflictPayload {
  /** The version currently stored, which the client must resend to override. */
  currentVersion: number;
  /** Display name of whoever saved last, omitted when it cannot be resolved. */
  updatedBy?: string;
  updatedAt?: Date;
}

/**
 * Raised when a save carries a stale `expectedVersion`.
 *
 * The response deliberately carries `currentVersion` so the client can offer a
 * considered override by resending, rather than exposing a blunt `force` flag
 * that would let a client trample a change it never saw.
 *
 * The payload sits under `data` because every response passes through
 * `ErrorExceptionFilter`, which forwards only `response.data` as
 * `errorDetails`. Spreading the payload at the top level would look correct on
 * the exception and arrive at the client empty.
 */
export class TemplateVersionConflictException extends ConflictException {
  constructor(payload: TemplateVersionConflictPayload) {
    super({
      message: 'This template was changed by someone else. Nothing has been saved.',
      error: 'TemplateVersionConflict',
      statusCode: 409,
      data: { ...payload },
    });
  }
}
