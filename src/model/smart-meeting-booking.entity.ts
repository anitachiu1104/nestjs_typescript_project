import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
/**
 *   smart_meeting_booking 会议预定实体类
 */
@Entity('smart_meeting_booking')
export class SmartMeetingBooking {
      //主键Id自增
      @PrimaryGeneratedColumn({ name:'id' })
      id: number;
      //园区大厦id
      @Column({ name:'building_id' })
      buildingId: number;
      //楼层id
      @Column({ name:'floor_id' })
      floorId: number;
      //区域id
      @Column({ name:'area_id' })
      areaId: number;
      //会议室id
      @Column({ name:'space_id' })
      spaceId : number;
      //审批状态
      @Column({ name:'confirm' })
      confirm: number;
      //会议状态
      @Column({ name:'state' })
      state: number;
      //释放类型
      @Column({ name:'release_type' })
      releaseType: number;
      //预定类型
      @Column({ name:'type' })
      type: number;
      //预约开始时间
      @Column({ name:'start_time' })
      startTime: string;
      //预约结束时间
      @Column({ name:'end_time' })
      endTime: string;
      //用户开始使用时间
      @Column({ name:'use_start_time' })
      useStartTime: string;
      //用户结束使用时间
      @Column({ name:'use_end_time' })
      useEndTime: string;
      //会议主题
      @Column({ name:'topic' })
      topic: string;
      //主持人
      @Column({ name:'moderator' })
      moderator: string;
      //通知方式
      @Column({ name:'remind_type' })
      remindType: number;
      //是否签到
      @Column({ name:'need_checkin' })
      needCheckIn: number;
      //签到类型
      @Column({ name:'checkin_type' })
      checkinType: number;
      //有效签到时间
      @Column({ name:'effective_check_minutes' })
      effectiveCheckMinutes: number;
      //备注
      @Column({ name:'service_comment' })
      serviceComment: string;
      //备注
      @Column({ name:'comment' })
      comment: string;
      //预约人Id
      @Column({ name:'user_id' })
      userId: number;
      //创建时间
      @Column({ name:'create_time' })
      createTime: string;
      //更新时间
      @Column({ name:'update_time' })
      updateTime: string;
      //创建人
      @Column({ name:'create_by' })
      createBy: string;
      //伪删除
      @Column({ name:'is_delete' })
      isDelete: number;
}