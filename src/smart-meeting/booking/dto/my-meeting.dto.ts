import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PageInterface } from '../../../core/page/page.interface';
export class MyMeetingDto {
/*       @IsNumber()
       @IsOptional()
       userId: number;*/
       //会议名称
       @IsNotEmpty()
       @IsOptional()
       meetingName: string;
       //会议状态
       @IsNotEmpty()
       @IsOptional()
       meetingState: number;
       //时间周期
       @IsNotEmpty()
       @IsOptional()
       timeType: number;
       //主持人
       @IsNotEmpty()
       @IsOptional()
       moderator: string;
       //会议主题
       @IsNotEmpty()
       @IsOptional()
       topic: string;
       //会议所属
       @IsNotEmpty()
       @IsOptional()
       belongingType:number;
       page: PageInterface;

}