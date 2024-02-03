import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddAppointmentDto, GetAppointmentsDto } from './appointments.dto';
import { AppointmentItemType } from './types';

@Injectable({})
export class AppointmentService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCurrentAppointments(
    dto: GetAppointmentsDto,
  ): Promise<AppointmentItemType[]> {
    try {
      return this.prismaService.appointment.findMany({
        where: {
          authorId: dto.userId,
          eventDate: this.buildDateQuery(dto.year, dto.month),
        },
      });
    } catch (err) {
      // @todo add logger or bugsnag with error handler
      throw new NotFoundException('User has no appointments');
    }
  }

  async addAppointment(
    dto: AddAppointmentDto,
    userEmail: string,
  ): Promise<AppointmentItemType> {
    try {
      return this.prismaService.appointment.create({
        data: {
          title: dto.title,
          authorId: dto.authorId,
          eventDate: dto.eventDate,
          participants: [userEmail],
          cancelled: dto.cancelled,
          cancellations: [],
        },
      });
    } catch (err) {
      throw new Error(err.message);
    }
  }

  private buildDateQuery(year: number, month: number): object {
    // month beginning
    const from = new Date(year, month - 1);
    // month ending
    const to = new Date(year, month, 1);

    return {
      lte: to,
      gte: from,
    };
  }
}
