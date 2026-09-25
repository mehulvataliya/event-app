import {
  apiCreateEvent,
  apiGetEventById,
  apiGetEvents,
  apiRSVP,
  apiUpdateEvent,
} from '@/api/mockApi';
import { Event, EventFormValues, RSVPStatus } from '@/types/event';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// ─── State ────────────────────────────────────────────────────────────────────
interface EventsState {
  list: Event[];
  selectedEvent: Event | null;
  rsvpStatuses: Record<string, RSVPStatus>;
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  submitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  rsvpStatus: 'idle' | 'loading';
  error: string | null;
}

const initialState: EventsState = {
  list: [],
  selectedEvent: null,
  rsvpStatuses: {},
  listStatus: 'idle',
  detailStatus: 'idle',
  submitStatus: 'idle',
  rsvpStatus: 'idle',
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchEvents = createAsyncThunk('events/fetchAll', async () => {
  return apiGetEvents();
});

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id: string, { getState }) => {
    const state = getState() as { events: EventsState };
    const cached = state.events.list.find((e) => e.id === id);
    if (cached) return cached;

    return apiGetEventById(id);
  },
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (values: EventFormValues) => {
    const { category, ...rest } = values;
    if (!category) throw new Error('Category is required');
    return apiCreateEvent({ ...rest, category });
  },
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, values }: { id: string; values: EventFormValues }) => {
    const { category, ...rest } = values;
    if (!category) throw new Error('Category is required');
    return apiUpdateEvent(id, { ...rest, category });
  },
);

export const rsvpEvent = createAsyncThunk(
  'events/rsvp',
  async ({ id, status }: { id: string; status: RSVPStatus }) => {
    return apiRSVP(id, status);
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearSelectedEvent(state) {
      state.selectedEvent = null;
      state.detailStatus = 'idle';
    },
    clearSubmitStatus(state) {
      state.submitStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    // fetchEvents
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error.message ?? 'Failed to load events';
      });

    // fetchEventById
    builder
      .addCase(fetchEventById.pending, (state) => {
        state.detailStatus = 'loading';
        state.selectedEvent = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.error.message ?? 'Failed to load event';
      });

    // createEvent
    builder
      .addCase(createEvent.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.list = [action.payload, ...state.list];
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.error = action.error.message ?? 'Failed to create event';
      });

    // updateEvent
    builder
      .addCase(updateEvent.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        const idx = state.list.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedEvent?.id === action.payload.id) {
          state.selectedEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.error = action.error.message ?? 'Failed to update event';
      });

    // rsvpEvent
    builder
      .addCase(rsvpEvent.pending, (state) => {
        state.rsvpStatus = 'loading';
      })
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        state.rsvpStatus = 'idle';
        const { eventId, status } = action.payload;
        state.rsvpStatuses[eventId] = status;

        const listIdx = state.list.findIndex((e) => e.id === eventId);
        if (listIdx !== -1) {
          const prev = state.rsvpStatuses[eventId];
          const event = state.list[listIdx];
          if (prev === 'going' && status !== 'going')
            event.attendees = Math.max(0, event.attendees - 1);
          if (prev !== 'going' && status === 'going') event.attendees += 1;
        }
        if (state.selectedEvent?.id === eventId) {
          state.rsvpStatuses[eventId] = status;
        }
      })
      .addCase(rsvpEvent.rejected, (state) => {
        state.rsvpStatus = 'idle';
      });
  },
});

export const { clearSelectedEvent, clearSubmitStatus } = eventsSlice.actions;
export default eventsSlice.reducer;
