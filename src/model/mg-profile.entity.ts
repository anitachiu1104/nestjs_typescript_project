import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_profile')
export class MgProfileEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'value1' })
    value1: string;
    @Column({ name: 'value2' })
    value2: string;
    @Column({ name: 'value3' })
    value3: string;
    @Column({ name: 'comment' })
    comment: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'update_by' })
    updateBy: number;
}
