import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    sessionKey?: string;
    @IsString()
    @IsNotEmpty()
    email?: string;
    @IsString()
    @IsNotEmpty()
    password?: string;
    stName?: string;
    stId?: number
}
