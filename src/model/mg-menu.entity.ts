import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mg_menu')
export class MgMenuEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'is_valid' })
    isValid: number;
    @Column({ name: 'level' })
    level: number;
    @Column({ name: 'p_id' })
    pId: number;
    @Column({ name: 'rank' })
    rank:number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
}
