import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';
import { DlxMessageManager } from './dlx-message.manager';
import { REQUEST } from '@nestjs/core';
import { getTenantIdByRequest } from '../tenant/tenant.util';
import { EntityManager } from 'typeorm';
import { MqConsumersEntity } from '../../model/mq_consumers.entity';
import * as moment from 'moment';
import { dateFormat } from '../../hot-desking/common/const';
import { MyLogger } from '../my-logger/my-logger';
import { dlxExchange, dlxRoutingKey } from './rabbitmq.const';

@Injectable()
export class RabbitmqService {
    @Inject('MQCONNECTION')
    private readonly conn: amqp.Connection;
    @Inject(REQUEST)
    private readonly req;
    @Inject()
    private readonly entityManager: EntityManager;
    @Inject()
    private readonly dlxMessageManager: DlxMessageManager;
    @Inject()
    private readonly logger: MyLogger;

    async producerDLX<T>(topic: string, data: T, expiration: number, businessId?: number): Promise<boolean> {
        const now = moment();
        try {
            const { id: contextId } = await this.entityManager
                .getRepository(MqConsumersEntity)
                .save({
                  event: topic,
                  triggerTime: moment((now.valueOf() + expiration)).format(dateFormat),
                  state: 0,
                  retry: 3,
                  data: JSON.stringify(data),
                  createTime: now.format(dateFormat),
                  updateTime: now.format(dateFormat),
                  businessId,
                  createBy: 'system'
                });

            if (expiration > Math.pow(2, 32) - 1) {
                this.logger.warn(`delay message ${contextId} over max, it will run by task!`);
                return undefined;
            }

            const tenantId = getTenantIdByRequest(this.req);

            let ch;
            if (this.dlxMessageManager.getChannel(tenantId)) {
                ch = this.dlxMessageManager.getChannel(tenantId);
            } else {
                ch = await this.dlxMessageManager.createChanel(tenantId, this.conn);
            }

            const result = await ch.publish(
                dlxExchange,
                dlxRoutingKey,
                Buffer.from(JSON.stringify({
                    topic,
                    data,
                    contextId,
                    ts: now.valueOf() + expiration
                })), {
                    headers: {
                    'x-delay': expiration
                    }
                });
            if (!result) return Promise.reject('message send failed');
        } catch (err) {
            return Promise.reject(err);
        }
    }

}
