import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WxconfigService } from './wxconfig.service';
import { WxconfigVo } from './wxconfig.vo';


@Controller('/wechatwork')
export class WxconfigController {
    @Inject()
    private readonly tokenService: WxconfigService;

    //获取token
    @UseGuards(JwtAuthGuard)
    @Get('/getWxConfig')
    public async findCustomType(@Query('appName')appName: string,@Query('url')url: string):Promise<WxconfigVo>{
        return await this.tokenService.getWxConfig(appName);
    }
}