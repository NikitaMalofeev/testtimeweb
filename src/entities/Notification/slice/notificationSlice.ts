// entities/Notifications/slice/notificationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import { setError } from 'entities/Error/slice/errorSlice';
// import { getAllNotifications, updateNotification } from 'entities/Notifications/api/notificationsApi';
import { Notification, NotificationsState, NotificationStatus } from '../types/types';

/* -------------------------------------------------------------------------- */
/* THUNKS */
/* -------------------------------------------------------------------------- */

/** Получить все уведомления пользователя */
// export const getAllNotificationThunk = createAsyncThunk<
//   Notification[],
//   void,
//   { state: RootState; rejectValue: string }
// >('notifications/getAll', async (_, { getState, dispatch, rejectWithValue }) => {
//   try {
//     const token = getState().user.token;
//     const data = await getAllNotifications(token);
//     return data;
//   } catch (err: any) {
//     const msg = err?.response?.data?.errorText || err?.message || 'Ошибка загрузки уведомлений';
//     dispatch(setError(msg));
//     return rejectWithValue(msg);
//   }
// });

/** Обновить уведомление на бэке (например, сменить статус или текст) */
// export const updateNotificationThunk = createAsyncThunk<
//   Notification,
//   { id: string; patch: Partial<Pick<Notification, 'title' | 'description' | 'status'>>; onSuccess?: () => void },
//   { state: RootState; rejectValue: string }
// >('notifications/update', async ({ id, patch, onSuccess }, { getState, dispatch, rejectWithValue }) => {
//   try {
//     const token = getState().user.token;
//     const updated = await updateNotification(id, patch, token);
//     onSuccess?.();
//     return updated;
//   } catch (err: any) {
//     const msg = err?.response?.data?.errorText || err?.message || 'Ошибка обновления уведомления';
//     dispatch(setError(msg));
//     return rejectWithValue(msg);
//   }
// });

/* -------------------------------------------------------------------------- */
/* INITIAL STATE */
/* -------------------------------------------------------------------------- */

const initialState: NotificationsState = {
  notifications: [],
  error: null,
  isLoading: false,
};


/* -------------------------------------------------------------------------- */
/* SLICE */
/* -------------------------------------------------------------------------- */

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /** Полностью заменить список уведомлений */
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },

    /** Добавить уведомление (если уже есть с таким id — заменяем) */
    addNotification: (state, action: PayloadAction<Notification>) => {
      const idx = state.notifications.findIndex((n) => n.id === action.payload.id);
      if (idx >= 0) {
        state.notifications[idx] = action.payload;
      } else {
        state.notifications.unshift(action.payload);
      }
    },

    /** Локально обновить статус уведомления по id */
    updateNotificationStatus: (
      state,
      action: PayloadAction<{ id: string; status: NotificationStatus }>
    ) => {
      const { id, status } = action.payload;
      const item = state.notifications.find((n) => n.id === id);
      if (item) item.status = status;
    },

    /** Сбросить ошибки/флаги */
    clearNotificationsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
    // getAllNotificationThunk
    // .addCase(getAllNotificationThunk.pending, (state) => {
    //   state.isLoading = true;
    //   state.error = null;
    // })
    // .addCase(getAllNotificationThunk.fulfilled, (state, action) => {
    //   state.isLoading = false;
    //   state.notifications = action.payload;
    // })
    // .addCase(getAllNotificationThunk.rejected, (state, action) => {
    //   state.isLoading = false;
    //   state.error = action.payload || 'Не удалось загрузить уведомления';
    // })

    // updateNotificationThunk
    // .addCase(updateNotificationThunk.fulfilled, (state, action) => {
    //   const updated = action.payload;
    //   const idx = state.notifications.findIndex((n) => n.id === updated.id);
    //   if (idx >= 0) {
    //     state.notifications[idx] = { ...state.notifications[idx], ...updated };
    //   } else {
    //     state.notifications.unshift(updated);
    //   }
    // })
    // .addCase(updateNotificationThunk.rejected, (state, action) => {
    //   state.error = action.payload || 'Не удалось обновить уведомление';
    // });
  },
});

/* -------------------------------------------------------------------------- */
/* ACTIONS & SELECTORS */
/* -------------------------------------------------------------------------- */

export const {
  setNotifications,
  addNotification,
  updateNotificationStatus,
  clearNotificationsError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectNotificationsLoading = (state: RootState) => state.notifications.isLoading;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectNotificationById = (id: string) => (state: RootState) =>
  state.notifications.notifications.find((n) => n.id === id);
