import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInDto {
    @IsNotEmpty()
    code: string;
    @IsString()
    spaceCode: string;
    userId: string;
}
