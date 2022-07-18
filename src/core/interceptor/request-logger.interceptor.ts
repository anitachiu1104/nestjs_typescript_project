import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as uuid from 'uuid';
import { getTenantIdByRequest } from '../tenant/tenant.util';

export class RequestLoggerInterceptor implements NestInterceptor{
    private logger = new Logger('RequestLoggerInterceptor');
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const ctx = context.switchToHttp().getRequest();
        ctx.headers.requestid = uuid.v4();
        const url = ctx.url;
        const method = ctx.method;
        const functionInfo = `[${context.getClass().name} -> ${context.getHandler().name}()]`;
        const userIp = ctx.headers['x-forwarded-for'] || ctx.connection.remoteAddress;
        const tenantInfo = `tenant ID: ${getTenantIdByRequest(ctx)}`;
        const connectionInfo = `client IP: ${userIp} [${method}] -> ${url}`;
        const requestInfo = `Request: traceId=${ctx.headers.requestid} ,params=${ctx.params}, body=${ctx.body}`;
        this.logger.log(`${tenantInfo} ${connectionInfo} ${requestInfo} `, functionInfo);
        return next.handle();
    }

}
