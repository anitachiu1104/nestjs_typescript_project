import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { getTenantIdByRequest } from '../tenant/tenant.util';

@Catch()
export class GlobalExceptionFilter<T> implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const err = exception.stack || exception.message || exception;
    if (exception.message !== 'Cannot GET /favicon.ico') {
      const tenantId = getTenantIdByRequest(req);
      Logger.error(err,null, `tenantId=${tenantId}, traceId=${req.headers.requestid}`);
    }
    const errorResponse = {
      data: false,
      message: typeof exception === 'string' ? exception : exception.message,
      code: HttpStatus.INTERNAL_SERVER_ERROR
    };
    res.send(errorResponse);
  }
}
