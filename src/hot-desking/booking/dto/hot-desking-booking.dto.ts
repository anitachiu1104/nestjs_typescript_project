import { IsNotEmpty, IsNumber } from 'class-validator';

export class HotDeskingBookingDto {
    @IsNotEmpty()
    @IsNumber()
    id: number;
    @IsNotEmpty()
    @IsNumber()
    expiration: number;

}
