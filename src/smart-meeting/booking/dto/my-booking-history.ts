import { IsNotEmpty, IsOptional } from 'class-validator';
import { PageInterface } from '../../../core/page/page.interface';
/**
 *  历史会议实体类
 */
export class MyBookingHistory {
    //释放方式
    @IsNotEmpty()
    @IsOptional()
    releaseType:number;
    //会议所属
    @IsNotEmpty()
    @IsOptional()
    belongingType:number;
    //时间周期
    @IsNotEmpty()
    @IsOptional()
    timeType: number;
    page: PageInterface;
    //主题
    topic:string;
}