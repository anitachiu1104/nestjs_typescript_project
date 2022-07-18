import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WxconfigVo } from './wxconfig.vo';


@Injectable()
export class WxconfigService {
    @Inject()
    private readonly client: ClientProxy

    async getWxConfig(appName: string): Promise<WxconfigVo> {
        return await this.client.send({ cmd: 'wism_wechatwork.getWxConfig'}, {appName}).toPromise();
    }
}