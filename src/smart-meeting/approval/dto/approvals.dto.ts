import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { PageInterface } from '../../../core/page/page.interface';

export class ApprovalsDto {
    @IsNumber()
    @IsOptional()
    spaceId: number;
    @IsArray()
    @IsOptional()
    userId: any;
    @IsString()
    @IsOptional()
    topic: string;
    @IsNumber()
    @IsOptional()
    bookingTime: number;
    @IsNumber()
    confirm: number;
    page: PageInterface;
    @IsString()
    @IsOptional()
    moderatorName: string;
}