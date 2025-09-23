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
  hydrated: boolean; // <- уже делали хотя бы одну полную загрузку?
};

const initialState: NotificationsState = {
  notifications: [],
  isLoading: false,
  error: null,
  hydrated: false,
};

/* ------------------------------ Thunks ------------------------------- */

// Возвращаем НОРМАЛИЗОВАННЫЕ Notification[] из api (там is_active всегда false)
export const getAllNotificationsThunk = createAsyncThunk<
  Notification[],
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

// Массовые апдейты. Сервер обычно возвращает ПАТЧ (часть списка)
export const updateAllNotificationsThunk = createAsyncThunk<
  Notification[],
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
 * mergeReplaceFromServerHydrateAware:
 *   - если это ПЕРВАЯ загрузка (hydrated=false) → новые is_active=false (не вспыхиваем)
 *   - если НЕ первая (hydrated=true) → новые is_active = !is_read (вспыхиваем только для непрочитанных)
 *   - существующим сохраняем их локальный is_active
 * applyServerPatch:
 *   - существующим патчим поля, но is_active сохраняем
 *   - НОВЫЕ из патча делаем is_active = !is_read (вспыхнуть)
 * ---------------------------------------------------------------------*/

function mergeReplaceFromServerHydrateAware(
  oldList: Notification[],
  serverList: Notification[],
  wasHydrated: boolean
): Notification[] {
  const byId = new Map(oldList.map(n => [n.id, n]));
  const serverIds = new Set(serverList.map(n => n.id));

  // Обрабатываем серверные уведомления
  const updatedServerNotifications = serverList.map(srv => {
    const prev = byId.get(srv.id);
    if (prev) {
      return { ...srv, is_active: prev.is_active };
    }
    // Новый элемент: активируем только синие уведомления после первого гидрата
    return { ...srv, is_active: wasHydrated ? (!srv.is_read && srv.status === 'notif_info') : false };
  });

  // Сохраняем локальные уведомления (например, чат-уведомления), которых нет на сервере
  const localOnlyNotifications = oldList.filter(n =>
    typeof n.id === 'string' &&
    n.id.startsWith('chat-') &&
    !serverIds.has(n.id)
  );

  // Объединяем серверные и локальные уведомления
  return [...updatedServerNotifications, ...localOnlyNotifications];
}

function applyServerPatch(
  oldList: Notification[],
  patchList: Notification[]
): Notification[] {
  const byId = new Map(patchList.map(x => [x.id, x]));

  // патчим существующие
  const updated = oldList.map(prev => {
    const srv = byId.get(prev.id);
    if (!srv) return prev;
    return { ...prev, ...srv, is_active: prev.is_active };
  });

  // добавляем новые из патча и СРАЗУ активируем (если они непрочитанные и синие)
  patchList.forEach(srv => {
    if (!oldList.find(p => p.id === srv.id)) {
      updated.unshift({ ...srv, is_active: !srv.is_read && srv.status === 'notif_info' });
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
      state.notifications = mergeReplaceFromServerHydrateAware(
        state.notifications,
        action.payload,
        state.hydrated
      );
      state.hydrated = true;
    },

    // Реалтайм-событие (вебсокет/ SSE) — сразу вспыхиваем
    addNotification: (state, action: PayloadAction<Notification | ApiNotification>) => {
      const raw: any = action.payload;
      const id = raw.id;
      const idx = state.notifications.findIndex(n => n.id === id);
      const next: Notification = {
        id,
        title: raw.title ?? '',
        text: raw.text ?? raw.description ?? '',
        status: raw.status,
        color: raw.color,
        created: raw.created,
        is_read: !!(raw.is_read ?? raw.isRead),
        is_active: raw.is_active !== undefined ? raw.is_active : (raw.status === 'notif_info'), // используем переданный is_active или активируем только info уведомления
      };
      if (idx >= 0) {
        state.notifications[idx] = { ...state.notifications[idx], ...next, is_active: raw.is_active !== undefined ? raw.is_active : (raw.status === 'notif_info') };
      } else {
        state.notifications.unshift(next);
      }
    },

    // Закрыть попап у конкретной карточки
    deactivateNotification: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find(n => n.id === action.payload.id);
      if (it) it.is_active = false;
    },

    // Снять попап со многих
    deactivateMany: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.notifications.forEach(n => { if (ids.has(n.id)) n.is_active = false; });
    },

    // Локально пометить прочитанным
    markAsRead: (state, action: PayloadAction<{ id: string }>) => {
      const it = state.notifications.find(n => n.id === action.payload.id);
      if (it) it.is_read = true;
    },

    markManyAsRead: (state, action: PayloadAction<string[]>) => {
      const ids = new Set(action.payload);
      state.notifications.forEach(n => { if (ids.has(n.id)) n.is_read = true; });
    },

    clearNotificationsError: (state) => { state.error = null; },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getAllNotificationsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = mergeReplaceFromServerHydrateAware(
          state.notifications,
          action.payload,
          state.hydrated
        );
        state.hydrated = true;
      })
      .addCase(getAllNotificationsThunk.rejected, (state) => {
        state.isLoading = false;
      })

      // Сервер вернул ПАТЧ — новые должны вспыхнуть
      .addCase(updateAllNotificationsThunk.fulfilled, (state, action) => {
        state.notifications = applyServerPatch(state.notifications, action.payload);
      })
      .addCase(updateAllNotificationsThunk.rejected, () => { });
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
  state.notifications.notifications.filter(n => n.status === 'notif_info');

// Попап выводим по одному: активно, непрочитано и только info уведомления
export const selectFirstActive = (state: RootState) =>
  state.notifications.notifications.find(n => n.is_active && !n.is_read && n.status === 'notif_info');

export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter(n => !n.is_read).length;

