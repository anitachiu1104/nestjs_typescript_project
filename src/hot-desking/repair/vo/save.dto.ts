import { IsNumber } from 'class-validator';

export class SaveDto {
    spaceCode: string;
    types: string;
    comment: string;
    @IsNumber()
    userId: number;
}