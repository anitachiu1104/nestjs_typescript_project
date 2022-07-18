import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { StaffEntity } from '../model/staff.entity';
import { LoginDto } from '../user/dto/login.dto';
import { EntityManager } from 'typeorm';
import { UserInfo } from './userInfo.interface';
import {loginByWechatworkDto} from '../user/dto/loginByWechatwork.dto'
import {AppUserInfo} from "./appUserInfo.interface";
import { MgStaffRoleEntity } from '../model/mg-staff-role.entity';
import { UserRoleDto } from '../user/dto/user-role.dto';
import { MgRoleEntity } from '../model/mg-role.entity';

@Injectable()
export class AuthService {
    @Inject()
    private readonly connection: EntityManager;
    @Inject()
    private readonly jwtService: JwtService

    async validateUser(userDto: LoginDto): Promise<UserInfo> {
        const user = await this.findUserByEmailAndPassword(userDto);
        if (!user) throw new UnauthorizedException();
        const roles = await this.findRolesByUserId(user.stId);
        const payload = { userName: user.stName, userId: user.stId, email: user.email, roles };
        return {
            token: this.jwtService.sign(payload),
            user:{
                stName: user.stName,
                userId: user.stId,
                roles: roles
            }
        }
    }

    async validateWechatworkUser(userDto: loginByWechatworkDto): Promise<AppUserInfo> {

        const user = await this.findUserByEncrryId(userDto);
        const roles = await this.findRolesByUserId(user.stId);
        const payload = {userName: user.stName, userId: user.stId, email: user.email, roles};
        return {
            token: this.jwtService.sign(payload),
            stName: user.stName,
            userId: user.stId ,
            roles
        }
    }

    async findRolesByUserId(userId: number): Promise<UserRoleDto[]> {
        return await this.connection
          .getRepository(MgStaffRoleEntity)
          .createQueryBuilder('sr')
          .innerJoin(MgRoleEntity, 'mr', 'sr.role_id=mr.id')
          .select('sr.user_id', 'userId')
          .addSelect('mr.name', 'roleName')
          .addSelect('mr.id', 'roleId')
          .addSelect('mr.desc', 'roleDesc')
          .where('sr.user_id=:userId', {userId})
          .getRawMany<UserRoleDto>();
    }

    async findUserByEmailAndPassword(staff: LoginDto) {
        const MD5Password = crypto.createHash('md5').update(staff.password).digest('hex');
        let loginUser = await this.connection.getRepository(StaffEntity).findOne({ email: staff.email, password: MD5Password, isDelete: 0 });
        if (loginUser) {
            delete loginUser.password;
        }
        return loginUser;
    }
    async findUserByEncrryId(staff: loginByWechatworkDto) {
        let {thirdId} = staff;
        // let key ='87ca2fcf00d528b32d749c2c3f8d14e9';//秘钥
        // let iv = '';
        // // var cipherChunks = [];
        // // var cipher = crypto.createCipheriv('aes-256-ecb', key, iv);
        // // cipher.setAutoPadding(true);
        // // cipherChunks.push(cipher.update(thirdId, 'utf-8', 'base64'));
        // // cipherChunks.push(cipher.final('base64'));
        // // let a = cipherChunks.join('');
        // // console.log(cipherChunks.join(''));
        // // let padding = AES_conf.padding;
        // //解密
        // let cipherChunks = [];
        // let decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
        // decipher.setAutoPadding(true);
        // cipherChunks.push(decipher.update(thirdId, 'base64', 'utf8'));
        // cipherChunks.push(decipher.final('utf-8'));
        // let decryData = cipherChunks.join('')
        // console.log('解密后:',decryData);

        let loginUser = await this.connection.getRepository(StaffEntity).findOne({ thirdPartyId:thirdId, isDelete: 0 });
        if (loginUser) {
            delete loginUser.password;
        }
        return loginUser;
    }
}
