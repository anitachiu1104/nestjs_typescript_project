import { IsNumber } from 'class-validator';
/**
 *  会议室预约记录Dto
 */
export class MyBookingDto {
        //大楼Id
        @IsNumber()
        buId: number;
        //楼层Id
        @IsNumber()
        flId:number;
        //会议室Id
        @IsNumber()
        spaceId:number;
        //空间Id
        areaId:number;
        //开始时间
        startTime: string;
        //结束时间
        endTime: string;
}