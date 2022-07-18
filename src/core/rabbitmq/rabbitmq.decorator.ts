import { Logger, SetMetadata } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Connection } from 'typeorm';
import { RedisClient } from '../redis/redis.client';

export const DlxMessageDecorator = (topic) => SetMetadata('DlxMessageHandler', topic);

export interface RabbitmqContext {
    conn: Connection,
    client: ClientProxy,
    logger: Logger,
    redis: RedisClient,
    tenantId: string,
    contextId: number,
    ts: number,
}

export interface DlxMessageProvider {
    handle(message: object | string, context: RabbitmqContext): Promise<string>;
}
