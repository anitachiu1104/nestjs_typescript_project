import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hot_desking_checkin')
export class HotDeskingCheckInEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ name: 'booking_id' })
    bookingId: number;
    @Column({ name: 'user_id' })
    userId: number;
    @Column({ name: 'create_time' })
    createTime: string;
    @Column({ name: 'create_by' })
    createBy: string;
    @Column({ name: 'is_delete' })
    isDelete: number;
}
