interface GetAppointmentsDto {
  userId: string;
  year: number;
  month: number;
}

interface AddAppointmentDto {
  title: string;
  authorId: string;
  eventDate: Date;
  participants: Array<string>;
  cancelled: boolean;
  cancellations: Array<string>;
}

export { GetAppointmentsDto, AddAppointmentDto };
