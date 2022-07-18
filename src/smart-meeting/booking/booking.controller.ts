import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Query,
    Request,
    Res, UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    ValidationPipe
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingDto } from './dto/booking.dto';
import { MyBookingDto } from './dto/my-booking.dto';
import { CustomTypeVo } from './vo/customtype.vo';
import { MgSpaceVo } from './vo/mgspace.vo';
import { MyBookingVo } from './vo/mybooking.vo';
import { PositionQueryDto } from './dto/position-query.dto';
import { PositionVo } from './vo/position.vo';
import { MyMeetingDto } from './dto/my-meeting.dto';
import { MyMeetingVo } from './vo/mymeeting.vo';
import { MeetingStateDto } from './dto/meetingstate.dto';
import { extendMeetingDto } from './dto/extend-meeting.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MeetingDetailsVo } from './vo/meetingdetails.vo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MyBookingHistory } from './dto/my-booking-history';
import { SmartMeetingAttendee } from '../../model/smart-meeting-attendee.entity';
import { PageResultInterface } from '../../core/page/page-result.interface';
import { SmartMeetingService } from '../../model/smart-meeting-service.entity';
import { SmartMeetingEquipmentEntity } from '../../model/smart-meeting-equipment.entity';
import { MeetingSpaceNameDto } from '../booking/dto/meeting-spaceName.dto'
import { Redirect } from '../../core/interceptor/redirect';

@Controller()
export class BookingController {

    @Inject()
    private bookingService : BookingService;

    @Get('/')
    async test() {
      return 'hello smart meeting!';
    }

    //会议室预定
    @UseGuards(JwtAuthGuard)
    @Post('/booking/save')
    async save(@Body(new ValidationPipe()) bookingDto: BookingDto): Promise<string> {
        return await this.bookingService.saveOrUpdateBooking(bookingDto);
    }

    @Post('/pad/booking/save')
    async savePad(@Body(new ValidationPipe()) bookingDto: BookingDto): Promise<string> {
        return await this.bookingService.saveOrUpdateBooking(bookingDto);
    }

    //获取设备信息
    @UseGuards(JwtAuthGuard)
    @Get('/custom')
    public async findCustomType(): Promise<CustomTypeVo[]>{
         return await this.bookingService.findCustomType();
    }

    //获取服务信息
    @UseGuards(JwtAuthGuard)
    @Get('/services')
    public async findServices(): Promise<CustomTypeVo[]>{
        return await this.bookingService.findServices();
    }

    //获取服务信息-->Pad
    @Get('/pad/services')
    public async padFindServices(): Promise<CustomTypeVo[]>{
        return await this.bookingService.padFindServices();
    }

    //通过会议室名称模糊搜索
    @UseGuards(JwtAuthGuard)
    @Post('/position/find')
    public async findMeetingPosition(@Body(new ValidationPipe())meetingSpaceNameDto: MeetingSpaceNameDto):Promise<PageResultInterface<MgSpaceVo>>{
        return await this.bookingService.findMeetingPosition(meetingSpaceNameDto);
    }

    //根据条件查询会议室列表信息
    @UseGuards(JwtAuthGuard)
    @Post('/position/query')
    public async findMeetingPositionList(@Body(new ValidationPipe())positionQueryDto: PositionQueryDto):Promise<PageResultInterface<PositionVo>>{
        return await this.bookingService.findMeetingPositionList(positionQueryDto);
    }

    //根据条件查询会议室列表信息-->Pad
    @Post('/pad/position/query')
    public async padFindMeetingPositionList(@Body(new ValidationPipe())positionQueryDto: PositionQueryDto):Promise<PositionVo[]>{
        return await this.bookingService.padFindMeetingPositionList(positionQueryDto);
    }

    //查询会议室详情
    @UseGuards(JwtAuthGuard)
    @Post('/booking/meetingdetails')
    public async findMeetingDetails(@Body('spaceId')spaceId:number):Promise<MeetingDetailsVo>{
        return await this.bookingService.findMeetingDetails(spaceId);
    }

