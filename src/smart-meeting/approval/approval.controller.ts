import { Body, Controller, Get, Inject, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalsDto } from './dto/approvals.dto';
import { ApprovalsVo } from './vo/approvals.vo';
import { RefuseDto } from './dto/refuse.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/role.enum';
import { RolesGuard } from '../../auth/roles.guard';
import { PageResultInterface } from '../../core/page/page-result.interface';
import { PassAllDto } from './dto/passAll.dto';

@Controller('/approval')
export class ApprovalController {
    @Inject()
    private readonly approval: ApprovalService

    @Post('/getApprovals')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async getApprovals(@Body(new ValidationPipe()) approvals: ApprovalsDto): Promise<PageResultInterface<ApprovalsVo>> {
        return await this.approval.getApprivals(approvals);
    }

    @Post('/passAll')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async passAll(@Body(new ValidationPipe())data: PassAllDto) {
        return this.approval.passAll(data.ids);
    }

    @Get('/pass/:bookingId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async pass(@Param('bookingId') id: number) {
        return await this.approval.pass(id);
    }

    @Post('/refuse')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    async refuse(@Body(new ValidationPipe())data: RefuseDto ) {
        return await this.approval.refuse(data);
    }
}