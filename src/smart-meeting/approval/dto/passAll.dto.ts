import { IsNotEmpty } from 'class-validator';

export class PassAllDto {
    @IsNotEmpty()
    ids: number[];
}