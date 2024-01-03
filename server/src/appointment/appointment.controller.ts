import { Body, Param, Controller, Get, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AddAppointmentDto } from './appointments.dto';

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
  // instead of body decorator create getMonthDecorator to get month from params
  // get user email from the auth guard
  getAppointments(@Param('month') eventsDate: string): object {
    console.log('controller: ', eventsDate);
    return this.appointmentService.getCurrentAppointments({
      email: 'bob@test.com',
      eventsDate,
    });
  }
}
