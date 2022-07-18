import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('mg_tasklist')
export class MgTasklistEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'status' })
    status: number;
    @Column({ name: 'data' })
    data: string;
    @Column({ name: 'cron_express' })
    cronExpress: string;
    @Column({ name: 'last_result' })
    lastResult: string;
    @Column({ name: 'comment' })
    comment: string;
    @Column({ name: 'next_run_time' })
    nextRunTime: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
}