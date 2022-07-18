import { Global, MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Connection, createConnection, EntityManager, getConnection } from 'typeorm';
import { ConfigModule } from '../config/config.module';
import { TenantService } from './tenant.service';
import { getConnectionOptions, getTenantIdByRequest } from './tenant.util';

const connectionFactory = {
    provide: EntityManager,
    scope: Scope.REQUEST,
    useFactory: async (request: any): Promise<EntityManager> => {
        const tenantId = getTenantIdByRequest(request);
        const dbSession = getConnection(tenantId).createQueryRunner();
        Object.assign(request, { dbSession });
        return dbSession.manager;
    },
    inject: [REQUEST]
}

@Global()
@Module({
    imports: [ConfigModule],
    providers: [connectionFactory, TenantService],
    exports: [connectionFactory, TenantService]
})

export class TenantModule implements NestModule {
    constructor(private tenantService: TenantService) {
    }
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(async (req, res, next) => {
            const tenantId = getTenantIdByRequest(req);
            try {
                getConnection(tenantId);
                next();
            } catch (err) {
                const tenantConfig = await this.tenantService.findTenantConfig(tenantId);
                if (!tenantConfig || !tenantConfig.dbHost) {
                    throw new Error(`Tenant Not Exists: ${tenantId}`);
                }
                const connectionOptions = getConnectionOptions(tenantId, tenantConfig);
                const createdConnection: Connection = await createConnection(connectionOptions);
                if (createdConnection) {
                    next();
                } else {
                    throw new Error(
                        `Database Connection Error,
                         There is a Error with the Database!`,
                    );
                }
            }
        }).forRoutes('*');
    }
}

