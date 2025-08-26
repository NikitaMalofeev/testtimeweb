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

/* ----------------------------- Типы ----------------------------- */

// Ровно то, что приходит от бэка
export type ApiNotification = {
  id: string;
  title?: string | null;
  text?: string;                       // <- опционально, как у тебя с бэка
  created?: string;
  color?: NotificationColor;
  isRead: boolean;                     // серверное "прочитано"
  isActive?: boolean;                  // может прийти, может нет
};

// Клиентская (с локальными флагами попапа)
export type Notification = ApiNotification & {
  isActive: boolean; // локальный флаг участия во всплывающем попапе
  shown: boolean;    // уже показали в этой сессии
};

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
    const list = await getAllNotifications(token); // <-- должно быть Promise<ApiNotification[]>
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

function mergeServerIntoState(
  oldList: Notification[],
  serverList: ApiNotification[]
): Notification[] {
  return serverList.map((srv) => {
    const prev = oldList.find((n) => n.id === srv.id);
    const isNew = !prev;

    const isActive =
      typeof srv.isActive === 'boolean'
        ? srv.isActive
        : (isNew
          ? !srv.isRead   // ← для новых авто-включаем (или поставь true, если хочешь всегда)
          : (prev?.isActive ?? false));

    const shown = isNew ? false : (prev?.shown ?? false);

    return { ...srv, isActive, shown } as Notification;
  });
}

/* ------------------------------ Slice --------------------------- */

const initialState: NotificationsState = {
  notifications: [],
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

    // Пришло по сокету одиночное серверное уведомление
    addNotification: (state, action: PayloadAction<ApiNotification>) => {
      const srv = action.payload;
      const idx = state.notifications.findIndex((n) => n.id === srv.id);

      const next: Notification = {
        ...srv,
        // если сервер явно прислал isActive — уважаем, иначе для realtime-события включаем попап
        isActive: (typeof srv.isActive === 'boolean')
          ? srv.isActive
          : true,
        shown: idx >= 0 ? state.notifications[idx].shown : false,
      };

      if (idx >= 0) state.notifications[idx] = next;
      else state.notifications.unshift(next);
    },
    markNotificationShown: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find((n) => n.id === action.payload.id);
      if (it) it.shown = true;
    },

    deactivateNotification: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find((n) => n.id === action.payload.id);
      if (it) it.isActive = false;
    },

    // "Просмотреть все" — локально ставим прочитанными и отключаем попапы
    markManyAsRead: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.notifications.forEach((n) => {
        if (ids.has(n.id)) {
          n.isRead = true;
          n.isActive = false;
        }
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
        state.error = action.payload || 'Ошибка загрузки';
      })

      .addCase(updateAllNotificationsThunk.fulfilled, (state, action) => {
        // синхронизируем isRead c бэком, локальные флаги сохраняем
        state.notifications = mergeServerIntoState(state.notifications, action.payload);
      })
      .addCase(updateAllNotificationsThunk.rejected, (state, action) => {
        state.error = action.payload || 'Ошибка обновления';
      });
  },
});

export const {
  setNotifications,
  addNotification,
  markNotificationShown,
  deactivateNotification,
  markManyAsRead,
  clearNotificationsError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

/* --------------------------- Селекторы -------------------------- */
export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;

export const selectFirstActiveUnshown = (state: RootState) =>
  state.notifications.notifications.find((n) => n.isActive && !n.shown);

export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => !n.isRead).length;
