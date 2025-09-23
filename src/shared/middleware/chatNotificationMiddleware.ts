import { Middleware } from '@reduxjs/toolkit';
import { addMessage, setMessages, setUnreadAnswersCount } from 'entities/SupportChat/slice/supportChatSlice';
import { addNotification, markManyAsRead } from 'entities/Notification/slice/notificationSlice';
import { ChatMessage } from 'entities/SupportChat/model/chatModel';
import { LkNotificationStatus } from 'entities/Notification/types/types';

export const chatNotificationMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  const createNotificationForMessage = (msg: ChatMessage & { id?: number; is_edit?: boolean }, isNewMessage = false) => {
    if (msg?.is_answer && !msg?.is_edit) {
      console.log('ChatNotificationMiddleware: Creating notification for support answer', msg.id);

      // Определяем статус прочтения на основе логики чата
      const state = store.getState();
      const storedAnswerCount = Number(localStorage.getItem("chatAnswerCount") || 0);
      const currentAnswerCount = state.supportChat.messages.filter((m: any) => m.is_answer).length;
      const unreadCount = Math.max(0, currentAnswerCount - storedAnswerCount);

      // Сообщение считается прочитанным, если unreadCount = 0 или если это старое сообщение и оно не в числе последних непрочитанных
      const recentAnswers = state.supportChat.messages
        .filter((m: any) => m.is_answer)
        .slice(0, unreadCount);
      const isRead = unreadCount === 0 || !recentAnswers.some((m: any) => m.id === msg.id);

      const notification = {
        id: `chat-${msg.id || Date.now()}`,
        title: 'Сообщение от службы поддержки',
        text: msg.text || msg.text_for_files || 'Сообщение от службы поддержки',
        status: 'notif_info' as LkNotificationStatus,
        color: 'blue' as const,
        created: msg.created || new Date().toISOString(),
        is_read: isRead,
        is_active: isNewMessage && !isRead // Активируем попап только для новых непрочитанных сообщений
      };
      console.log('ChatNotificationMiddleware: Dispatching notification:', notification, 'isRead:', isRead);
      store.dispatch(addNotification(notification));
    }
  };

  // Отслеживаем добавление новых сообщений
  if (addMessage.match(action)) {
    const msg = action.payload as ChatMessage & { id?: number; is_edit?: boolean };
    console.log('ChatNotificationMiddleware: addMessage action detected', msg);

    // Если это новый ответ поддержки (не редактирование), создаем уведомление
    if (msg?.is_answer && !msg?.is_edit) {
      createNotificationForMessage(msg, true); // Это новое сообщение
    } else {
      console.log('ChatNotificationMiddleware: Not creating notification - is_answer:', msg?.is_answer, 'is_edit:', msg?.is_edit);
    }
  }

  // Отслеживаем загрузку истории сообщений
  if (setMessages.match(action)) {
    const messages = action.payload as ChatMessage[];
    console.log('ChatNotificationMiddleware: setMessages action detected, processing', messages.length, 'messages');

    // Создаем уведомления для всех ответов поддержки из истории
    messages.forEach((msg) => {
      if (msg?.is_answer && !msg?.is_edit) {
        createNotificationForMessage(msg as ChatMessage & { id?: number; is_edit?: boolean }, false); // Это загрузка истории
      }
    });
  }

  // Отслеживаем изменение количества непрочитанных ответов
  if (setUnreadAnswersCount.match(action)) {
    const newUnreadCount = action.payload;
    console.log('ChatNotificationMiddleware: unreadAnswersCount changed to', newUnreadCount);

    // Если количество непрочитанных стало 0, помечаем все чат-уведомления как прочитанные
    if (newUnreadCount === 0) {
      const state = store.getState();
      const chatNotificationIds = state.notifications.notifications
        .filter((n: any) => typeof n.id === 'string' && n.id.startsWith('chat-') && !n.is_read)
        .map((n: any) => n.id);

      if (chatNotificationIds.length > 0) {
        console.log('ChatNotificationMiddleware: Marking chat notifications as read:', chatNotificationIds);
        store.dispatch(markManyAsRead(chatNotificationIds));
      }
    }
  }

  return result;
};