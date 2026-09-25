import { Event, RSVPStatus } from '@/types/event';
import axios, { AxiosError } from 'axios';

// ─── Axios instance ───────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: 'https://6ab61d61c4c7bb67b9187751.mockapi.io/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

type ApiEvent = Partial<Event> & {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  id?: string;
  imageUrl?: string;
};

export interface ApiRSVP {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
}
const DEMO_USER_ID = 'demo-user-1';
const COVER_COLOURS = [
  '#6C63FF',
  '#FF6584',
  '#43B89C',
  '#F9844A',
  '#208AEF',
  '#FFC75F',
  '#90BE6D',
  '#577590',
  '#E63946',
  '#4CC9F0',
  '#B5838D',
  '#7B2D8B',
];

function randomColour() {
  return COVER_COLOURS[Math.floor(Math.random() * COVER_COLOURS.length)];
}

function normaliseEvent(raw: ApiEvent, fallbackId: string): Event {
  return {
    id: raw.id ?? fallbackId,
    title: raw.title,
    description: raw.description,
    date: raw.date,
    time: raw.time,
    location: raw.location,
    coverColor: raw.coverColor ?? '#6C63FF',
    organizer: raw.organizer ?? 'Unknown',
    attendees: raw.attendees ?? 0,
    category: raw.category ?? 'Technology',
  };
}
export async function apiGetEvents(): Promise<Event[]> {
  const { data } = await apiClient.get<ApiEvent[]>('/events');
  return data.map((item, i) => normaliseEvent(item, String(i + 1)));
}
export async function apiGetEventById(id: string): Promise<Event> {
  try {
    const { data } = await apiClient.get<ApiEvent>(`/events/${id}`);
    return normaliseEvent(data, id);
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (
      axiosErr.response?.status === 404 ||
      axiosErr.response?.status === 400
    ) {
      const all = await apiGetEvents();
      const found = all.find((e) => e.id === id);
      if (found) return found;
      throw new Error(`Event "${id}" not found`);
    }
    throw err;
  }
}
export async function apiCreateEvent(
  payload: Omit<Event, 'id' | 'attendees' | 'coverColor' | 'organizer'> & {
    organizer?: string;
  },
): Promise<Event> {
  const body: Omit<Event, 'id'> = {
    ...payload,
    attendees: 0,
    coverColor: randomColour(),
    organizer: payload.organizer || 'You',
  };
  const { data } = await apiClient.post<ApiEvent>('/events', body);
  return normaliseEvent(data, data.id ?? 'new');
}
export async function apiUpdateEvent(
  id: string,
  payload: Partial<Omit<Event, 'id'>>,
): Promise<Event> {
  const { data } = await apiClient.put<ApiEvent>(`/events/${id}`, payload);
  return normaliseEvent(data, id);
}
export async function apiDeleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}
export async function apiGetAllRSVPs(): Promise<ApiRSVP[]> {
  const { data } = await apiClient.get<ApiRSVP[]>('/rsvps');
  return data;
}
export async function apiGetRSVPsForEvent(eventId: string): Promise<ApiRSVP[]> {
  const { data } = await apiClient.get<ApiRSVP[]>('/rsvps', {
    params: { eventId },
  });
  return data;
}
export async function apiCreateRSVP(
  eventId: string,
  status: RSVPStatus,
  userId: string = DEMO_USER_ID,
): Promise<ApiRSVP> {
  const { data } = await apiClient.post<ApiRSVP>('/rsvps', {
    eventId,
    userId,
    status,
  });
  return data;
}
export async function apiUpdateRSVP(
  rsvpId: string,
  status: RSVPStatus,
): Promise<ApiRSVP> {
  const { data } = await apiClient.put<ApiRSVP>(`/rsvps/${rsvpId}`, { status });
  return data;
}
export async function apiCancelRSVP(rsvpId: string): Promise<void> {
  await apiClient.delete(`/rsvps/${rsvpId}`);
}
export async function apiToggleRSVP(
  eventId: string,
  newStatus: RSVPStatus,
  userId?: string,
): Promise<{ eventId: string; status: RSVPStatus; rsvpId: string | null }> {
  const targetUserId = userId || DEMO_USER_ID;
  const allRSVPs = await apiGetAllRSVPs();
  const myRSVP = allRSVPs.find(
    (r) =>
      String(r.eventId) === String(eventId) &&
      String(r.userId) === String(targetUserId),
  );

  if (newStatus === null) {
    if (myRSVP) await apiCancelRSVP(myRSVP.id);
    return { eventId, status: null, rsvpId: null };
  }

  if (myRSVP) {
    const updated = await apiUpdateRSVP(myRSVP.id, newStatus);
    return { eventId, status: updated.status, rsvpId: updated.id };
  } else {
    const created = await apiCreateRSVP(eventId, newStatus, targetUserId);
    return { eventId, status: created.status, rsvpId: created.id };
  }
}
