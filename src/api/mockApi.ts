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

function normalise(raw: ApiEvent, fallbackId: string): Event {
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

const rsvpDB: Record<string, RSVPStatus> = {};

export async function apiGetEvents(): Promise<Event[]> {
  const { data } = await apiClient.get<ApiEvent[]>('/events');
  return data.map((item, i) => normalise(item, String(i + 1)));
}

export async function apiGetEventById(id: string): Promise<Event> {
  try {
    const { data } = await apiClient.get<ApiEvent>(`/events/${id}`);
    return normalise(data, id);
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
  payload: Omit<Event, 'id' | 'attendees' | 'coverColor' | 'organizer'>,
): Promise<Event> {
  const colours = [
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
  const body: Omit<Event, 'id'> = {
    ...payload,
    attendees: 0,
    coverColor: colours[Math.floor(Math.random() * colours.length)],
    organizer: 'You',
  };
  const { data } = await apiClient.post<ApiEvent>('/events', body);
  return normalise(data, data.id ?? 'new');
}

export async function apiUpdateEvent(
  id: string,
  payload: Partial<Omit<Event, 'id'>>,
): Promise<Event> {
  const { data } = await apiClient.put<ApiEvent>(`/events/${id}`, payload);
  return normalise(data, id);
}
export async function apiDeleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}

export async function apiRSVP(
  id: string,
  status: RSVPStatus,
): Promise<{ eventId: string; status: RSVPStatus }> {
  rsvpDB[id] = status;
  return { eventId: id, status };
}

export async function apiGetRSVP(id: string): Promise<RSVPStatus> {
  return rsvpDB[id] ?? null;
}
