import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { UserVo } from './vo/user.vo';
import { MgMenuEntity } from '../model/mg-menu.entity';
import { StaffEntity } from '../model/staff.entity';
import { PageInterface } from '../core/page/page.interface';
import { PageResultInterface } from '../core/page/page-result.interface';
import { DepartDto } from './dto/depart.dto';

@Controller('/user')
export class UserController {
  @Inject()
  private userService: UserService;

  @Post('/login')
  async login(@Req() req) {
    return this.userService.login(req.body);
  }
  @Get('/loginFromWechatwork')
  async loginFromWechatwork(
    @Query('appName') appName: string,
    @Query('code') code: string,
    @Res() response,
  ): Promise<string> {
    console.log('appName::' + appName);
    console.log('code::' + code);
    if (!appName) {
      return Promise.reject('appName require');
    }
    if (!code) {
      return Promise.reject('user code require');
    }
    await this.userService.loginFromWechatwork(appName, code, response);
    return code;
  }

  @Post('/avatar/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file,
    @Body() userDto: UserDto,
  ): Promise<string> {
    const userVo = await this.userService.findUserAvatarPathById(userDto.stId);
    await this.userService.uploadFile(file, userDto, userVo.avatarPath);
    return 'upload success';
  }

  @Get('/:stId/avatar')
  async getUserAvatar(
    @Param('stId') stId: number,
    @Res() response,
  ): Promise<string> {
    (await this.userService.getUserAvatar(stId)).pipe(response);
    return 'success';
  }

  //通过用户userId更新登录密码
  @UseGuards(JwtAuthGuard)
  @Post('/update/user/:userId')
  async updateUserByIdPassword(
    @Body('userId') userId: number,
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<string> {
    await this.userService.updateUserByUserId(userId, email, password);
    return 'success';
  }

  //查询用户是否第一次登录
  @UseGuards(JwtAuthGuard)
  @Get('/userLogin/:userId')
  async findUserLogin(@Param('userId') userId: number): Promise<boolean> {
    return await this.userService.findUserLoginByUserId(userId);
  }

  //忘记密码,发送验证码
  @Post('/verificationCode/send')
  public async sendVerificationCode(
    @Body('email') email: string,
  ): Promise<string> {
    return await this.userService.userForgetPassword(email);
  }

  //用户邮箱收到验证码之后进行校验，通过之后修改密码
  @Post('/verificationCode/check')
  public async checkVerificationCode(
    @Body('email') email: string,
    @Body('verierCationCode') verierCationCode: number,
    @Body('password') password: string,
  ) {
    return await this.userService.userResetPassword(
      email,
      verierCationCode,
      password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/getUsersBydepartId')
  public async getUsersBydepartId(
    @Body(new ValidationPipe()) departDto: DepartDto,
  ): Promise<PageResultInterface<UserVo>> {
    return await this.userService.findUsersBydepartId(departDto);
  }
  @Post('pad/getUsersBydepartId')
  public async getUsersBydepartIdPad(
    @Body(new ValidationPipe()) departDto: DepartDto,
  ): Promise<PageResultInterface<UserVo>> {
    return await this.userService.findUsersBydepartId(departDto);
  }
  //获取登录人菜单权限
  @Get('/getMenus')
  @UseGuards(JwtAuthGuard)
  public async getMenus(@Request() req): Promise<MgMenuEntity[]> {
    return await this.userService.getMenusByUserId(req.user.userId);
  }

  //模糊查询名字
  @UseGuards(JwtAuthGuard)
  @Post('/findUserByName')
  public async findUserByName(
    @Body('userName') userName: string,
  ): Promise<StaffEntity[]> {
    return await this.userService.findUserByName(userName);
  }
}
