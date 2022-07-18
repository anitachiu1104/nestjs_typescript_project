import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PageResultInterface } from "../../core/page/page-result.interface";
import { BookingService } from './booking.service';
import { BookingBatchDto } from './dto/booking-batch.dto';
import { BookingDto } from './dto/booking.dto';
import { MyBookingDto } from './dto/my-booking.dto';
import { MyhistoryBookingDto } from './dto/my-historybooking.dto';
import { StationQueryDto } from './dto/station-query.dto';
import { MgspaceVo } from './vo/mgspace.vo';
import { MgStaffVo } from './vo/mgstaff.vo';
import { MybookingVo } from './vo/mybooking.vo';

@Controller()
export class BookingController {
    @Inject()
    private bookingService: BookingService;

    @UseGuards(JwtAuthGuard)
    @Post('/booking/save')
    async save(@Body(new ValidationPipe()) bookingDto: BookingDto): Promise<string> {
        return await this.bookingService.saveOrUpdateBooking(bookingDto);
    }

    //批量添加全天预约记录
    @UseGuards(JwtAuthGuard)
    @Post('/booking/saveBatch')
    async saveAllDayBatch(@Body(new ValidationPipe()) bookingBatchDto: BookingBatchDto): Promise<void> {
        return await this.bookingService.saveBatchBooking(bookingBatchDto.spaceId,bookingBatchDto.bookingDtoList);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/booking/extend')
    async extendBooking(@Body(new ValidationPipe()) bookingDto: BookingDto): Promise<string> {
        return await this.bookingService.extendBooking(bookingDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/building/:buId/floor/:flId/region/:areaId?/station')
    async findWorkStations(
        @Param() stationQueryDto: StationQueryDto
        ) {
        return await this.bookingService.findWorkStations(stationQueryDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/building/:buId/floor/:flId/booking')
    async findBookings(
        @Param('buId') buId: number,
        @Param('flId') flId: number,
        @Query('startTime') startTime: string,
        @Query('endTime') endTime: string) {
        return await this.bookingService.findFloorBookings({
            buId, flId, startTime, endTime
        });
    }


    @UseGuards(JwtAuthGuard)
    @Get('/user/:userId/myReservation')
    async findAllMyReservation(@Param('userId') userId: number) :Promise<MyBookingDto[]>{
        return await this.bookingService.findAllMyReservation(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/myReservation')
    async findMyReservation(@Body(new ValidationPipe()) body: MyBookingDto) :Promise<PageResultInterface<MybookingVo>>{
        return this.bookingService.findMyBooking(body);
    }


    @UseGuards(JwtAuthGuard)
    @Get('/myReservation/cancel')
    async cancelMyReservation(@Query('bookingId') bookingId:number){
        return this.bookingService.cancelMyReservation(bookingId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/myReservation/end')
    async endMyReservation(@Query('bookingId') bookingId:number): Promise<void> {
        return this.bookingService.endMyReservation(bookingId);
    }

    //查询个人历史预定记录-条件查询
    @UseGuards(JwtAuthGuard)
    @Post('/user/myHistoryReservation')
    public async findUserByIdHistoryReservation(@Body(new ValidationPipe())body:MyhistoryBookingDto):Promise<PageResultInterface<MybookingVo>>{
        return await this.bookingService.findUserByIdHistoryReservation(body);
    }

    //工位查询-通过工位号模糊查询
    @UseGuards(JwtAuthGuard)
    @Post('/user/findSpaceCodePosition')
    public async findPositionBySpaceCode(@Body('spaceCode')spaceCode: string):Promise<MgspaceVo[]>{
        return await this.bookingService.findSpaceCodePosition(spaceCode);
    }

    //工位查询-通过工位号精准匹配查询
    @UseGuards(JwtAuthGuard)
    @Post('/user/findCoordinateSpaceCode')
    public async findCoordinateBySpaceCode(@Body('spaceCode')spaceCode: string):Promise<MgspaceVo[]>{
        return await this.bookingService.findCoordinateBySpaceCode(spaceCode);
    }

    //工位查询-通过名字模糊查询
    @UseGuards(JwtAuthGuard)
    @Post('/user/findBookingDistributed')
    public async findBookingByUserName(@Body('userName')userName: string):Promise<MgStaffVo[]>{
        return await this.bookingService.findBookingByUserName(userName);
    }

    //工位查询-通过名字查询预约记录
    @UseGuards(JwtAuthGuard)
    @Post('/user/findBookingSpaceRecord')
    public async findBookingSpaceByUserName(@Body('userName')userName: string,
                                            @Body('buId')buId:string,
                                            @Body('flId')flId:string):Promise<MgStaffVo[]>{
        return await this.bookingService.findBookingSpaceByUserName(userName,buId,flId);
    }

    //工位查询-通过工位查询预约记录
    @UseGuards(JwtAuthGuard)
    @Post('/user/findBookingSpace')
    public async findBookingBySpace(@Body('spaceCode')spaceCode: string,
                                            @Body('buId')buId:string,
                                            @Body('flId')flId:string):Promise<MgStaffVo[]>{
        return await this.bookingService.findBookingBySpace(spaceCode,buId,flId);
    }

    //模糊查询名字
    @UseGuards(JwtAuthGuard)
    @Post('/user/findBookingUseName')
    public async findBookingUserName(@Body('userName')userName: string):Promise<MgStaffVo[]>{
        return await this.bookingService.findBookingUserName(userName);
    }
}
