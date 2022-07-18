import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *   smart_meeting_attendee 参会人实体类
 */
@Entity('smart_meeting_attendee')
export class SmartMeetingAttendee {
       //主键Id自增
       @PrimaryGeneratedColumn({ name:'id' })
       id: number;
       //预定id
       @Column({ name:'booking_id' })
       bookingId: number;
       //邀请人
       @Column({ name:'invite_id' })
       inviteId: number;
       //参会人id
       @Column({ name:'user_id' })
       userId: number;
       //参会人名字
       @Column({ name:'user_name' })
       userName: string;
       //用户邮箱
       @Column({ name:'email' })
       email: string;
       //用户手机
       @Column({ name:'phone' })
       phone: string;
       //用户类别
       @Column({ name:'user_type' })
       userType: number;
       //接受类别
       @Column({ name:'accept' })
       accept: number;
       //接受类别
       @Column({ name:'role' })
       role: number;
       //创建时间
       @Column({ name:'create_time' })
       createTime: string;
       //更新时间
       @Column({ name:'update_time' })
       updateTime: string;
       @Column({ name:'create_by' })
       createBy: string;
       //伪删除
       @Column({ name:'is_delete' })
       isDelete: number;
}