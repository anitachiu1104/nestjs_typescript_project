import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mq_consumers' })
export class MqConsumersEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'event' })
    event: string;
    @Column({ name: 'trigger_time' })
    triggerTime: string;
    @Column({ name: 'state' })
    state: number;
    @Column({ name: 'retry' })
    retry: number;
    @Column({ name: 'data' })
    data: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'fail_reason' })
    failReason: string;
    @Column({ name: 'business_id' })
    businessId: number;
}
