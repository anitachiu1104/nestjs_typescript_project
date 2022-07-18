import { Body, Controller, Get, Inject, Post, Query, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { Redirect } from '../../core/interceptor/redirect';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CheckinService } from './checkin.service';
import { MyDeskingCheckinDto } from './dto/my-desking-checkin.dto';
import { MyCheckinVo } from './vo/mycheckin.vo';

@Controller()
export class CheckinController {
    @Inject()
    private readonly checkinService: CheckinService;

    @Get('/checkin')
    async checkin(@Query() q, @Res() res) :Promise<Redirect> {
        return await this.checkinService.checkIn({spaceCode: q.spaceCode, code: q.code, userId: q.userId }, res);
    }

    //清楚当前工位预定的开始和结束时间
    @UseGuards(JwtAuthGuard)
    @Post('/findclearusertime1')
    public async findClearReserveTime1(@Body('spaceCode')spaceCode: string,@Body('bookingId')bookingId: number):Promise<string>{
        //console.log('bookingId:'+bookingId+'工位:'+spaceCode+'当前开始时间:'+startTime+'结束时间:'+endTime);
        return await this.checkinService.findClearScreen1(spaceCode,bookingId);
    }

    //查询当前用户的签到记录
    @UseGuards(JwtAuthGuard)
    @Post('/user/myCheckInRecord')
    public async findUserMyCheckInRecord(@Body(new ValidationPipe())body:MyDeskingCheckinDto):Promise<MyCheckinVo[]>{
        return await this.checkinService.findUserMyCheckInRecord(body);
    }

    //签到跳转QrCodeUrl地址
    @Get('/turn/to/qrCode')
    public async turnToQrCodeUrl(@Query('spaceCode')spaceCode: string,@Res() res){
        return await this.checkinService.turnToQrCodeUrl(spaceCode, res);
    }
}