    //查询预约会议详情
    @UseGuards(JwtAuthGuard)
    @Post('/bookingdetails')
    public async findMeetingBookingDetails(@Body('bookingId')bookingId:number):Promise<{
        resultMeetingData: MeetingDetailsVo,
        innerAttendees: SmartMeetingAttendee[],
        outerAttendees: SmartMeetingAttendee[],
        moderatorList: SmartMeetingAttendee[],
        serviceList: SmartMeetingService[],
        equipmentList: SmartMeetingEquipmentEntity[]}> {
        return await this.bookingService.findMeetingBookingDetails(bookingId);
    }

    //查询预约会议详情-->Pad
    @Post('/pad/bookingdetails')
    public async padFindMeetingBookingDetails(@Body('bookingId')bookingId:number):Promise<{
        resultMeetingData: MeetingDetailsVo,
        innerAttendees: SmartMeetingAttendee[],
        outerAttendees: SmartMeetingAttendee[],
        moderatorList: SmartMeetingAttendee[],
        serviceList: SmartMeetingService[],
        equipmentList: SmartMeetingEquipmentEntity[]}> {
        return await this.bookingService.padFindMeetingBookingDetails(bookingId);
    }

    //根据条件查询会议室预约信息
    @UseGuards(JwtAuthGuard)
    @Post('/booking/query')
    public async findMeetingBookingList(@Body(new ValidationPipe())myBookingDto: MyBookingDto):Promise<MyBookingVo[]>{
        return await this.bookingService.findMeetingBookingList(myBookingDto);
    }

    //根据条件查询会议室预约信息--Pad
    @Post('/pad/booking/query')
    public async padFindMeetingBookingList(@Body(new ValidationPipe())myBookingDto: MyBookingDto):Promise<MyBookingVo[]>{
        return await this.bookingService.padFindMeetingBookingList(myBookingDto);
    }

    //根据条件查询我的会议接口-->web
    @Post('/booking/mymeeting/find')
    @UseGuards(JwtAuthGuard)
    public async findMyMeetingBookingRecord(@Request() req, @Body(new ValidationPipe())myMeetingDto: MyMeetingDto):Promise<MyMeetingVo[]>{
        const userId = req.user.userId;
        return await this.bookingService.findMyMeetingBookingRecord(myMeetingDto, userId);
    }

    //根据条件查询我的会议接口-->Mobile
    @Post('/booking/mymeeting/query')
    @UseGuards(JwtAuthGuard)
    public async queryMyMeetingBookingRecord(@Request() req, @Body(new ValidationPipe())myMeetingDto: MyMeetingDto):Promise<PageResultInterface<MyMeetingVo>>{
        const userId = req.user.userId;
        return await this.bookingService.queryMyMeetingBookingRecord(myMeetingDto, userId);
    }

    //根据条件查询我的会议历史接口-->Mobile
    @Post('/booking/mymeetinghistory/query')
    @UseGuards(JwtAuthGuard)
    public async queryMyMeetingBookingHistory(@Request() req, @Body(new ValidationPipe())MyBookingHistory: MyBookingHistory):Promise<PageResultInterface<MyMeetingVo>>{
        const userId = req.user.userId;
        return await this.bookingService.queryMyMeetingBookingHistory(MyBookingHistory,userId);
    }

    //取消会议
    @UseGuards(JwtAuthGuard)
    @Post('/booking/cancel')
    public async cancelMeetingByState(@Body('bookingId')bookingId: number,
                                      @Body('comment')comment: string):Promise<string>{
       return await this.bookingService.cancelMeetingByState(bookingId,comment);
    }

    //批量取消会议
    @UseGuards(JwtAuthGuard)
    @Post('/booking/batch/cancel')
    public async batchCancelMeetingByState(@Body()meetingStateDto:MeetingStateDto):Promise<string>{
        return await this.bookingService.batchCancelMeetingByState(meetingStateDto);
    }

    //延长会议
    @UseGuards(JwtAuthGuard)
    @Post('/booking/extend')
    public async extendMeetingBooking(@Body(new ValidationPipe())extendMeetingDto: extendMeetingDto):Promise<string>{
        return await this.bookingService.extendMeetingBooking(extendMeetingDto);
    }

