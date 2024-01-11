import { Body, Param, Controller, Get, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AddAppointmentDto } from './appointments.dto';
import { AppointmentItemType } from './types';
import { CookieUserDecorator } from '../common/decorators';

// should implement Guard
@Controller('appointments')
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post('add-appointment')
  addAppointment(@Body() dto: AddAppointmentDto): boolean {
    console.log('Add appointment: ', dto);
    return true;
  }

  @Get('load-appointments/:month')
  getAppointments(
    @Param('month') eventsDate: string,
    @CookieUserDecorator('email') email: string,
  ): AppointmentItemType[] {
    console.log('controller: ', eventsDate);
    return this.appointmentService.getCurrentAppointments({
      email,
      eventsDate,
    });
  }
}
