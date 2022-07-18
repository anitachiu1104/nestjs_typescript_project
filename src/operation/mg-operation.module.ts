import { Module } from '@nestjs/common';
import { MgOperationService } from './mg-operation.service';

@Module({
    imports: [],
    controllers: [],
    providers: [MgOperationService],
    exports: [MgOperationService]
})
export class MgOperationModule {}
