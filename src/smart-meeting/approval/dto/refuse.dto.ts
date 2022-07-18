import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RefuseDto {
    @IsNumber()
    @IsNotEmpty()
    id: number;
    @IsString()
    @IsOptional()
    comment: string;
}