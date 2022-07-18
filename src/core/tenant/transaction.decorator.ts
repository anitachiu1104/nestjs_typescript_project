import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { TransactionInterceptor } from '../interceptor/transaction.interceptor';

export function DbTransaction() {
    return applyDecorators(
        SetMetadata('transaction', true),
        UseInterceptors(TransactionInterceptor),
    );
}
