import { Body, Inject, Injectable, Res, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EntityManager, UpdateResult } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../core/config/config.service';
import { RedisClient } from '../core/redis/redis.client';
import { FileUtil } from '../core/util/file.util';
import { MgOperationService } from '../operation/mg-operation.service';
import { MgOperationEntity } from '../model/mg-operation.entity';
import { StaffEntity } from '../model/staff.entity';
import { LoginDto } from './dto/login.dto';
import { UserDto } from './dto/user.dto';
import { UserVo } from './vo/user.vo';
import * as querystring from 'querystring';
import { MgMenuEntity } from '../model/mg-menu.entity';
import { MgRoleMenuEntity } from '../model/mg-role-menu.entity';
import { MgStaffRoleEntity } from '../model/mg-staff-role.entity';
import { MgRoleEntity } from '../model/mg-role.entity';
import { PageInterface } from '../core/page/page.interface';
import { PageResultInterface } from '../core/page/page-result.interface';
import { PageHelper } from '../core/page/page.helper';
import { DepartDto } from './dto/depart.dto';

@Injectable()
export class UserService {

    @Inject()
    private readonly conn: EntityManager;

    @Inject()
    private configService: ConfigService;

    @Inject()
    private readonly redisSerivce:RedisClient;

    @Inject()
    private readonly client: ClientProxy;

    @Inject()
    private readonly authService: AuthService;
    @Inject()
    private readonly mgOperationService: MgOperationService;

    async login(@Body(new ValidationPipe()) userDto: LoginDto) {
        const userInfo = await this.authService.validateUser(userDto);
        await this.mgOperationService.save({
            userId: userInfo.user.userId,
            type: 'login'
        });
        return userInfo;
    }

    async loginFromWechatwork(appName: string, code: string, @Res() response) {

        let userId = await this.client.send({
            cmd: 'wism_wechatwork.userInfo'
        }, {
            name: appName,
            code: code
        }).toPromise();

        let wechatConf = await this.client.send({
            cmd: 'wism_wechatwork.getConfig'
        }, {
            name: appName
        }).toPromise();
        let query = await this.authService.validateWechatworkUser({thirdId:userId})
        if(!wechatConf || !wechatConf.mainUrl)return Promise.reject('请先配置mainUrl');
        let result = querystring.stringify(query as any);
        return response.redirect(wechatConf.mainUrl+'?'+ result);
    }

    async updateUser(stId: number, avatarPath: string): Promise<UpdateResult> {
        return await this.conn.getRepository(StaffEntity).update({
            stId: stId,
            isDelete: 0
        },{
            avatarPath: avatarPath
        });
    }

    async uploadFile(file,userDto: UserDto,avatarPath:string): Promise<void>{
        const destPath = this.configService.get('FILE_UPLOAD_PATH');
        const originalFileName = uuidv4() + '.jpg';
        const destFullPath = path.join(destPath,originalFileName);
        const exists = avatarPath && await FileUtil.exists(avatarPath);
        if(exists){
            await FileUtil.unlinkOneFile(avatarPath);
        }
        await FileUtil.uploadOneFile(destFullPath,file.buffer,destPath);
        await this.updateUser(userDto.stId,destFullPath);
    }

    async findUserAvatarPathById(stId: number): Promise<UserVo> {
        return await this.conn.getRepository(StaffEntity).createQueryBuilder()
            .select('avatar_path', 'avatarPath')
            .where('is_delete=0')
            .andWhere('st_id=:stId',{ stId })
            .getRawOne<UserVo>();
    }

    async findUserByThirdPartyId(thirdPartyId: string): Promise<UserDto> {
        return await this.conn.getRepository(StaffEntity).createQueryBuilder()
            .select('st_id', 'stId')
            .addSelect('st_name', 'stName')
            .addSelect('space_id','spaceId')
            .addSelect('st_part','stPart')
            .where('is_delete=0')
            .andWhere('third_party_id=:thirdPartyId',{ thirdPartyId })
            .getRawOne<UserDto>();
    }

    async getUserAvatar(stId: number): Promise<fs.ReadStream>{
        const destPath = this.configService.get('FILE_UPLOAD_PATH');
        const vo = await this.findUserAvatarPathById(stId);
        let avatarPath = vo.avatarPath ? vo.avatarPath : path.join(destPath,'default-avatar.png');
        return await FileUtil.exists(avatarPath) ? fs.createReadStream(avatarPath) : Promise.reject('no avatar');
    }

    //更新用户邮箱初始密码
    async updateUserByUserId(userId: Number,email: string,password:string):Promise<UpdateResult> {
        //首先加载node自带的加密模块
        //let crypto = require('crypto');
        const pwd = password;
        //初始化MD5模块
        const md5 = crypto.createHash('md5');
        //将传过来密码进行转换操作
        const newPassword = md5.update(pwd).digest('hex');
        return await this.conn.getRepository(StaffEntity).createQueryBuilder()
          .update(StaffEntity)
          .set({password:newPassword})
          .where('email=:email',{ email })
          .andWhere('st_Id=:userId',{ userId })
          .execute();
    }

