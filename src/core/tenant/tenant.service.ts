import { Inject, Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { ConfigService } from '../config/config.service';
import { TenantConfig } from './tenant.config';

@Injectable()
export class TenantService {
  @Inject()
  private configService: ConfigService;
  async findTenantConfig(tenantId: string): Promise<TenantConfig> {
    console.log(this.configService.get(tenantId + '_' + 'DB_TYPE'));
    console.log(this.configService.get(tenantId + '_' + 'DB_PASSWORD'));
    return _.defaults(
      {
        dbType: this.configService.get(tenantId + '_' + 'DB_TYPE'),
        dbHost: this.configService.get(tenantId + '_' + 'DB_HOST'),
        dbPort: this.configService.get(tenantId + '_' + 'DB_PORT'),
        dbUsername: this.configService.get(tenantId + '_' + 'DB_USERNAME'),
        dbPassword: this.configService.get(tenantId + '_' + 'DB_PASSWORD'),
        dbDatabase: this.configService.get(tenantId + '_' + 'DB_DATABASE'),
        dbConnectionLimit: this.configService.get(
          tenantId + '_' + 'DB_CONNECTION_LIMIT',
        ),
        rabbitmqHost: this.configService.get(tenantId + '_' + 'RABBITMQ_HOST'),
        rabbitmqPort: this.configService.get(tenantId + '_' + 'RABBITMQ_PORT'),
        rabbitmqUsername: this.configService.get(
          tenantId + '_' + 'RABBITMQ_USERNAME',
        ),
        rabbitmqPassword: this.configService.get(
          tenantId + '_' + 'RABBITMQ_PASSWORD',
        ),
        redisHosts: this.configService.get('REDIS_HOSTS'),
        redisPassword: this.configService.get('REDIS_PASSWORD'),
      },
      {
        dbType: process.env[`${tenantId}_DB_TYPE`],
        dbHost: process.env[`${tenantId}_DB_HOST`],
        dbPort: Number(process.env[`${tenantId}_DB_PORT`]),
        dbUsername: process.env[`${tenantId}_DB_USERNAME`],
        dbPassword: process.env[`${tenantId}_DB_PASSWORD`],
        dbDatabase: process.env[`${tenantId}_DB_DATABASE`],
        dbConnectionLimit: Number(
          process.env[`${tenantId}_DB_CONNECTION_LIMIT`],
        ),
        rabbitmqHost: process.env[`${tenantId}_RABBITMQ_HOST`],
        rabbitmqPort: Number(process.env[`${tenantId}_RABBITMQ_PORT`]),
        rabbitmqUsername: process.env[`${tenantId}_RABBITMQ_USERNAME`],
        rabbitmqPassword: process.env[`${tenantId}_RABBITMQ_PASSWORD`],
        redisHosts: process.env[`REDIS_HOSTS`],
        redisPassword: process.env[`REDIS_PASSWORD`],
      },
    );
  }
}
