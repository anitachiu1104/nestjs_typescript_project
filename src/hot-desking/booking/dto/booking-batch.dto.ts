import { IsNumber } from 'class-validator';
import { BookingDto } from './booking.dto';

export class BookingBatchDto {
    @IsNumber()
    spaceId: number;
    bookingDtoList: BookingDto[];
}
