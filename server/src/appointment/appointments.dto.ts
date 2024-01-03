interface GetAppointmentsDto {
  email: string;
  eventsDate: string;
}

interface AddAppointmentDto extends GetAppointmentsDto {
  details: object;
}

export { GetAppointmentsDto, AddAppointmentDto };
