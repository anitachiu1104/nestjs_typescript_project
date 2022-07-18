import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sys_area' })
export class SysAreaEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'bu_id' })
    buId: number;
    @Column({ name: 'fl_id' })
    flId: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'area' })
    area: number;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'dimension_x' })
    dimensionX: number;
    @Column({ name: 'dimension_y' })
    dimensionY: number;
    @Column({ name: 'width' })
    width: number;
    @Column({ name: 'length' })
    length: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
}