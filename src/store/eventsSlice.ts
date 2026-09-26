import {
  apiCreateEvent,
  apiDeleteEvent,
  apiGetAllRSVPs,
  apiGetEventById,
  apiGetEvents,
  ApiRSVP,
  apiToggleRSVP,
  apiUpdateEvent,
} from '@/api/mockApi';
import { Event, EventFormValues, RSVPStatus } from '@/types/event';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface EventsState {
  list: Event[];
  selectedEvent: Event | null;
  rsvpStatuses: Record<string, RSVPStatus>;
  rsvpIds: Record<string, string>;
  allRSVPs: ApiRSVP[];
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  submitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  deleteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  rsvpStatus: 'idle' | 'loading';
  rsvpsListStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: EventsState = {
  list: [],
  selectedEvent: null,
  rsvpStatuses: {},
  rsvpIds: {},
  allRSVPs: [],
  listStatus: 'idle',
  detailStatus: 'idle',
  submitStatus: 'idle',
  deleteStatus: 'idle',
  rsvpStatus: 'idle',
  rsvpsListStatus: 'idle',
  error: null,
};

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
  async (values: EventFormValues, { getState }) => {
    const state = getState() as any;
    const user = state.user?.user;
    const organizer = user?.username || 'You';
    const organizerId = user?.userId;
    const { category, ...rest } = values;
    if (!category) throw new Error('Category is required');
    return apiCreateEvent({ ...rest, category, organizer, organizerId });
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

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (id: string) => {
    await apiDeleteEvent(id);
    return id;
  },
);

export const rsvpEvent = createAsyncThunk(
  'events/rsvp',
  async (
    { id, status }: { id: string; status: RSVPStatus },
    { getState },
  ) => {
    const state = getState() as any;
    const userId = state.user?.user?.userId;
    return apiToggleRSVP(id, status, userId);
  },
);

export const fetchAllRSVPs = createAsyncThunk(
  'events/fetchAllRSVPs',
  async (_, { getState }) => {
    const state = getState() as any;
    const userId = state.user?.user?.userId;
    const all = await apiGetAllRSVPs();
    if (!userId) return [];
    return all.filter((r) => String(r.userId) === String(userId));
  },
);
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
    clearDeleteStatus(state) {
      state.deleteStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
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

    builder
      .addCase(deleteEvent.pending, (state) => {
        state.deleteStatus = 'loading';
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        state.list = state.list.filter((e) => e.id !== action.payload);
        if (state.selectedEvent?.id === action.payload) {
          state.selectedEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.error.message ?? 'Failed to delete event';
      });

    builder
      .addCase(rsvpEvent.pending, (state) => {
        state.rsvpStatus = 'loading';
      })
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        state.rsvpStatus = 'idle';
        const { eventId, status, rsvpId } = action.payload;

        state.rsvpStatuses[eventId] = status;
        if (rsvpId) {
          state.rsvpIds[eventId] = rsvpId;
        } else {
          delete state.rsvpIds[eventId];
        }
      })
      .addCase(rsvpEvent.rejected, (state) => {
        state.rsvpStatus = 'idle';
      });

    builder
      .addCase(fetchAllRSVPs.pending, (state) => {
        state.rsvpsListStatus = 'loading';
      })
      .addCase(fetchAllRSVPs.fulfilled, (state, action) => {
        state.rsvpsListStatus = 'succeeded';
        state.allRSVPs = action.payload;
        // Reset rsvpStatuses and hydrate strictly for current user
        state.rsvpStatuses = {};
        state.rsvpIds = {};
        action.payload.forEach((r) => {
          state.rsvpStatuses[r.eventId] = r.status;
          if (r.id) state.rsvpIds[r.eventId] = r.id;
        });
      })
      .addCase(fetchAllRSVPs.rejected, (state) => {
        state.rsvpsListStatus = 'failed';
      });
  },
});

export const { clearSelectedEvent, clearSubmitStatus, clearDeleteStatus } =
  eventsSlice.actions;
export default eventsSlice.reducer;
