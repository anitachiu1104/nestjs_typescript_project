import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_role')
export class MgRoleEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'desc' })
    desc: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'type' })
    type: number;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
}
