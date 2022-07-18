import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageInterface } from '../../../core/page/page.interface';
/**
 * 会议室列表Dto
 */
export class PositionQueryDto {
       @IsNumber()
       buId: number;
       @IsNumber()
       flId: number;
       @IsNumber()
       @IsOptional()
       areaId: number;
       @IsArray()
       @IsOptional()
       ctypeIdList?: [];
       @IsNumber()
       @IsOptional()
       seatingCapacity?:number;
       @IsNumber()
       @IsOptional()
       state:number;
       @IsString()
       @IsOptional()
       spaceName:string;
       page: PageInterface;
}