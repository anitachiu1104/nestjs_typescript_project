import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getTenantIdByRequest } from '../tenant/tenant.util';

@Injectable()
export class MyLogger extends Logger {
    @Inject(REQUEST)
    private readonly req;
    constructor(public tenantId: string) {
        super();
    }

    error(message: any, trace?: string, context?: string): void {
        super.error(message, trace, this.getCustomerContext());
    }
    log(message: any, context?: string): void {
        super.log(message, this.getCustomerContext());
    }
    warn(message: any, context?: string): void {
        super.warn(message, this.getCustomerContext());
    }
    debug(message: any, context?: string): void {
        super.debug(message, this.getCustomerContext());
    }
    verbose(message: any, context?: string): void {
        super.verbose(message, this.getCustomerContext());
    }
    private getCustomerContext(): string {
        if (this.tenantId) {
            return `tenantId=${this.tenantId}`;
        }
        const tenantId = getTenantIdByRequest(this.req);
        const requestId = this.req ? this.req.headers.requestid : undefined;
        return `tenantId=${tenantId}, traceId=${requestId}`;
    }
}
