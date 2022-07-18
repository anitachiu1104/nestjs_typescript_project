import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mg_repair' })
export class MgRepairEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;
    @Column({ name: 'space_id' })
    spaceId: number;
    @Column({ name: 'proof_path' })
    proofPath: string;
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
    @Column({ name: 'user_id' })
    userId: number;
}