import { MiddlewareConsumer, Module, NestModule, OnModuleInit, Scope } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService, REQUEST } from '@nestjs/core';
import * as amqp from 'amqplib';
import { TenantService } from '../tenant/tenant.service';
import { getTenantIdByRequest } from '../tenant/tenant.util';
import { DlxMessageManager } from './dlx-message.manager';
import { createMqClient, getMqClient } from './rabbitmq.manager';
import { RabbitmqService } from './rabbitmq.service';


@Module({
    imports: [DiscoveryModule],
    controllers: [],
    providers: [
        RabbitmqService,
        DlxMessageManager,
        {
            scope: Scope.REQUEST,
            provide: 'MQCONNECTION',
            useFactory: async (
                req,
            ): Promise<amqp.Connection> => {
                try {
                    const tenantId = getTenantIdByRequest(req);
                    return getMqClient(tenantId);
                } catch (err) {
                    return Promise.reject(err);
                }
            },
            inject: [REQUEST],
        },
    ],
    exports: [
        RabbitmqService
    ]
})

export class RabbitmqModule implements OnModuleInit, NestModule {
    private readonly discoveryService: DiscoveryService;
    private readonly dlxMessageManager: DlxMessageManager;
    constructor(discoveryService: DiscoveryService, dlxMessageManager: DlxMessageManager, private readonly tenantService: TenantService) {
        this.discoveryService = discoveryService;
        this.dlxMessageManager = dlxMessageManager;
    }
    onModuleInit() {
        const wrappers = this.discoveryService.getProviders();

        for (let wrapper of wrappers) {
            if (wrapper.metatype) {
                const topic = Reflect.getMetadata('DlxMessageHandler', wrapper.metatype);
                if (!topic) continue;
                this.dlxMessageManager.registerDlxMessageProvider(topic, wrapper.instance);
            }
        }
    }

    configure(consumer: MiddlewareConsumer): any {
        consumer.apply(async (req, res, next) => {
            const tenantId = getTenantIdByRequest(req);

            try {
                getMqClient(tenantId);
                next();
            } catch (e) {
                const tenantConfig = await this.tenantService.findTenantConfig(tenantId);
                if (!tenantConfig.rabbitmqHost) {
                    throw new Error(`Tenant Not Exists: ${tenantId}`);
                }
                await createMqClient(tenantId, tenantConfig);
                next();
            }
        }).forRoutes('*');
    }
}
