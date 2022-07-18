import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sys_floor' })
export class SysFloorEntity {
    @PrimaryGeneratedColumn({ name: 'fl_id' })
    flId: number;
    @Column({ name: 'bu_id' })
    buId: number;
    @Column({ name: 'fl_name' })
    flName: string;
    @Column({ name: 'fl_area' })
    flArea: number;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
}