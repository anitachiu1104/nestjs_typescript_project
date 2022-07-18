import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mg_depart' })
export class MgDepartEntity {
    @PrimaryGeneratedColumn({ name: 'de_id' })
    deId: number;
    @Column({ name: 'de_name' })
    deName: string;
    @Column({ name: 'des' })
    des: string;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'fl_id' })
    flId: number;
    @Column({ name: 'bu_id' })
    buId: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'parent_id' })
    parentId: number;
}
