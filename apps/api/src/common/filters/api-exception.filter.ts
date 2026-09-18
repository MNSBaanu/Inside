import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@inside/database';
import type { Response } from 'express';

const prismaErrors: Record<string, { status: HttpStatus; message: string }> = {
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A value is too long for its field',
  },
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'A record with these details already exists',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A referenced record does not exist',
  },
  P2020: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A value is out of range',
  },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        if (typeof obj.message === 'string' || Array.isArray(obj.message)) {
          message = obj.message as string | string[];
        } else if (typeof obj.error === 'string') {
          message = obj.error;
        } else {
          message = exception.message;
        }
      }
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      prismaErrors[exception.code]
    ) {
      ({ status, message } = prismaErrors[exception.code]);
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
      },
    });
  }
}
