import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorCode =
  | 'MISSING_USER_HEADER'
  | 'UNKNOWN_USER'
  | 'VALIDATION_ERROR'
  | 'EMPTY_TEXT'
  | 'PROJECT_NAME_TAKEN'
  | 'UNKNOWN_ASSIGNEE'
  | 'NOT_ASSIGNEE'
  | 'NOT_AUTHOR'
  | 'NOT_FOUND';

export class ApiException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super({ error: code, message }, status);
  }
}

export class MissingUserHeaderException extends ApiException {
  constructor() {
    super('MISSING_USER_HEADER', 'X-User-Id header is required.', HttpStatus.UNAUTHORIZED);
  }
}

export class UnknownUserException extends ApiException {
  constructor() {
    super('UNKNOWN_USER', 'X-User-Id does not match one of the 5 predefined users.', HttpStatus.UNAUTHORIZED);
  }
}

export class NotFoundApiException extends ApiException {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found.`, HttpStatus.NOT_FOUND);
  }
}

export class ValidationApiException extends ApiException {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST);
  }
}

export class EmptyTextException extends ApiException {
  constructor(field: string) {
    super('EMPTY_TEXT', `${field} must not be empty or whitespace-only.`, HttpStatus.BAD_REQUEST);
  }
}

export class ProjectNameTakenException extends ApiException {
  constructor() {
    super('PROJECT_NAME_TAKEN', 'A project with this name already exists.', HttpStatus.CONFLICT);
  }
}

export class UnknownAssigneeException extends ApiException {
  constructor() {
    super('UNKNOWN_ASSIGNEE', 'assigneeUserId does not match one of the 5 predefined users.', HttpStatus.BAD_REQUEST);
  }
}

export class NotAssigneeException extends ApiException {
  constructor() {
    super('NOT_ASSIGNEE', 'Only the task\'s current assignee can move it.', HttpStatus.FORBIDDEN);
  }
}

export class NotAuthorException extends ApiException {
  constructor() {
    super('NOT_AUTHOR', 'Only the comment\'s author can edit or delete it.', HttpStatus.FORBIDDEN);
  }
}
