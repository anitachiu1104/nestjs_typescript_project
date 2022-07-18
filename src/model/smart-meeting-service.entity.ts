import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *  smart_meeting_service 会议服务实体类
 */
@Entity('smart_meeting_service')
export class SmartMeetingService {
        //主键Id自增
        @PrimaryGeneratedColumn({ name:'id' })
        id: number;
        //预约id
        @Column({ name:'booking_id' })
        bookingId: number;
        //服务类型id
        @Column({ name:'ctype_id' })
        ctypeId: number;
        //备注
        @Column({ name:'comment' })
        comment: string;
        //费用
        @Column({ name:'cost' })
        cost: string;
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