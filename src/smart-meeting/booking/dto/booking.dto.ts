import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import {PrimaryGeneratedColumn} from "typeorm";
import { CustomTypeVo } from '../vo/customtype.vo';

export class BookingDto {
    @PrimaryGeneratedColumn()
    id: number;
    @IsString()
    @IsNotEmpty()
    topic: string;
    @IsNumber()
    @IsNotEmpty()
    spaceId: number;
    @IsNumber()
    @IsOptional()
    checkinType: number;
    @IsNotEmpty()
    @IsNumber()
    remindType: number;
    @IsNotEmpty()
    @IsString()
    startTime: string;
    @IsNotEmpty()
    @IsString()
    endTime: string;
    @IsNotEmpty()
    isCycle: number;
    @IsNotEmpty()
    moderators: any;
    @IsArray()
    @IsOptional()
    inUsers: any;
    @IsArray()
    @IsOptional()
    outUsers: any;
    @IsArray()
    @IsOptional()
    ctypes: CustomTypeVo[];
    @IsString()
    @IsOptional()
    comment: string;
    @IsNotEmpty()
    @IsNumber()
    buId: number;
    @IsNotEmpty()
    @IsNumber()
    flId: number;
    areaId: number;
    @IsNumber()
    @IsNotEmpty()
    userId: number;
    user2Id: number;
    userName: string;
    @IsNotEmpty()
    @IsNumber()
    effectiveCheckMinutes: number;
    @IsOptional()
    @IsString()
    serviceComment: string;
    @IsOptional()
    equipmentConf: any;
}