    //延长会议-->pad
    @Post('/pad/booking/extend')
    public async padExtendMeetingBooking(@Body(new ValidationPipe())extendMeetingDto: extendMeetingDto):Promise<string>{
        return await this.bookingService.padExtendMeetingBooking(extendMeetingDto);
    }

    //结束会议
    @UseGuards(JwtAuthGuard)
    @Post('/booking/end')
    public async endMeetingBooking(@Body(new ValidationPipe())extendMeetingDto: extendMeetingDto):Promise<string>{
        return await this.bookingService.endMeetingBooking(extendMeetingDto);
    }

    //结束会议-->pad
    @Post('/pad/booking/end')
    public async padEndMeetingBooking(@Body(new ValidationPipe())extendMeetingDto: extendMeetingDto):Promise<string>{
        return await this.bookingService.padEndMeetingBooking(extendMeetingDto);
    }

    //上传会议室图片
    @Post('/picture/upload')
    @UseInterceptors(FilesInterceptor('files'))
    public async uploadFileMeeting(@UploadedFiles() files,@Body('spaceId')spaceId:number):Promise<string> {
        const meetingPictureVo = await this.bookingService.findMeetingAvatarPathById(spaceId);
        await this.bookingService.uploadFileMeeting(files,spaceId,meetingPictureVo.avatarPath);
        return 'upload picture success';
    }

    //读取会议室图片
    @Get('/picture/read')
    public async readMeetingPicture(@Query('spaceId')spaceId:number,@Res() response):Promise<string>{
         (await this.bookingService.readMeetingPicture(spaceId)).pipe(response);
         return 'read picture success';
    }

    //获取常用联系人
    @Get('/getTopContacts')
    @UseGuards(JwtAuthGuard)
    public async getTopContacts(@Request() req){
        return this.bookingService.getTopContacts(req.user.userId);
    }
    //获取pad常用联系人
    @Get('/pad/getTopContacts')
    public async getPadTopContacts(@Query('userId')userId:number){
        return this.bookingService.getTopContacts(userId);
    }
    //获取外部常用联系人
    @Get('/getOutContacts')
    @UseGuards(JwtAuthGuard)
    public async getOutContacts(@Request() req){
        return this.bookingService.getOutContacts(req.user.userId);
    }
    //获取pad外部常用联系人
    @Get('/pad/getOutContacts')
    public async getPadOutContacts(@Query('userId')userId:number){
        return this.bookingService.getOutContacts(userId);
    }

    //获取会议室的设备类型
    @Post('/getCustomTypeBySpace')
    @UseGuards(JwtAuthGuard)
    public async findCustomTypeBySpace(@Body('spaceId')spaceId: number,){
        return await this.bookingService.findCustomTypeBySpaceId(spaceId);
    }

    //身份验证->密码验证
    @Post('/verification/password')
    public async verificationPasswordByUserId(@Body('userId')userId:string,
                                              @Body('password')password:string,
                                              @Body('spaceId')spaceId:number,
                                              @Body('operationType')operationType:number):Promise<string>{
        return await this.bookingService.verificationPasswordByUserId(userId,password,spaceId,operationType);
    }

    //身份验证->密码验证-->获取userId
    @Post('/verification/password/finduserid')
    public async verificationPasswordFindUserId(@Body('userId')userId:string,
                                              @Body('password')password:string,
                                              @Body('spaceId')spaceId:number,
                                              @Body('operationType')operationType:number):Promise<string>{
        return await this.bookingService.verificationPasswordFindUserId(userId,password,spaceId,operationType);
    }

    //身份验证->二维码跳转
    @Get('/turn/to/qrCode')
    async turnToQrCode(@Query('spaceCode')spaceCode: string,@Res() res): Promise<Redirect> {
        console.log('扫描二维码:'+res);
        return this.bookingService.turnToQrCodeUrl(spaceCode, res);
    }

    //身份验证->二维码验证通过之后调用企业微信查询用户接口
    @Get('/verification/qrcode')
    async verificationQrCode(@Query() q): Promise<string> {
        const {spaceCode, code, userId} = q;
        return this.bookingService.verificationQrCode({
            spaceCode,
            code,
            userId
        });
    }

