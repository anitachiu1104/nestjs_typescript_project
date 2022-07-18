import { Logger } from '@nestjs/common';
import * as AsyncLock from 'async-lock';
import * as Redis from 'ioredis';
import { TenantConfig } from '../tenant/tenant.config';
import { RedisClient } from './redis.client';

export function getRedisClient(tenantId: string): RedisClient {
  return RedisManager.getInstance().get(tenantId);
}

export async function createRedisClient(
  tenantId: string,
  tenantConfig: TenantConfig,
): Promise<RedisClient> {
  return RedisManager.getInstance().createClient(tenantId, tenantConfig);
}

export class RedisManager {
  private readonly redisClientMap: Map<string, RedisClient> = new Map<
    string,
    RedisClient
  >();
  private static instance;
  private readonly lock: AsyncLock = new AsyncLock();

  private constructor() {}

  public static getInstance(): RedisManager {
    if (RedisManager.instance) {
      return RedisManager.instance;
    } else {
      RedisManager.instance = new RedisManager();
      return RedisManager.instance;
    }
  }

  public has(tenantId: string): boolean {
    return !!this.redisClientMap.get(tenantId);
  }

  public get(tenantId: string): RedisClient {
    if (!this.redisClientMap.get(tenantId)) {
      throw new Error(`Redis Error Not Found Client: ${tenantId}`);
    }
    return this.redisClientMap.get(tenantId);
  }

  destroy(tenantId: string): void {
    if (this.has(tenantId)) {
      this.get(tenantId).close();
    }
    this.redisClientMap.set(tenantId, null);
  }

  public async createClient(
    tenantId: string,
    tenantConfig: TenantConfig,
  ): Promise<RedisClient> {
    return await this.lock.acquire<RedisClient>(tenantId, async () => {
      if (this.has(tenantId)) {
        return this.get(tenantId);
      }

      const redisConf = tenantConfig.redisHosts;
      let hosts = [];
      redisConf.split(';').forEach((item) => {
        if (item.indexOf(':') > -1) {
          const uri = item.split(':');
          hosts.push({
            port: Number(uri[1]),
            host: uri[0],
          });
        }
        return false;
      });
      console.log(hosts);
      console.log(tenantConfig.redisPassword);
      const redisCluster =
        hosts.length > 1
          ? new Redis.Cluster(hosts, {
              redisOptions: { password: tenantConfig.redisPassword },
            })
          : new Redis(...hosts);

      const redisClient = new RedisClient(tenantId, redisCluster);
      Logger.log('Redis Client Create Success', tenantId);
      this.redisClientMap.set(tenantId, redisClient);
      return redisClient;
    });
  }
}
