import { IsNumber } from 'class-validator';

/**
 * 设备报修Dto
 */
export class SaveDto {
    spaceCode: string;
    types: string;
    comment: string;
    @IsNumber()
    userId: number;
}