import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { RedisModule } from '../core/redis/redis.module';


@Module({
    imports: [RedisModule],
    controllers: [],
    providers: [ProfileService],
    exports: [ProfileService]
})
export class ProfileModule {
}
