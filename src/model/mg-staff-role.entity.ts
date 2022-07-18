import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_staff_role')
export class MgStaffRoleEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'role_id' })
    roleId: number;
    @Column({ name: 'user_id' })
    userId: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
}
