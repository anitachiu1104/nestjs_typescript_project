import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { ConfigModule } from '../core/config/config.module';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from "../core/redis/redis.module";
import { MgOperationModule } from '../operation/mg-operation.module';


@Module({
    imports: [
        RedisModule,
        AuthModule,
        ConfigModule,
        MgOperationModule
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService]
})
export class UserModule {}
