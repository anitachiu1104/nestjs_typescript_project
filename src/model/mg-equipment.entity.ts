import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mg_equipment' })
export class MgEquipmentEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'name' })
    name: string;
    @Column({ name: 'ctype_id' })
    ctypeId: number;
    @Column({ name: 'code' })
    code: string;
    @Column({ name: 'space_id' })
    spaceId: number;
    @Column({ name: 'status' })
    status: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'is_delete' })
    isDelete: string;
    @Column({ name: 'create_by' })
    createBy: string;
}
