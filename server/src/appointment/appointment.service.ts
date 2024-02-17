import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
          AND: [
            {
              OR: [
                {
                  authorId: dto.userId,
                },
                {
                  participants: {
                    has: dto.userEmail,
                  },
                },
              ],
            },
            {
              eventDate: this.buildDateQuery(dto.year, dto.month),
            },
          ],
        },
        include: {
          author: {
            select: {
              email: true,
            },
          },
        },
      });
    } catch (err) {
      // @todo add logger or bugsnag with error handler
      throw new NotFoundException('User has no appointments');
    }
  }

  async getAppointmentById(
    appointmentId: string,
  ): Promise<AppointmentItemType> {
    try {
      return this.prismaService.appointment.findUnique({
        where: {
          id: appointmentId,
        },
      });
    } catch (err) {
      throw new NotFoundException('Appointment does not exist');
    }
  }

  async addAppointment(dto: AddAppointmentDto): Promise<AppointmentItemType> {
    try {
      return this.prismaService.appointment.create({
        data: {
          title: dto.title,
          authorId: dto.authorId,
          eventDate: dto.eventDate,
          participants: dto.participants,
          cancelled: dto.cancelled,
          cancellations: [],
        },
      });
    } catch (err) {
      throw new Error(err.message);
    }
  }

  // use delete().catch() scheme as the prisma does not handle 'not found' case in another way at the moment
  async removeAppointment(
    appointmentId: string,
    userId: string,
  ): Promise<AppointmentItemType> {
    return this.prismaService.appointment
      .delete({
        where: {
          id: appointmentId,
          authorId: userId,
        },
      })
      .catch(() => {
        throw new NotFoundException('The appointment does not exist');
      });
  }

  async updateAppointment(
    changes: AddAppointmentDto,
    authorId: string,
  ): Promise<AppointmentItemType> {
    const { id } = changes;
    delete changes.id;

    if (authorId !== changes.authorId) {
      throw new ForbiddenException('You are not an author');
    }

    delete changes.authorId;

    try {
      return this.prismaService.appointment.update({
        where: {
          id,
          authorId,
        },
        data: {
          ...changes,
        },
      });
    } catch (err) {
      throw new NotFoundException('The appointments does not exist');
    }
  }

  async updateUsersCancellations(
    emails: string[],
    appointmentId: string,
  ): Promise<boolean> {
    try {
      const { participants, cancellations, cancelled } =
        await this.prismaService.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            cancellations: emails,
          },
        });
      const totalCancelled = this.allParticipantsCancelled(
        participants,
        cancellations,
      );

      if (totalCancelled && !cancelled) {
        await this.prismaService.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            cancelled: true,
          },
        });
      }

      if (cancelled && !totalCancelled) {
        await this.prismaService.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            cancelled: false,
          },
        });
      }

      return true;
    } catch (err) {
      throw new Error(err);
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

  private allParticipantsCancelled(
    participants: string[],
    cancellations: string[],
  ): boolean {
    return (
      participants.length === cancellations.length &&
      participants.every((user) => cancellations.includes(user))
    );
  }
}
