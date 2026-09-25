import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  userId: string;
  username: string;
}

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  isModalVisible: boolean;
  pendingAction:
    | { type: 'create_event' }
    | { type: 'rsvp_event'; eventId: string }
    | null;
}

const STORAGE_KEY = '@events_app_user_profile';

const initialState: UserState = {
  user: null,
  isLoading: true,
  isModalVisible: false,
  pendingAction: null,
};

export const loadUserProfile = createAsyncThunk('user/loadProfile', async () => {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (json) {
    try {
      return JSON.parse(json) as UserProfile;
    } catch {
      return null;
    }
  }
  return null;
});

export const saveUserProfile = createAsyncThunk(
  'user/saveProfile',
  async (username: string, { getState }) => {
    const state = getState() as any;
    const existingUser = state.user?.user;
    const userId = existingUser?.userId || `user_${Date.now()}`;
    const trimmed = username.trim();
    const profile: UserProfile = { userId, username: trimmed };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    promptUserProfile(
      state,
      action: PayloadAction<
        { type: 'create_event' } | { type: 'rsvp_event'; eventId: string }
      >
    ) {
      state.pendingAction = action.payload;
      state.isModalVisible = true;
    },
    openProfileModal(state) {
      state.isModalVisible = true;
      state.pendingAction = null;
    },
    closeProfileModal(state) {
      state.isModalVisible = false;
      state.pendingAction = null;
    },
    clearPendingAction(state) {
      state.pendingAction = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loadUserProfile.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(saveUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isModalVisible = false;
      });
  },
});

export const {
  promptUserProfile,
  openProfileModal,
  closeProfileModal,
  clearPendingAction,
} = userSlice.actions;

export default userSlice.reducer;
