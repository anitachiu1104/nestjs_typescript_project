import { Inject, Injectable } from '@nestjs/common';
import { RedisClient } from '../core/redis/redis.client';
import { MgProfileEntity } from '../model/mg-profile.entity';
import { EntityManager } from 'typeorm';


@Injectable()
export class ProfileService {
    @Inject()
    private readonly redisClient: RedisClient;
    @Inject()
    private readonly conn: EntityManager;

    async getProfile(code:string):Promise<MgProfileEntity>{
        let profileStr = await this.redisClient.get(`profile:`+code);
        let profile;
        let random = Math.round(Math.random()*100);
        if (!profileStr){
            profile = await this.conn.getRepository(MgProfileEntity).createQueryBuilder().where('code=:code',{code}).getOne();
            await this.redisClient.setEx(`profile:`+code, profile, 3600+random);
        }else {
            profile = JSON.parse(profileStr)
        }
        return profile;
    }
}