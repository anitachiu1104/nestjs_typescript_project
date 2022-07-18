import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';

export class BookingDto {
    @PrimaryGeneratedColumn()
    id: number;
    @IsNotEmpty()
    @IsNumber()
    buId: number;
    @IsNotEmpty()
    @IsNumber()
    flId: number;
    areaId: number;
    @IsNotEmpty()
    @IsNumber()
    spaceId: number;
    @IsString()
    @IsNotEmpty()
    startTime: string;
    @IsString()
    @IsNotEmpty()
    endTime: string;
    @IsNumber()
    @IsNotEmpty()
    userId: number;
    user2Id: number;
    userName: string;
}
