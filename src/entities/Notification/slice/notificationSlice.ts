import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import {
  Notification,
  NotificationsState,
  LkNotificationStatus,
} from '../types/types';
import {
  getAllNotifications,
  GetAllNotificationsParams,
  updateAllNotifications,
  UpdateAllNotificationsParams,
} from '../api/notificationApi';
import { set } from 'lodash';

/* -------------------------------------------------------------------------- */
/* THUNKS                                                                     */
/* -------------------------------------------------------------------------- */

/** Загрузка массива уведомлений и запись в Redux */
export const getAllNotificationsThunk = createAsyncThunk<
  Notification[],
  GetAllNotificationsParams | void,
  { state: RootState; rejectValue: string }
>('notifications/getAll', async (_params = {}, { getState, dispatch, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).user?.token;
    if (!token) return rejectWithValue('Нет токена пользователя');
    const list = await getAllNotifications(token); // параметры не нужны на бэке
    dispatch(setNotifications(list));
    return list;
  } catch (err: any) {
    const msg =
      err?.response?.data?.errorText ||
      err?.message ||
      'Ошибка загрузки уведомлений';
    return rejectWithValue(msg);
  }
});

export const updateAllNotificationsThunk = createAsyncThunk<
  Notification[],
  UpdateAllNotificationsParams | undefined,
  { state: RootState; rejectValue: string }
>(
  'notifications/updateAllNotificationsThunk',
  async (params = {}, { getState, rejectWithValue, dispatch }) => {
    try {
      const token = (getState() as RootState).user?.token;
      if (!token) return rejectWithValue('Нет токена пользователя');
      const list = await updateAllNotifications(token, params);
      return list;
    } catch (err: any) {
      const msg =
        err?.response?.data?.errorText ||
        err?.message ||
        'Ошибка обновления уведомлений';
      return rejectWithValue(msg);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* SLICE                                                                      */
/* -------------------------------------------------------------------------- */

const initialState: NotificationsState = {
  notifications: [],
  error: null,
  isLoading: false,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload.map(n => ({ ...n, shown: false } as Notification));
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const incoming = { ...action.payload, shown: false } as Notification;
      const i = state.notifications.findIndex(n => n.id === incoming.id);
      if (i >= 0) state.notifications[i] = incoming;
      else state.notifications.unshift(incoming);
    },

    updateNotificationStatus: (
      state,
      action: PayloadAction<{ id: string; status: LkNotificationStatus }>
    ) => {
      const { id, status } = action.payload;
      const item = state.notifications.find((n) => n.id === id);
      if (item) item.status = status;
    },

    /** Пометить "показано" (фронтовый флаг, чтобы повторно не всплывало) */
    markNotificationShown: (state, action: PayloadAction<{ id: string }>) => {
      const item = state.notifications.find((n) => n.id === action.payload.id);
      if (item) (item as any).shown = true;
    },

    /** Массово пометить список id как прочитанные */
    markManyAsRead: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.notifications.forEach((n) => {
        if (ids.has(n.id)) {
          (n as any).isRead = true;                  // <-- главное поле для UI
          (n as any).status = 'read' as LkNotificationStatus; // если где-то нужно
        }
      });
    },

    clearNotificationsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
  },
});

export const {
  setNotifications,
  addNotification,
  updateNotificationStatus,
  markNotificationShown,
  markManyAsRead,
  clearNotificationsError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

/* ---------------------------- Selectors ---------------------------- */
export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;

export const selectNotificationsLoading = (state: RootState) =>
  state.notifications.isLoading;

export const selectNotificationsError = (state: RootState) =>
  state.notifications.error;

export const selectNotificationById =
  (id: string) => (state: RootState) =>
    state.notifications.notifications.find((n) => n.id === id);

/** Первое уведомление, которое не прочитано и ещё не показывалось во всплывашке */
export const selectFirstUnreadUnshown = (state: RootState) =>
  state.notifications.notifications.find((n: any) => !n.isRead);

/** Кол-во непрочитанных */
export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => n.isRead).length;
export const selectFirstActiveUnshown = (state: RootState) =>
  state.notifications.notifications.find((n: any) => n.isActive);