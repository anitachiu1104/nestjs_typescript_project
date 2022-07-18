import { Injectable } from '@nestjs/common';
import { ScheduleMeta } from './schedule.decorator';
import { Job } from 'node-schedule';

@Injectable()
export class ScheduleManager {
    private readonly scheduleMetaMap: Map<string, ScheduleMeta>
        = new Map<string, ScheduleMeta>();

    private readonly scheduleJobMap: Map<string, Job>
        = new Map<string, Job>();

    setScheduleJob(tenantId: string, name: string, scheduleJob: Job) {
        this.scheduleJobMap.set(`${tenantId}:${name}`, scheduleJob);
    }

    getScheduleJob(tenantId: string, name: string) {
        return this.scheduleJobMap.get(`${tenantId}:${name}`);
    }

    registerScheduleProvider(key: string, scheduleMeta: ScheduleMeta) {
        this.scheduleMetaMap.set(key, scheduleMeta);
    }

    has(name: string): boolean {
        return !!this.scheduleMetaMap.get(name);
    }

    get(name: string): ScheduleMeta {
        const meta = this.scheduleMetaMap.get(name);
        if (!meta) {
            throw new Error(`Schedule Error: ${name} Not Found!`);
        }
        return meta;
    }
}
