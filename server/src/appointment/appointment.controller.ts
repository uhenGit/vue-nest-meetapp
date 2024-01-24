import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AddAppointmentDto } from './appointments.dto';
import { AppointmentItemType } from './types';
import {
  CookieUserDecorator,
  ParamToNumberDecorator,
} from '../common/decorators';

// should implement Guard
@Controller('appointments')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post('add-appointment')
  async addAppointment(
    @Body() dto: AddAppointmentDto,
    @CookieUserDecorator('email') email: string,
  ): Promise<boolean> {
    const parsedBody = {
      ...dto,
      eventDate: new Date(dto.eventDate),
    };
    console.log('Add appointment: ', email, parsedBody);
    const result = await this.appointmentService.addAppointment(
      parsedBody,
      email,
    );
    console.log('CONTROLLER ADD: ', result);
    return true;
  }

  @Get('load-appointments/:year/:month')
  async getAppointments(
    @ParamToNumberDecorator('month') month: number,
    @ParamToNumberDecorator('year') year: number,
    @CookieUserDecorator('sub') userId: string,
  ): Promise<AppointmentItemType[]> {
    return this.appointmentService.getCurrentAppointments({
      userId,
      year,
      month,
    });
  }
}
