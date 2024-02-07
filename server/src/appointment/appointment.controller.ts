import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AddAppointmentDto } from './appointments.dto';
import { AppointmentItemType } from './types';
import { AccessTokenGuard } from '../auth/guards';
import {
  CookieUserDecorator,
  ParamToNumberDecorator,
} from '../common/decorators';

@UseGuards(AccessTokenGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post('add-appointment')
  async addAppointment(
    @Body() dto: AddAppointmentDto,
  ): Promise<AppointmentItemType> {
    const parsedBody = {
      ...dto,
      eventDate: new Date(dto.eventDate),
    };

    return this.appointmentService.addAppointment(parsedBody);
  }

  @Get('load-appointments/:year/:month')
  async getAppointments(
    @ParamToNumberDecorator('month') month: number,
    @ParamToNumberDecorator('year') year: number,
    @CookieUserDecorator('sub') userId: string,
    @CookieUserDecorator('email') userEmail: string,
  ): Promise<AppointmentItemType[]> {
    return this.appointmentService.getCurrentAppointments({
      userEmail,
      userId,
      year,
      month,
    });
  }

  @Delete('remove/:id')
  async removeAppointmentById(
    @Param('id') appointmentId: string,
    @CookieUserDecorator('sub') userId: string,
  ): Promise<AppointmentItemType> {
    return this.appointmentService.removeAppointment(appointmentId, userId);
  }
}
