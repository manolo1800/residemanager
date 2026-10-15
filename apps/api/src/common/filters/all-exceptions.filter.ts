import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let details: any = undefined;

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = "Validation error";
      details = exception.errors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === "string" ? res : (res as any).message || message;
      details = typeof res === "object" ? (res as any).details : undefined;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    reply.status(status).send({
      code: `ERR_${status}`,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