    //身份验证->二维码验证通过之后调用企业微信查询用户接口-->获取userId
    @Get('/verification/qrcode/finduserid')
    async verificationQrCodeFindUserId(@Query() q): Promise<string> {
        const {spaceCode, code, userId} = q;
        return this.bookingService.verificationQrCodeFindUserId({
            spaceCode,
            code,
            userId
        });
    }

    //身份验证->人脸识别验证
    @Post('/verification/facecomparison')
    public async verificationFaceComparison(@Body('imageBase64')imageBase64:string,
                                            @Body('spaceId')spaceId:number,
                                            @Body('operationType')operationType:number):Promise<string>{
        return this.bookingService.verificationFaceComparison(imageBase64,spaceId,operationType);
    }

    //身份验证->人脸识别验证-->获取userId
    @Post('/verification/facecomparison/finduserid')
    public async verificationFaceComparisonFindUserId(@Body('imageBase64')imageBase64:string,
                                            @Body('spaceId')spaceId:number,
                                            @Body('operationType')operationType:number):Promise<string>{
        return this.bookingService.verificationFaceComparisonFindUserId(imageBase64,spaceId,operationType);
    }

    @Post('/equipment/type')
    public async unionEquipmentByCode( @Body('spaceCode')spaceCode:string,
                                       @Body('type')type:number,
                                       @Body('equipmentCode')equipmentCode:string,
                                       @Body('equipmentNumber')equipmentNumber:number,
                                       @Body('mode')mode:string,
                                       @Body('windPower')windPower:string,
                                       @Body('Temperature')Temperature:string,
                                       @Body('coldWindTemperature')coldWindTemperature:string,
                                       @Body('hotAirTemperature')hotAirTemperature:string):Promise<string>{
        return this.bookingService.unionEquipmentByCode(spaceCode,equipmentCode,equipmentNumber,type,mode,windPower,Temperature,coldWindTemperature,hotAirTemperature);
    }

    //通过会议室spaceCode设备控制-->三路开关--开
    @Post('/open/threeway-switch/equipment')
    public async openThreeWaySwitchesBySpaceCode( @Body('spaceCode')spaceCode:string,
                                                  @Body('equipmentCode')equipmentCode:string,
                                                  @Body('equipmentNumber')equipmentNumber:number):Promise<string>{
        return this.bookingService.openThreeWaySwitchesBySpaceCode(spaceCode,equipmentCode,equipmentNumber);
    }

    //通过会议室spaceCode设备控制-->三路开关--关
    @Post('/close/threeway-switch/equipment')
    public async closeThreeWaySwitchesBySpaceCode( @Body('spaceCode')spaceCode:string,
                                                   @Body('equipmentCode')equipmentCode:string,
                                                   @Body('equipmentNumber')equipmentNumber:number):Promise<string>{
        return this.bookingService.closeThreeWaySwitchesBySpaceCode(spaceCode,equipmentCode,equipmentNumber);
    }

    //通过会议室spaceCode设备控制-->空调-->开
    @Post('/open/aircondition/equipment')
    public async openAirConditionBySpaceCode( @Body('spaceCode')spaceCode:string,
                                              @Body('equipmentCode')equipmentCode:string,
                                              @Body('mode')mode:string,
                                              @Body('windPower')windPower:string,
                                              @Body('coldWindTemperature')coldWindTemperature:string,
                                              @Body('hotAirTemperature')hotAirTemperature:string):Promise<string>{
        return this.bookingService.openAirConditionBySpaceCode(spaceCode,equipmentCode,mode,windPower,coldWindTemperature,hotAirTemperature);
    }

    //通过会议室spaceCode设备控制-->空调--关
    @Post('/close/aircondition/equipment')
    public async closeAirConditionBySpaceCode( @Body('spaceCode')spaceCode:string,
                                                   @Body('equipmentCode')equipmentCode:string):Promise<string>{
        return this.bookingService.closeAirConditionBySpaceCode(spaceCode,equipmentCode);
    }

    //清洁通知
    @Post('/cleaning/notice')
    public async cleanNoticeByCleanTime(@Body('cleanTime')cleanTime:string,
                                     @Body('date')date:number,
                                        @Body('explain')explain:string):Promise<string>{
          return this.bookingService.cleanNoticeByCleanTime(cleanTime,date,explain);
    }

}
