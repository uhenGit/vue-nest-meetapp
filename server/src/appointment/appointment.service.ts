import { Injectable } from '@nestjs/common';
import { GetAppointmentsDto } from './appointments.dto';

@Injectable({})
export class AppointmentService {
  constructor() {}

  getCurrentAppointments(dto: GetAppointmentsDto): object[] {
    // testing get
    console.log('service: ', dto.email, dto.eventsDate);
    return [
      {
        eventDate: new Date().toDateString(),
        participants: ['test@bob.com'],
        author: 'bob@test.com',
        cancelled: false,
        cancellations: [],
      },
    ];
  }
}
