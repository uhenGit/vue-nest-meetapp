import { Injectable } from '@nestjs/common';
import { GetAppointmentsDto } from './appointments.dto';
import { AppointmentItemType } from './types';

@Injectable({})
export class AppointmentService {
  constructor() {}

  getCurrentAppointments(dto: GetAppointmentsDto): AppointmentItemType[] {
    // testing get
    console.log('service: ', dto.email, dto.eventsDate);
    return [
      {
        id: '123',
        title: 'Test',
        eventDate: new Date(),
        participants: ['test@bob.com'],
        author: 'bob@test.com',
        cancelled: false,
        cancellations: [],
      },
    ];
  }
}
