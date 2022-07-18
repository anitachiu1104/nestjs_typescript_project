import { IsNotEmpty, IsString } from 'class-validator';

export class MgOperationDto {
    userId?: number;
    @IsString()
    @IsNotEmpty()
    type: string;
    comment?: string;
}
