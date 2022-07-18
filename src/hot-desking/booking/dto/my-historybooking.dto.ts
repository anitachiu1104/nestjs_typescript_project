import {PageInterface} from "../../../core/page/page.interface";
import { IsNumber } from 'class-validator';

/**
 * 历史预定记录
 */
export class MyhistoryBookingDto {
        //用户userId
        @IsNumber()
        userId: number;
        //大楼Id
        buId: number;
        //楼层Id
        flId:number;
        //空间Id
        areaId: number;
        //结束时间周期
        timeType: number;
        //预定方式
        type: string;
        //预定类型
        type2: string;
        page: PageInterface;
}