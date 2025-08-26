// entities/Notification/slice/notificationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import {
  getAllNotifications,
  GetAllNotificationsParams,
  updateAllNotifications,
  UpdateAllNotificationsParams,
} from '../api/notificationApi';
import { NotificationColor } from 'features/Notifications/NotificationCard/NotificationCard';
import { ApiNotification, Notification } from '../types/types';

/* ----------------------------- Типы ----------------------------- */

// Ровно то, что приходит от бэка

// Клиентская модель (добавляем только is_active)


export type NotificationsState = {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
};

/* ----------------------------- Thunks --------------------------- */

// Возвращаем ТОЛЬКО серверную модель!
export const getAllNotificationsThunk = createAsyncThunk<
  ApiNotification[],
  GetAllNotificationsParams | void,
  { state: RootState; rejectValue: string }
>('notifications/getAll', async (_params = {}, { getState, rejectWithValue }) => {
  try {
    const token = getState().user.token;
    if (!token) return rejectWithValue('Нет токена пользователя');
    const list = await getAllNotifications(token); // Promise<ApiNotification[]>
    return list;
  } catch (err: any) {
    const msg =
      err?.response?.data?.errorText ||
      err?.message ||
      'Ошибка загрузки уведомлений';
    return rejectWithValue(msg);
  }
});

// Возвращаем ТОЛЬКО серверную модель!
export const updateAllNotificationsThunk = createAsyncThunk<
  ApiNotification[],
  UpdateAllNotificationsParams | undefined,
  { state: RootState; rejectValue: string }
>(
  'notifications/updateAll',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token;
      if (!token) return rejectWithValue('Нет токена пользователя');
      const list = await updateAllNotifications(token, params); // Promise<ApiNotification[]>
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

/* ----------------------------- Helpers -------------------------- */

// Массовая загрузка/синхронизация
function mergeServerIntoState(
  oldList: Notification[],
  serverList: ApiNotification[]
): Notification[] {
  return serverList.map((srv) => {
    const prev = oldList.find((n) => n.id === srv.id);
    const isNew = !prev;

    return {
      ...srv,
      // сервер is_active не присылает; для новых — активируем, если не прочитано
      // для существующих — сохраняем локальное значение
      is_active: isNew ? !srv.is_read : (prev?.is_active ?? false),
    } as Notification;
  });
}

/* ------------------------------ Slice --------------------------- */

const initialState: NotificationsState = {
  notifications: [
  ],
  isLoading: false,
  error: null,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Если вручную кладёшь массив с бэка
    setNotifications: (state, action: PayloadAction<ApiNotification[]>) => {
      state.notifications = mergeServerIntoState(state.notifications, action.payload);
    },

    // Пришло по сокету одиночное серверное уведомление — всплыть немедленно
    addNotification: (state, action: PayloadAction<ApiNotification>) => {
      const srv = action.payload;
      const idx = state.notifications.findIndex((n) => n.id === srv.id);

      const next: Notification = {
        ...srv,
        // хотим всегда всплывать на realtime—событии:
        // если предпочитаешь уважать прочитанность, поставь !srv.is_read
        is_active: true,
      };

      if (idx >= 0) state.notifications[idx] = next;
      else state.notifications.unshift(next);
    },

    // Локально выключить попап (не трогаем прочитанность)
    deactivateNotification: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find((n) => n.id === action.payload.id);
      if (it) it.is_active = false;
    },

    // Пометить прочитанным локально (удобно для "прочитать всё")
    markAsRead: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find((n) => n.id === action.payload.id);
      if (it) it.is_read = true;
    },

    markManyAsRead: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.notifications.forEach((n) => {
        if (ids.has(n.id)) n.is_read = true;
      });
    },

    clearNotificationsError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getAllNotificationsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = mergeServerIntoState(state.notifications, action.payload);
      })
      .addCase(getAllNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
      })

      .addCase(updateAllNotificationsThunk.fulfilled, (state, action) => {
        state.notifications = mergeServerIntoState(state.notifications, action.payload);
      })
      .addCase(updateAllNotificationsThunk.rejected, (state, action) => {
      });
  },
});

export const {
  setNotifications,
  addNotification,
  deactivateNotification,
  markAsRead,
  markManyAsRead,
  clearNotificationsError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

/* --------------------------- Селекторы -------------------------- */

export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;

// Текущее всплывающее уведомление: активно и не прочитано
export const selectFirstActive = (state: RootState) =>
  state.notifications.notifications.find((n) => n.is_active && !n.is_read);

export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => !n.is_read).length;
