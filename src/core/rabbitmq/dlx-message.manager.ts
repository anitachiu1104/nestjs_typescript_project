import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as amqp from 'amqplib';
import * as AsyncLock from 'async-lock';
import { getConnection, QueryRunner } from 'typeorm';
import { MqConsumersEntity } from '../../model/mq_consumers.entity';
import { getRpcClient } from '../client/rpc-client.manager';
import { MyLogger } from '../my-logger/my-logger';
import { getRedisClient } from '../redis/redis.manager';
import { DlxMessageProvider } from './rabbitmq.decorator';
import * as moment from 'moment';

@Injectable()
export class DlxMessageManager {
    private readonly dlxMessageMap: Map<string, DlxMessageProvider> = new Map<string, DlxMessageProvider>();
    private readonly dlxChannelMap: Map<string, amqp.Channel> = new Map();
    private readonly lock: AsyncLock = new AsyncLock();

    registerDlxMessageProvider(name: string, provider: DlxMessageProvider): void {
        this.dlxMessageMap.set(name, provider);
    }

    setChannel(tenantId: string, channel: amqp.Channel): void {
        this.dlxChannelMap.set(tenantId, channel);
    }

    getChannel(tenantId: string): amqp.Channel {
        return this.dlxChannelMap.get(tenantId);
    }

    private static async updateMessageState(dbSession: QueryRunner, logger: MyLogger, contextId: number, data: any) {
        try {
            await dbSession.manager
                .getRepository(MqConsumersEntity)
                .update({
                    id: contextId
                }, data);
        } catch (e) {
            logger.error(e)
        }
    }

    async createChanel(tenantId: string, connection: amqp.Connection): Promise<amqp.Channel> {
        return await this.lock.acquire<amqp.Channel>(tenantId, async () => {
            if (this.getChannel(tenantId)) {
                return this.getChannel(tenantId);
            }
            const exchange = 'wism_booking-delayed-exchange';
            const exchangeType = 'x-delayed-message';
            const queueName = 'wism_booking-delayed-queue';
            const routingKey = 'wism_booking-delayed-routingkey';
            const ch = await connection.createChannel();
            Logger.log('DlxMessage Channel Create Success', tenantId);
            await ch.assertExchange(exchange, exchangeType, {
                durable: true,
                arguments: {
                    'x-delayed-type': 'direct',
                    'x-max-length': 60000,
                    'x-overflow': 'reject-publish'
                }
            });
            await ch.assertQueue(queueName, { exclusive: false });
            await ch.bindQueue(queueName, exchange, routingKey);
            await ch.consume(queueName, async msg => {
                const logger = new MyLogger(tenantId);
                let dbSession: QueryRunner = await getConnection(tenantId).createQueryRunner();
                let contextId: number;

                try {
                    const msgObj = JSON.parse(msg.content.toString()) || {};
                    const topic = msgObj.topic;
                    contextId = msgObj.contextId;
                    const ts = msgObj.ts;

                    if (moment().valueOf() - ts > 10000) {
                        logger.error(`[AMQP] dlxMessage Error: messageid=${contextId} 消息过期!`);
                        return;
                    }

                    if (!contextId) {
                        logger.error('[AMQP] dlxMessage Error: contextId not found!')
                        return;
                    }

                    if (!topic) {
                        throw new Error('[AMQP] dlxMessage Error: topic not found!');
                    }

                    const provider = this.dlxMessageMap.get(topic);

                    if (!provider) {
                        throw new Error(`[AMQP] dlxMessage Error: topic:${topic},未找到消费者!`);
                    }

                    await provider.handle.call(provider, msgObj.data, {
                        logger,
                        conn: dbSession.manager,
                        client: getRpcClient(tenantId) as ClientProxy,
                        redis: getRedisClient(tenantId),
                        tenantId,
                        contextId
                    });
                    await DlxMessageManager.updateMessageState(dbSession, logger, contextId, { state: 1 });
                } catch (err) {
                    logger.error(err);
                    await DlxMessageManager.updateMessageState(dbSession, logger, contextId, {
                        state: 2,
                        failReason: (typeof err === 'string' ? err : err.message).substring(0, 200)
                    });
                } finally {
                    try {
                        msg && ch.ack(msg);
                    } catch (ackErr) {
                        logger.error(`DlxMessageHandle Ack Failed: ${ackErr}`);
                    }
                    dbSession && !dbSession.isReleased && dbSession.release().then(undefined).catch(e => {
                        logger.error(`DlxMessageHandle Release Connection Failed: ${e}`);
                    });
                }
            });
            this.setChannel(tenantId, ch);
            return ch;
        });
    }
}
