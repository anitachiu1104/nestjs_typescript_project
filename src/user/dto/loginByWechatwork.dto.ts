import { IsNotEmpty, IsString } from 'class-validator';

export class loginByWechatworkDto {
    @IsString()
    @IsNotEmpty()
    thirdId?: string;
}
