import { Inject, MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { getTenantIdByRequest } from '../tenant/tenant.util';
import { TenantService } from '../tenant/tenant.service';
import { createGRpcClient, getGRpcClient } from './grpc-client.manager';
import { GrpcClientWrapper } from './grpc-client.wrapper';

function getClientProxyConfig(service: string) :any {
    return async (configService: ConfigService) :Promise<any> => {
        const serviceUrl = process.env[`GRPC_${service}_URL`];
        if (!serviceUrl) {
            return {};
        }
        const [ host, port ] = serviceUrl.split(':');
        if (!host || !port)  {
            return Promise.reject(`${configService.get('SERVER_NAME') || 'wism_booking'} rpc-service config error!`);
        }
        return {
            transport: Transport.GRPC,
            options: {
              package: `wism_${service.toLowerCase()}`,
              protoPath: join(__dirname, `../../proto/${service.toLowerCase()}-service.proto`),
              url: serviceUrl
            }
          };
    }
}

const dmsRpcModule = ClientsModule.registerAsync([
    {
        name: 'GRPC_DMS_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: getClientProxyConfig('DMS')
    }
]);

const clientFactory = {
    provide: GrpcClientWrapper,
    scope: Scope.REQUEST,
    useFactory: async req => {
        const tenantId = getTenantIdByRequest(req);
        return getGRpcClient(tenantId);
    },
    inject: [REQUEST]
};

@Module({
    imports: [dmsRpcModule],
    controllers: [],
    providers: [clientFactory],
    exports: [clientFactory]
})
export class GrpcClientModule implements NestModule {
    constructor(@Inject('GRPC_DMS_CLIENT') private readonly dmsGrpcClient: ClientGrpc,
                private readonly tenantService: TenantService,
        ) {
    }
    configure(consumer: MiddlewareConsumer): any {
        consumer.apply(async (req, res, next) => {
            const tenantId = getTenantIdByRequest(req);
            try {
                getGRpcClient(tenantId);
                next();
            } catch (e) {
                const tenantConfig = await this.tenantService.findTenantConfig(tenantId);
                if (!tenantConfig || !tenantConfig.dbHost) {
                    throw new Error(`Tenant Not Exists: ${tenantId}`);
                }
                const clientGrpcsMap = new Map<string, ClientGrpc>();
                clientGrpcsMap.set('GRPC_DMS_SERVICE', this.dmsGrpcClient);
                await createGRpcClient(tenantId, clientGrpcsMap);
                next();
            }
        }).forRoutes('*');
    }
}
