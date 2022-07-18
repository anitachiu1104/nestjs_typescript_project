import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { QueryRunner } from 'typeorm';
import { getTenantIdByRequest } from '../tenant/tenant.util';

export class TransactionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const dbSession: QueryRunner = request.dbSession;
        return of((async () => {
            await dbSession.startTransaction();
            try {
                const result = await next.handle().toPromise();
                await dbSession.commitTransaction();
                return result;
            } catch (err) {
                dbSession.rollbackTransaction().then(undefined).catch(e => {
                    Logger.error(`Rollback Failed: ${e}`, null,
                        `tenantId=${getTenantIdByRequest(request)}, 
                        traceId=${request.headers.requestid}`);
                });
                return Promise.reject(err);
            } finally {
                dbSession && !dbSession.isReleased && await dbSession.release();
            }
        })());
    }
}
