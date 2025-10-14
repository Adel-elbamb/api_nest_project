import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { Request, Response } from 'express';

@Catch() 
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      message =
        (res && (res.message || res.error)) ||
        exception.message ||
        'Unexpected error';
    }

    
    else if (exception instanceof MongoServerError) {
      if (exception.code === 11000) {
        status = HttpStatus.CONFLICT;
        message = `Duplicate key error: ${Object.keys(
          exception.keyValue,
        ).join(', ')} already exists`;
      } else {
        message = exception.message;
      }
    }

    else if (
      (exception as any).name === 'ValidationError' &&
      (exception as any).errors
    ) {
      status = HttpStatus.BAD_REQUEST;
      const errors = Object.values((exception as any).errors).map(
        (err: any) => err.message,
      );
      message = errors.join(', ');
    }

    
    else if ((exception as any).name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${(exception as any).path}: ${(exception as any).value}`;
    }

    
    else if (exception instanceof Error) {
      message = exception.message;
    }

    
    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

