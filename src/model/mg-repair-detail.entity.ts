import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mg_repair_detail' })
export class MgRepairDetailEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'pid' })
    pid: number;
    @Column({ name: 'space_id' })
    spaceId: number;
    @Column({ name: 'equipment_code' })
    equipmentCode: string;
    @Column({ name: 'type' })
    type: string;
    @Column({ name: 'state' })
    state: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'update_time' })
    updateTime: string;
    @Column({ name: 'user_id' })
    userId: number;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'proof_path' })
    proofPath: string;
    @Column({ name: 'comment' })
    comment: string;
}