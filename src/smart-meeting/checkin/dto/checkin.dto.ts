import { IsEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckinDto {
    @IsString()
    spaceCode: string;
    @IsString()
    @IsOptional()
    code: string;
    @IsNumber()
    @IsEmpty()
    @IsOptional()
    userId: number;
}
