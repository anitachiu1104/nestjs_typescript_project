import { GrpcClientModule } from './core/grpc/grpc-client.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RouterModule } from 'nest-router';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BuildingModule } from './building/building.module';
import { ClientModule } from './core/client/client.module';
import { ConfigModule } from './core/config/config.module';
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import { MyLoggerModule } from './core/my-logger/my-logger.module';
import { RabbitmqModule } from './core/rabbitmq/rabbitmq.module';
import { RedisModule } from './core/redis/redis.module';
import { TenantModule } from './core/tenant/tenant.module';
import { DemoModule } from './demo/demo.module';
import { HotDeskingModule, hotDeskingRoutes } from './hot-desking/hot-desking.module';
import { MgOperationModule } from './operation/mg-operation.module';
import { ProfileModule } from './profile/profile.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SmartMeetingModule, smartMeetingRoutes } from './smart-meeting/smart-meeting.module';
import { UserModule } from './user/user.module';
import { WechatworkModule } from './wechatwork/wechatwork.module';
import { WebsocketModule } from './websocket/websocket.module';



@Module({
    imports: [
        RouterModule
        .forRoutes(hotDeskingRoutes),
        RouterModule
        .forRoutes(smartMeetingRoutes),
        ScheduleModule,
        MyLoggerModule,
        RedisModule,
        RabbitmqModule,
        MgOperationModule,
        ConfigModule,
        ClientModule,
        AuthModule,
        TenantModule,
        UserModule,
        BuildingModule,
        HotDeskingModule,
        SmartMeetingModule,
        DemoModule,
        WechatworkModule,
        ProfileModule,
        GrpcClientModule,
        WebsocketModule
    ],
    controllers: [
        AppController
    ],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes('/');
    }
}
