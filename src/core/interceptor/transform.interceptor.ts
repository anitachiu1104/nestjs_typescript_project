import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { getTenantIdByRequest } from '../tenant/tenant.util';
import { Redirect } from './redirect';

export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Object> | Promise<Observable<Object>> {
        const request = context.switchToHttp().getRequest();
        return of((async () => {
            try {
                const responseData = await next.handle().pipe().toPromise();
                if (responseData instanceof Redirect) {
                    responseData.go();
                } else {
                    return { data: responseData, code: 200, message: true };
                }
            } catch(err) {
                return Promise.reject(err);
            } finally {
                await TransformInterceptor.releaseDbSessionByRequest(request);
            }
        })());
    }

    private static async releaseDbSessionByRequest(req: any): Promise<void> {
        try {
            req.dbSession && !req.dbSession.isReleased && await req.dbSession.release();
        } catch (e) {
            Logger.error(`Release Connection Failed: ${e}`, null,
                `tenantId=${getTenantIdByRequest(req)}, 
                traceId=${req.headers.requestid}`);
        }
    }
}
