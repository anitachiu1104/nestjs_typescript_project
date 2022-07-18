import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FloorBookingDto {
    @IsNotEmpty()
    @IsNumber()
    buId: number;
    @IsNotEmpty()
    @IsNumber()
    flId: number;
    @IsNotEmpty()
    @IsString()
    startTime: string;
    @IsNotEmpty()
    @IsString()
    endTime: string;
}