/**
 * 预约会议记录Dto
 */
import { IsNumber } from 'class-validator';

export class extendMeetingDto {
    //bookingId
    @IsNumber()
    bookingId: number;
    //用户Id
    userId: number;
    buId: number;
    flId: number;
    //会议室Id
    spaceId: number;
    //开始时间
    startTime: string;
    //结束时间
    endTime: string;
    extendTime: string;
}