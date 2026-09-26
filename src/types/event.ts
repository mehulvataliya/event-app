export type EventCategory =
  | 'Technology'
  | 'Music'
  | 'Sports'
  | 'Art'
  | 'Food'
  | 'Business'
  | 'Health'
  | 'Education';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;       // ISO date string e.g. "2026-11-15"
  time: string;       // "HH:mm"
  location: string;
  coverColor: string; // gradient start colour
  organizer: string;
  organizerId?: string;
  attendees: number;
  category: EventCategory;
  imageUrl?: string;
}

export type RSVPStatus = 'going' | 'not-going' | null;

export interface EventFormValues {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory | '';
}
