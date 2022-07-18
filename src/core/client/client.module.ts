import {
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '../config/config.module';
import { getTenantIdByRequest } from '../tenant/tenant.util';
import { ConfigService } from '../config/config.service';
import { createRpcClient, getRpcClient } from './rpc-client.manager';
import { TenantService } from '../tenant/tenant.service';

function getClientProxyConfig(service: string): any {
  return async (configService: ConfigService): Promise<any> => {
    // console.log(service);

    const serviceUrl = configService.get(service);
    console.log(service + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + serviceUrl);
    if (!serviceUrl) {
      return {};
    }
    const [host, port] = serviceUrl.split(':');
    if (!host || !port) {
      return Promise.reject(
        `${
          configService.get('SERVER_NAME') || 'wism_booking'
        } service config error!`,
      );
    }
    return {
      transport: Transport.TCP,
      options: { host, port, retryAttempts: 30, retryDelay: 30000 },
    };
  };
}

const dmsModule = ClientsModule.registerAsync([
  {
    name: 'DMS_SERVICE',
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getClientProxyConfig('DMS_SERVICE'),
  },
]);

const wechatWorkModule = ClientsModule.registerAsync([
  {
    name: 'WECHATWORK_SERVICE',
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getClientProxyConfig('WECHATWORK_SERVICE'),
  },
]);

const smsModule = ClientsModule.registerAsync([
  {
    name: 'SMS_SERVICE',
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getClientProxyConfig('SMS_SERVICE'),
  },
]);

const officeModule = ClientsModule.registerAsync([
  {
    name: 'OFFICE_SERVICE',
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: getClientProxyConfig('OFFICE_SERVICE'),
  },
]);

const clientFactory = {
  provide: ClientProxy,
  scope: Scope.REQUEST,
  useFactory: async (req) => {
    const tenantId = getTenantIdByRequest(req);
    return getRpcClient(tenantId);
  },
  inject: [REQUEST],
};

@Global()
@Module({
  imports: [dmsModule, wechatWorkModule, smsModule, officeModule],
  controllers: [],
  providers: [clientFactory],
  exports: [clientFactory],
})
export class ClientModule implements NestModule {
  constructor(
    @Inject('DMS_SERVICE') private readonly dmsService: ClientProxy,
    @Inject('WECHATWORK_SERVICE')
    private readonly wechatWorkService: ClientProxy,
    @Inject('SMS_SERVICE') private readonly smsService: ClientProxy,
    @Inject('OFFICE_SERVICE') private readonly officeService: ClientProxy,
    private readonly tenantService: TenantService,
  ) {}
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(async (req, res, next) => {
        const tenantId = getTenantIdByRequest(req);
        try {
          getRpcClient(tenantId);
          next();
        } catch (e) {
          const tenantConfig = await this.tenantService.findTenantConfig(
            tenantId,
          );
          if (!tenantConfig || !tenantConfig.dbHost) {
            throw new Error(`Tenant Not Exists: ${tenantId}`);
          }
          const serviceMap = new Map<string, ClientProxy>();
          serviceMap.set('DMS_SERVICE', this.dmsService);
          serviceMap.set('WECHATWORK_SERVICE', this.wechatWorkService);
          serviceMap.set('SMS_SERVICE', this.smsService);
          serviceMap.set('OFFICE_SERVICE', this.officeService);
          await createRpcClient(tenantId, serviceMap);
          next();
        }
      })
      .forRoutes('*');
  }
}
