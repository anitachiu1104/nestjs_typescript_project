import { MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RedisClient } from './redis.client';
import { createRedisClient, getRedisClient } from './redis.manager';
import { TenantService } from '../tenant/tenant.service';
import { getTenantIdByRequest } from '../tenant/tenant.util';

@Module({
  imports: [],
  providers: [
    {
      provide: RedisClient,
      useFactory: async (req) => {
        const tenantId = getTenantIdByRequest(req);
        return getRedisClient(tenantId);
      },
      scope: Scope.REQUEST,
      inject: [REQUEST],
    },
  ],
  exports: [RedisClient],
})
export class RedisModule implements NestModule {
  constructor(private readonly tenantService: TenantService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(async (req, res, next) => {
        const tenantId = getTenantIdByRequest(req);
        try {
          getRedisClient(tenantId);
          next();
        } catch (err) {
          const tenantConfig = await this.tenantService.findTenantConfig(
            tenantId,
          );
          if (!tenantConfig || !tenantConfig.redisHosts) {
            throw new Error(`Tenant Not Exists: ${tenantId}`);
          }
          console.log(tenantConfig);
          await createRedisClient(tenantId, tenantConfig);
          next();
        }
      })
      .forRoutes('*');
  }
}
