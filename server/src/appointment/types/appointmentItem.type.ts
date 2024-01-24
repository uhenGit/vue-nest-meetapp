export type AppointmentItemType = {
  id: string;
  title: string;
  eventDate: Date;
  participants: string[];
  authorId: string;
  cancelled: boolean;
  cancellations: string[];
};
