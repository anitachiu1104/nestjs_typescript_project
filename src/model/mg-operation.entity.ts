import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_operation')
export class MgOperationEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ name: 'user_id' })
    userId: number;
    @Column({ name: 'type' })
    type: string;
    @Column({ name: 'comment' })
    comment: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
}
