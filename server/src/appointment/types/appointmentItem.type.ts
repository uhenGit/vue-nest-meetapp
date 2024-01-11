export type AppointmentItemType = {
  id: string;
  title: string;
  eventDate: Date;
  participants: string[];
  author: string;
  cancelled: boolean;
  cancellations: string[];
};
