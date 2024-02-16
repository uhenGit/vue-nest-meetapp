import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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

  @Put('update-one')
  async updateAppointmentById(
    @Body() dto: AddAppointmentDto,
    @CookieUserDecorator('sub') userId: string,
  ): Promise<AppointmentItemType> {
    // @todo return only status as we do not need all the item
    return this.appointmentService.updateAppointment(dto, userId);
  }

  @Patch('toggle-cancel/:id')
  async toggleCancellation(
    @Param('id') appointmentId: string,
    @CookieUserDecorator('email') email: string,
  ): Promise<object> {
    try {
      const response =
        await this.appointmentService.getAppointmentById(appointmentId);

      if (!response) {
        return { success: false, errorStatus: 'Not found' };
      }

      const updatedUsersCancellations = this.updateUsers(
        response.cancellations,
        email,
      );
      await this.appointmentService.updateUsersCancellations(
        updatedUsersCancellations,
        appointmentId,
      );

      return { success: true };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  private updateUsers(users: string[], currentUserEmail: string) {
    if (users.includes(currentUserEmail)) {
      return users.filter((user: string) => user !== currentUserEmail);
    }

    return users.concat([currentUserEmail]);
  }
}