    //查询用户是否第一次登录
    async findUserLoginByUserId(userId: number): Promise<boolean>{
        //获取数据库返回条数
        return await this.conn.getRepository(MgOperationEntity).createQueryBuilder()
            .select('user_id','userId')
            .where('user_id=:userId',{ userId })
            .getCount() ===1;
    }


    //用户忘记密码,产生随机码存入Redis,发送至邮箱
    public async userForgetPassword(email: string): Promise<string>{
        //产生6位随机码
        let randomNumber = '';
        for (let i=0;i<6;i++){
            randomNumber+=Math.floor(Math.random()*10);
        }
        if(!email){
            return Promise.reject('email require');
        }else {
            //判断用户输入的邮箱地址是否存在
           const emailData = await this.conn.getRepository(StaffEntity).createQueryBuilder()
                .select('email','email')
                .addSelect('st_name','stName')
                .where('email=:email',{email})
               .getRawOne<UserDto>();
            if(!emailData || !emailData.email){
                return Promise.reject('email find fail');
            }else{
                //验证码设置redis的key，hot-desking:user:1:verifycode:123456,并且设置过期时间,不做IO操作,不用加await
                //向redis发送随机码
            await this.redisSerivce.setEx('hot-desking:user:'+email+':verifycode',randomNumber,1200);
            const resultEmail = this.client.send({
                cmd: 'wism_sms.sendMail'
            }, {
                to: email,
                subject: '智能工位预定',
                //text:'用户Jack您好,',
                html:`<span>用户${emailData.stName}您好,</span><br><span>感谢您使用【智能工位预定】系统，邮箱验证码为：<span style="text-decoration: underline;text-decoration-color:#333300;color: #1760D7">`+randomNumber+`</span>，您正在重置登录密码，请您输入邮箱验  证码完成验证。（请勿泄露邮箱验证码）。【Wwonders】</span>`,
            }).toPromise();
            if(!resultEmail){
                return Promise.reject('email send fail');
            }else {
                return 'email send success';
                  }
            }
        }
    }

    //接受用户的验证码进行校验，校验通过之后进行密码修改
    public async userResetPassword(email: string, verierCationCode: number, password: string):Promise<string>{
        if(!email && !verierCationCode && !password){
            return Promise.reject('parameter is null');
        }else {
            //从redis中去查询 velues 验证码
            const randomNumber = verierCationCode;
            //hot-desking:user:ivanxiehuidan@qq.com:verifycode
            const getValues = await this.redisSerivce.get('hot-desking:user:'+email+':verifycode');
            if (String(randomNumber) === getValues){
                //验证通过之后，将传入的密码进行保存
                const pwd = password;
                //初始化MD5模块
                const md5 = crypto.createHash('md5');
                //将传过来的密码进行转换操作
                const newPassword = md5.update(pwd).digest('hex');
                const result = await this.conn.getRepository(StaffEntity).createQueryBuilder()
                    .update(StaffEntity)
                    .set({password:newPassword})
                    .where('email=:email',{ email })
                    .execute();
                if(!result){
                    return Promise.reject('update password fail');
                }else {
                    return 'update password success';
                }
            }else {
                return Promise.reject('check verifycode fail');
            }
        }

    }


    public async findUsersBydepartId(departDto: DepartDto): Promise<PageResultInterface<StaffEntity>>{
        let {departId,page} = departDto;
        let result = await this.conn.getRepository(StaffEntity).createQueryBuilder()
             .where("depart_id=:departId",{departId})
             .orderBy('st_id','DESC')
             .limit(page.pageSize)
             .offset(PageHelper.getSkip(page))
             .getMany();
         let total =  await this.conn.getRepository(StaffEntity).createQueryBuilder()
             .where("depart_id=:departId",{departId})
             .getCount()
         return {
             total,
             data: result
         }
    }
    public async getMenusByUserId(userId: number): Promise<MgMenuEntity[]>{
        let rows = await this.conn.getRepository(MgMenuEntity).createQueryBuilder('t1')
            .innerJoin(MgRoleMenuEntity,'t2','t1.id = t2.menu_id')
            .innerJoin(MgStaffRoleEntity,'t3','t2.role_id = t3.role_id')
            .where('t3.user_id = :userId',{userId})
            .getMany();
        if (!rows || rows.length<1){
            //没有就默认普通权限
            rows = await this.conn.getRepository(MgMenuEntity).createQueryBuilder('t1')
                .innerJoin(MgRoleMenuEntity,'t2','t1.id = t2.menu_id')
                .innerJoin(MgRoleEntity,'t4','t2.roleId = t4.id')
                .where('t4.name = "normal"')
                .getMany();
        }
        return rows;
    }

    /**
     * 模糊查询姓名
     * @param userName
     */
    public async findUserByName(userName: string):Promise<StaffEntity[]>{
        if (!userName){
            return Promise.reject('userName is null');
        }else {
            const resultData = this.conn.getRepository(StaffEntity).createQueryBuilder()
                .where('st_name like :userName',{ userName:'%'+userName+'%' })
                .getMany();
            return resultData;
        }
    }
}
