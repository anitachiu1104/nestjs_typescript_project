import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { Redirect } from '../../core/interceptor/redirect';

@Controller()
export class CheckinController {
    @Inject()
    private readonly checkinService: CheckinService;

    @Get('/checkin')
    async checkin(@Query() q): Promise<string> {
        const { spaceCode, code, userId } = q;
        return this.checkinService.checkin({
            spaceCode,
            code,
            userId
        });
    }

    @Get('/turn/to/qrCode')
    async turnToQrCode(@Query('spaceCode')spaceCode: string,@Res() res): Promise<Redirect> {
        return this.checkinService.turnToQrCodeUrl(spaceCode, res);
    }
}

