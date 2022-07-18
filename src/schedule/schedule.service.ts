import { EntityManager, getConnection, QueryRunner } from 'typeorm';
import { Inject, Injectable, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { ClientProxy } from '@nestjs/microservices';
import * as _ from 'lodash';
import * as schedule from 'node-schedule';
import { ConfigService } from "../core/config/config.service";
import { MyLogger } from '../core/my-logger/my-logger';
import { RedisClient } from '../core/redis/redis.client';
import { getTenantIdByRequest } from '../core/tenant/tenant.util';
import { ScheduleManager } from "./schedule.manager";
import { MgTasklistEntity } from '../model/mg-tasklist.entity';
import * as moment from 'moment';
import  * as cronParser from 'cron-parser'
import { rejects } from 'assert';
import { ScheduleDto } from './schedule.dto';

@Injectable({scope: Scope.REQUEST})
export class ScheduleService {
    @Inject(REQUEST)
    private readonly req;
    @Inject()
    private readonly client: ClientProxy;
    @Inject()
    private readonly scheduleManager: ScheduleManager;
    @Inject()
    private readonly configService: ConfigService;
    @Inject()
    private readonly redis: RedisClient;
    @Inject()
    private readonly conn: EntityManager;


    runTask(name: string, cron: string): string {
        if (this.configService.get('TASK_ENABLE') !== 'true') {
            throw new Error('Disabled schedule!');
        }
        const tenantId = getTenantIdByRequest(this.req);
        const logger = new MyLogger(tenantId);
        const scheduleMeta = this.scheduleManager.get(name);

        if (this.scheduleManager.getScheduleJob(tenantId, name) != null) {
            logger.error(`${tenantId}:${name} is running!`);
            return;
        }

        this.scheduleManager.setScheduleJob(tenantId, name, schedule.scheduleJob( cron || scheduleMeta.params.cron, async () => {
            const run = async () => {
                const dbSession: QueryRunner = await getConnection(tenantId).createQueryRunner();
                try {
                    await this.redis.setNx(`task:${name}`, 'running');
                    await dbSession.manager.getRepository(MgTasklistEntity).update(
                        {code:name},
                        {status: 1,updateTime:moment().format('YYYY-MM-DD HH:mm:ss')}
                    )
                    let result = await scheduleMeta.provider.handle.call({}, _.defaults(this.req.query, this.req.body), {
                        conn: dbSession.manager,
                        client: this.client,
                        logger
                    });
                    // await new Promise((resolve, reject) => {
                    //     setTimeout(() => {
                    //         resolve(undefined);
                    //     }, 10000);
                    // });
                    const nextInvocation = this.scheduleManager.getScheduleJob(tenantId, name).nextInvocation();
                    let nextTime = moment(nextInvocation.getTime()).format('YYYY-MM-DD HH:mm:ss');
                    console.log(nextTime);
                    await dbSession.manager.getRepository(MgTasklistEntity).update(
                        {code:name},
                        {status: 2,updateTime:moment().format('YYYY-MM-DD HH:mm:ss'),nextRunTime:nextTime,lastResult:result}
                    )
                } catch (e) {
                    logger.error(`${tenantId}:${name} is running!` + e);
                } finally {
                    dbSession && !dbSession.isReleased && dbSession.release().then(undefined).catch(e => {
                        logger.error(`ScheduleService Release Connection Failed: ${e}`);
                    });
                }
                await this.redis.del(`task:${name}`);
            };

            try {
                await run();
            } catch (e) {
                logger.error(e);
            }
        }));
        return 'success';
    }

    private static isFirst = true;
    async findAllTasks(): Promise<MgTasklistEntity[]> {
        const tasks = await this.conn.getRepository(MgTasklistEntity).createQueryBuilder().getMany();
        if (ScheduleService.isFirst) {
            for (let task of tasks) {
                if (task.status === 1 || task.status === 2) {
                    await this.startTask(task.id);
                }
            }
            ScheduleService.isFirst = false;
        }
        return tasks;
    }

    async startTask(id):Promise<string> {
        let task = await this.conn.getRepository(MgTasklistEntity).createQueryBuilder().where('id = :id',{id}).getOne();
        this.runTask(task.code, task.cronExpress);
        return 'success';
    }
    async stopTask(id):Promise<string> {
        let task = await this.conn.getRepository(MgTasklistEntity).createQueryBuilder().where('id = :id',{id}).getOne();
        const tenantId = getTenantIdByRequest(this.req);
        if ( this.scheduleManager.getScheduleJob(tenantId, task.code) != null){
            this.scheduleManager.getScheduleJob(tenantId, task.code).cancel();
            await this.redis.del(`task:${task.code}`);
        }
        await this.conn.getRepository(MgTasklistEntity).update(
            {id},
            {status: 3,updateTime:moment().format('YYYY-MM-DD HH:mm:ss'),nextRunTime:null}
        )
        return 'success';
    }
    async runTaskOnce(id):Promise<string> {
        const tenantId = getTenantIdByRequest(this.req);
        const logger = new MyLogger(tenantId);
        let task = await this.conn.getRepository(MgTasklistEntity).createQueryBuilder().where('id = :id',{id}).getOne();
        const scheduleMeta = this.scheduleManager.get(task.code);
        await scheduleMeta.provider.handle.call({}, _.defaults(this.req.query, this.req.body), {
            conn: this.conn,
            client: this.client,
            logger
        });
        return 'success';
    }
    async editTask(data:ScheduleDto):Promise<string> {
        const tenantId = getTenantIdByRequest(this.req);
        let task = await this.conn.getRepository(MgTasklistEntity).createQueryBuilder().where('id = :id',{id:data.id}).getOne();
        let nextTime = null;
        if ( this.scheduleManager.getScheduleJob(tenantId, task.code) != null){
            this.scheduleManager.getScheduleJob(tenantId, task.code).reschedule(data.cron);
            const nextInvocation = this.scheduleManager.getScheduleJob(tenantId, task.code).nextInvocation();
            nextTime = moment(nextInvocation.getTime()).format('YYYY-MM-DD HH:mm:ss');
        }
        console.log(nextTime);
        await this.conn.getRepository(MgTasklistEntity).update(
            {code:task.code},
            {updateTime:moment().format('YYYY-MM-DD HH:mm:ss'),nextRunTime:nextTime,cronExpress:data.cron}
        )
        return 'success';
    }
}
