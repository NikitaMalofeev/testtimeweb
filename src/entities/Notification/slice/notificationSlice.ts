import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import { Notification } from '../types/types';

export type NotificationStatus = 'unread' | 'read' | 'archived';


export interface NotificationsState {
  notifications: Notification[];
  error: string | null;
  isLoading: boolean;
}

const initialState: NotificationsState = {
  notifications: [
    // {
    //   id: 'n1',
    //   title: 'Индивидуальная инвестиционная рекомендация',
    //   description: 'Lorem ipsum dolor sit amet...',
    //   status: 'unread',
    //   color: 'blue',
    //   createdAt: new Date(),
    //   shown: false,
    // },
    // {
    //   id: 'n2',
    //   title: 'Подписка неактивна',
    //   description: 'Для возобновления услуг необходимо произвести оплату.',
    //   status: 'unread',
    //   color: 'red',
    //   createdAt: new Date(),
    //   shown: false,
    // },
    // {
    //   id: 'n3',
    //   title: 'Обновление правил',
    //   description: 'Мы обновили пользовательское соглашение.',
    //   status: 'read',
    //   color: 'green',
    //   createdAt: new Date(),
    //   shown: true,
    // },
  ],
  error: null,
  isLoading: false,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },

    addNotification: (state, action: PayloadAction<Notification>) => {
      const idx = state.notifications.findIndex((n) => n.id === action.payload.id);
      if (idx >= 0) state.notifications[idx] = action.payload;
      else state.notifications.unshift(action.payload);
    },

    updateNotificationStatus: (
      state,
      action: PayloadAction<{ id: string; status: NotificationStatus }>
    ) => {
      const { id, status } = action.payload;
      const item = state.notifications.find((n) => n.id === id);
      if (item) item.status = status;
    },

    /** Пометить "показано" */
    markNotificationShown: (state, action: PayloadAction<{ id: string }>) => {
      const item = state.notifications.find((n) => n.id === action.payload.id);
      if (item) item.shown = true;
    },

    /** Массово пометить список id как read */
    markManyAsRead: (state, action: PayloadAction<string[]>) => {
      const setIds = new Set(action.payload);
      state.notifications.forEach((n) => {
        if (setIds.has(n.id)) n.status = 'read';
      });
    },

    clearNotificationsError: (state) => {
      state.error = null;
    },
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
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectNotificationsLoading = (state: RootState) => state.notifications.isLoading;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectNotificationById =
  (id: string) => (state: RootState) => state.notifications.notifications.find((n) => n.id === id);

/** Первое непрочитанное, которое ещё не показывали во всплывашке */
export const selectFirstUnreadUnshown = (state: RootState) =>
  state.notifications.notifications.find((n) => n.status === 'unread' && !n.shown);

/** Кол-во непрочитанных */
export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((n) => n.status === 'unread').length;
