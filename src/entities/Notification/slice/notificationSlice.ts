import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import {
  getAllNotifications,
  GetAllNotificationsParams,
  updateAllNotifications,
  UpdateAllNotificationsParams,
} from '../api/notificationApi';
import { ApiNotification, Notification } from '../types/types';

/* ----------------------------- Состояние ----------------------------- */

export type NotificationsState = {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
};

const initialState: NotificationsState = {
  notifications: [],
  isLoading: false,
  error: null,
};

/* ------------------------------ Thunks ------------------------------- */

export const getAllNotificationsThunk = createAsyncThunk<
  Notification[], // <-- уже нормализованные в API
  GetAllNotificationsParams | void,
  { state: RootState; rejectValue: string }
>('notifications/getAll', async (_params = {}, { getState, rejectWithValue }) => {
  try {
    const token = getState().user.token;
    if (!token) return rejectWithValue('Нет токена пользователя');
    const list = await getAllNotifications(token);
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
  Notification[], // <-- тоже нормализованные
  UpdateAllNotificationsParams | undefined,
  { state: RootState; rejectValue: string }
>(
  'notifications/updateAll',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().user.token;
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

/* ----------------------------- Helpers --------------------------------
 * mergeReplaceFromServer: сервер прислал ПОЛНЫЙ список — замещаем UI-данные,
 *   НО сохраняем локальный is_active (кружок) у уже известных элементов,
 *   а у новых всегда is_active = false.
 * applyServerPatch: сервер прислал ЧАСТИЧНЫЙ список — аккуратно патчим поля,
 *   is_active НЕ трогаем; для новых — is_active = false.
 * ---------------------------------------------------------------------*/

function mergeReplaceFromServer(
  oldList: Notification[],
  serverList: Notification[]
): Notification[] {
  return serverList.map((srv) => {
    const prev = oldList.find((n) => n.id === srv.id);
    return {
      ...srv,
      is_active: prev?.is_active ?? false, // НИКОГДА не поднимаем с бэка
    };
  });
}

function applyServerPatch(
  oldList: Notification[],
  patchList: Notification[]
): Notification[] {
  const byId = new Map(patchList.map((x) => [x.id, x]));

  const updated = oldList.map((prev) => {
    const srv = byId.get(prev.id);
    if (!srv) return prev;
    return { ...prev, ...srv, is_active: prev.is_active }; // сохраняем локальный кружок
  });

  patchList.forEach((srv) => {
    if (!oldList.find((p) => p.id === srv.id)) {
      updated.push({ ...srv, is_active: false }); // новые без кружков
    }
  });

  return updated;
}

/* -------------------------------- Slice ------------------------------- */

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = mergeReplaceFromServer(state.notifications, action.payload);
    },

    // Реалтайм-уведомление: хотим всплыть → is_active = true
    addNotification: (state, action: PayloadAction<Notification | ApiNotification>) => {
      const raw: any = action.payload;
      const id = raw.id;
      const idx = state.notifications.findIndex((n) => n.id === id);
      const next: Notification = {
        id,
        title: raw.title ?? '',
        text: raw.text ?? raw.description ?? '',
        status: raw.status,
        color: raw.color,
        created: raw.created,
        is_read: !!(raw.is_read ?? raw.isRead),
        is_active: true, // кружок только локально
      };
      if (idx >= 0) state.notifications[idx] = { ...state.notifications[idx], ...next, is_active: true };
      else state.notifications.unshift(next);
    },

    // Выключить попап по id
    deactivateNotification: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find((n) => n.id === action.payload.id);
      if (it) it.is_active = false;
    },

    deactivateMany: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.notifications.forEach((n) => {
        if (ids.has(n.id)) n.is_active = false;
      });
    },

    // Локально пометить как прочитанное
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
        state.notifications = mergeReplaceFromServer(state.notifications, action.payload);
      })
      .addCase(getAllNotificationsThunk.rejected, (state) => {
        state.isLoading = false;
      })

      // update_all может вернуть только патч
      .addCase(updateAllNotificationsThunk.fulfilled, (state, action) => {
        state.notifications = applyServerPatch(state.notifications, action.payload);
      })
      .addCase(updateAllNotificationsThunk.rejected, (state) => { });
  },
});

export const {
  setNotifications,
  addNotification,
  deactivateNotification,
  deactivateMany,
  markAsRead,
  markManyAsRead,
  clearNotificationsError,
} = notificationSlice.actions;

export default notificationSlice.reducer;

/* --------------------------- Селекторы -------------------------- */

export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;

export const selectFirstActive = (state: RootState) =>
  state.notifications.notifications.find((n) => n.is_active && !n.is_read);

export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => !n.is_read).length;
