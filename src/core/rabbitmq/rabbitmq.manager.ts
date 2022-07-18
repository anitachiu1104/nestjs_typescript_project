import * as amqp from 'amqplib';
import { Logger } from '@nestjs/common';
import { TenantConfig } from '../tenant/tenant.config';
import * as AsyncLock from 'async-lock';

export function getMqClient(tenantId: string): amqp.Connection {
  return RabbitmqManager.getInstance().get(tenantId);
}

export function createMqClient(
  tenantId: string,
  tenantConfig: TenantConfig,
): Promise<amqp.Connection> {
  return RabbitmqManager.getInstance().createConnection(tenantId, tenantConfig);
}

export class RabbitmqManager {
  private readonly logger: Logger = new Logger();
  private readonly connectionMap: Map<string, amqp.Connection> = new Map<
    string,
    amqp.Connection
  >();
  private static instance: RabbitmqManager = new RabbitmqManager();
  private readonly lock: AsyncLock = new AsyncLock();

  private constructor() {}

  static getInstance(): RabbitmqManager {
    return RabbitmqManager.instance;
  }

  has(tenantId: string): boolean {
    return !!this.connectionMap.get(tenantId);
  }

  get(tenantId: string): amqp.Connection {
    const connection = this.connectionMap.get(tenantId);
    if (!connection) {
      throw new Error(
        `RabbitmqConnectionNotFoundError: Connection ${tenantId} was not found.`,
      );
    }
    return connection;
  }

  async destroy(tenantId: string): Promise<void> {
    if (this.has(tenantId)) {
      await this.get(tenantId).close();
    }
    this.connectionMap.set(tenantId, null);
  }

  async createConnection(
    tenantId: string,
    tenantConfig: TenantConfig,
  ): Promise<amqp.Connection> {
    return await this.lock.acquire<amqp.Connection>(tenantId, async () => {
      let connection = null;
      if (this.has(tenantId)) {
        return this.get(tenantId);
      }
      try {
        connection = await amqp.connect(
          {
            protocol: 'amqp',
            hostname: tenantConfig.rabbitmqHost,
            port: Number(tenantConfig.rabbitmqPort),
            username: tenantConfig.rabbitmqUsername,
            password: tenantConfig.rabbitmqPassword,
            heartbeat: 60,
            vhost: `${tenantId}`,
          },
          {
            reconnect: true,
            reconnectBackoffStrategy: 'linear',
            reconnectExponentialLimit: 120000,
            reconnectBackoffTime: 1000,
          },
        );

        Logger.log('AMQP Connection Create Success', tenantId);

        connection.on('error', (err) => {
          if (err.message !== 'Connection closing') {
            this.logger.error(
              `[AMQP] teanantid:${tenantId} conn error ${err.message}`,
            );
          }
        });

        connection.on('close', (err) => {
          this.logger.error(`[AMQP] tenantId:${tenantId} reconnecting: ${err}`);
          return setTimeout(
            this.createConnection.bind(this, tenantId, tenantConfig),
            3000,
          );
        });

        this.connectionMap.set(tenantId, connection);
      } catch (e) {
        console.log('catchcatchcatchcatch');
        this.logger.error(`[AMQP] tenantId:${tenantId} reconnecting: ${e}`);
        setTimeout(
          this.createConnection.bind(this, tenantId, tenantConfig),
          3000,
        );
      }
      return connection;
    });
  }
}
