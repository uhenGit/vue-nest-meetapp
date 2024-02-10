interface GetAppointmentsDto {
  userEmail: string;
  userId: string;
  year: number;
  month: number;
}

interface AddAppointmentDto {
  id?: string;
  title: string;
  authorId: string;
  eventDate: Date;
  participants: Array<string>;
  cancelled: boolean;
  cancellations: Array<string>;
}

export { GetAppointmentsDto, AddAppointmentDto };
