import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('smart_meeting_checkin')
export class SmartMeetingCheckinEntity {
  //主键Id自增
  @PrimaryGeneratedColumn({ name:'id' })
  id: number;
  @Column({ name: 'booking_id' })
  bookingId: number;
  @Column({ name: 'attendee_id' })
  attendeeId: number;
  @Column({ name: 'create_time' })
  createTime: string;
  @Column({ name: 'create_by' })
  createBy: string;
  @Column({ name: 'is_delete' })
  isDelete: number;
}