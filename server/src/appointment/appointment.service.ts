import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddAppointmentDto, GetAppointmentsDto } from './appointments.dto';
import { AppointmentItemType } from './types';
import { todayPlusOneWeek } from '../utils';

@Injectable({})
export class AppointmentService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCurrentAppointments(
    dto: GetAppointmentsDto,
  ): Promise<AppointmentItemType[]> {
    const appointments: AppointmentItemType[] =
      await this.prismaService.appointment.findMany({
        where: {
          authorId: dto.userId,
          eventDate: this.buildDateQuery(dto.year, dto.month),
        },
      });

    // increase appointments quantity
    return appointments.concat([
      {
        id: '123',
        title: 'Test 1',
        eventDate: new Date(),
        participants: ['test@bob.com'],
        authorId: 'bob2@test.com',
        cancelled: false,
        cancellations: [],
      },
      {
        id: '255',
        title: 'EVENT 2',
        eventDate: todayPlusOneWeek(),
        participants: [],
        authorId: 'bob@test.com',
        cancelled: false,
        cancellations: [],
      },
    ]);
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

  // @todo check what is start and what is end
  private buildDateQuery(year: number, month: number): object {
    // month beginning
    const startDate = new Date(year, month, 1);
    // month ending
    const endDate = new Date(year, month - 1);

    return {
      lte: startDate,
      gte: endDate,
    };
  }
}
