/**
 *  MyMeetingVo
 */
export interface MyMeetingVo {
       bookingId:string;
       //会议室名称
       spaceName: string;
       //会议室类型
       spaceType: string;
       //主持人
       moderator: string;
       //会议主题
       topic: string;
       //预定时间
       createTime: string;
       //会议开始时间
       startTime: string;
       //会议结束时间
       endTime: string;
       //会议状态
       meetingState: string;
       //释放类型
       releaseType: string;
       //签到状态
       needCheckin: string;
}