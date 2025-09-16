// entities/SupportChat/slice/supportChatSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getAllQuestions, getGroupWs } from "../api/supportChatApi";
import { RootState } from "app/providers/store/config/store";
import { ChatMessage } from "../model/chatModel";
import axios from "axios";
import apiUrl from "../api/supportChatApi"; // default export = base API url
import { setError } from "entities/Error/slice/errorSlice";

interface SupportChatState {
    websocketId: string;
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    success: boolean;
    isWsConnected: boolean;
    unreadAnswersCount: number;
}

const initialState: SupportChatState = {
    websocketId: "",
    messages: [],
    loading: false,
    error: null,
    success: false,
    isWsConnected: false,
    unreadAnswersCount: 0,
};

// --------------------------------------------------
// ВСЕГДА один сокет на приложение
let chatSocket: WebSocket | null = null;
// --------------------------------------------------

export const fetchWebsocketId = createAsyncThunk<
    string,
    void,
    { rejectValue: string; state: RootState }
>("supportChat/fetchWebsocketId", async (_, { getState, rejectWithValue, dispatch }) => {
    try {
        const token = getState().user.token;
        const { group_ws } = await getGroupWs(token);
        dispatch(setWebsocketId(group_ws));
        return group_ws;
    } catch (e: any) {
        return rejectWithValue(e.response?.data?.message ?? "Не смогли получить websocketId");
    }
});

export const openWebSocketConnection = createAsyncThunk<
    void,
    string,
    { rejectValue: string; state: RootState }
>("supportChat/openWebSocketConnection", async (websocketId, { dispatch, rejectWithValue }) => {
    try {
        // Закрываем старый сокет
        if (chatSocket) {
            chatSocket.close();
            chatSocket = null;
        }

        chatSocket = new WebSocket(`wss://test.webbroker.ranks.pro/ws/chat_support/${websocketId}/`);

        chatSocket.onopen = () => {
            // console.log("WebSocket opened:", websocketId);
        };

        chatSocket.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);

                if (data?.type === "message_to_support_chat") {
                    const msg: ChatMessage & { id?: number; is_edit?: boolean } = data.data;

                    // В ЧАТ ИЗ WS БЕРЕМ ТОЛЬКО СЕРВЕРНЫЕ СООБЩЕНИЯ (ответы поддержки) И/ИЛИ РЕДАКТИРОВАНИЯ
                    // Пользовательские эхо-сообщения игнорируем, чтобы не было дублей и мерцания.
                    if (msg?.is_answer || msg?.is_edit) {
                        dispatch(addMessage(msg));
                    } else {
                        // Игнор: это, скорее всего, "эхо" нашего же сообщения
                    }
                }
            } catch (e) {
                console.error("WS parse error:", e);
            }
        };

        chatSocket.onclose = () => {
            // console.log("WebSocket closed:", websocketId);
        };

        chatSocket.onerror = (err) => {
            console.error("WebSocket error:", err);
        };
    } catch {
        return rejectWithValue("Ошибка при открытии WebSocket");
    }
});

export const getAllMessagesThunk = createAsyncThunk<
    ChatMessage[],
    void,
    { rejectValue: string; state: RootState }
>("supportChat/getAllMessagesThunk", async (_, { rejectWithValue, getState, dispatch }) => {
    try {
        const token = getState().user.token;
        const response = await getAllQuestions(token);
        dispatch(setMessages(response));
        return response;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Ошибка получения сообщений");
    }
});

export const closeWebSocketConnection = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>("supportChat/closeWebSocketConnection", async (_, { rejectWithValue }) => {
    try {
        if (chatSocket) {
            chatSocket.close();
            chatSocket = null;
        }
    } catch {
        return rejectWithValue("Ошибка при закрытии WebSocket");
    }
});

// ---- отправка сообщения с поддержкой файлов (multipart) ----
export type PostMessagePayload = {
    text?: string;
    text_for_files?: string;
    files?: File[];
};

export const postMessage = createAsyncThunk<
    ChatMessage,
    PostMessagePayload,
    { rejectValue: string; state: RootState }
>("supportChat/postMessage", async (payload, { rejectWithValue, getState, dispatch }) => {
    const token = getState().user.token;

    try {
        const form = new FormData();

        if (payload.files && payload.files.length) {
            if (payload.text) {
                form.append("text", payload.text);
            }
            if (payload.text_for_files) {
                form.append("text_for_files", payload.text_for_files);
            }
            payload.files.forEach((f) => form.append("files", f));
        } else if (payload.text) {
            form.append("text", payload.text);
        }

        const response = await axios.post(`${apiUrl}user_lk/ask_question/`, form, {
            headers: {
                Authorization: `Token ${token}`,
                "Accept-Language": "ru",
            },
        });

        return response.data as ChatMessage;
    } catch (error: any) {
        let errorMessage = "Ошибка отправки сообщения";
        const data = error.response?.data;

        if (data) {
            if (data.text && Array.isArray(data.text) && data.text.length > 0) {
                errorMessage = data.text[0];
            } else if (data.text_for_files && Array.isArray(data.text_for_files) && data.text_for_files.length > 0) {
                errorMessage = data.text_for_files[0];
            } else if (data.message) {
                errorMessage = data.message;
            }
            dispatch(setError(errorMessage));
        }

        return rejectWithValue(errorMessage);
    }
});

export const supportChatSlice = createSlice({
    name: "supportChat",
    initialState,
    reducers: {
        setWebsocketId: (state, action: PayloadAction<string>) => {
            state.websocketId = action.payload;
        },
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload ?? [];
        },

        // Универсальный upsert + анти-дубль
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            const msg = action.payload as ChatMessage & { id?: number; is_edit?: boolean };
            const msgId = (msg as any).id as number | undefined;

            // Редактирование (для ответов поддержки)
            if (msg.is_edit && msg.is_answer && msgId != null) {
                const idx = state.messages.findIndex((m) => (m as any).id === msgId);
                if (idx !== -1) {
                    state.messages[idx] = { ...state.messages[idx], ...msg, is_edit: true };
                } else {
                    state.messages.unshift(msg);
                    // редактирование не должно увеличивать unreadAnswersCount
                }
                return;
            }

            // --- ВАЖНО: если прилетело пользовательское сообщение из WS (на всякий случай) ---
            // Пытаемся замерджить его в оптимистичное, чтобы не мигало и не перезагружались картинки.
            if (msgId != null && !msg.is_answer) {
                const optIndex = state.messages.findIndex((m) => !m.is_answer && (m as any).optimistic === true);
                if (optIndex !== -1) {
                    const optMsg = state.messages[optIndex] as any;

                    // Если еще не получали ответ от сервера, заменяем optimistic сообщение
                    if (!optMsg.serverResponseReceived) {
                        const merged = { ...optMsg, ...msg };
                        // Сохраняем локальный blob URL, чтобы картинка не перезагружалась
                        if (optMsg.file_url && Array.isArray(optMsg.file_url)) {
                            merged.file_url = optMsg.file_url;
                        }
                        // убираем флаг optimistic и отмечаем получение ответа
                        merged.optimistic = false;
                        merged.serverResponseReceived = true;
                        state.messages[optIndex] = merged;
                        return;
                    } else {
                        // Если уже получали ответ, добавляем как новое сообщение
                        const existsById = state.messages.some((m) => (m as any).id === msgId);
                        if (!existsById) {
                            state.messages.unshift(msg);
                        }
                        return;
                    }
                }
                // если оптимиста нет — ниже обычный upsert по id
            }

            // Обычный upsert по id
            if (msgId != null) {
                const existsById = state.messages.some((m) => (m as any).id === msgId);
                if (existsById) {
                    state.messages = state.messages.map((m) => ((m as any).id === msgId ? { ...m, ...msg } : m));
                } else {
                    state.messages.unshift(msg);
                    if (msg.is_answer) state.unreadAnswersCount += 1;
                }
                return;
            }

            // Fallback-антидубль (для старого формата)
            const exists =
                state.messages.some(
                    (existingMsg) =>
                        existingMsg.text === msg.text &&
                        existingMsg.created === msg.created &&
                        existingMsg.is_answer === msg.is_answer
                );

            if (!exists) {
                state.messages.unshift(msg);
                if (msg.is_answer) state.unreadAnswersCount += 1;
            }
        },

        setUnreadAnswersCount: (state, action: PayloadAction<number>) => {
            state.unreadAnswersCount = action.payload;
        },

        // Optimistic update — добавляем сразу с blob-URL и меткой optimistic
        addOptimisticMessage: (state, action: PayloadAction<{ text: string; fileDescription?: string; files?: File[] }>) => {
            const { text, fileDescription, files } = action.payload;

            // Удаляем все сообщения с ошибками перед добавлением нового
            state.messages = state.messages.filter((m) => !(m as any).error);

            const optimistic: any = {
                text,
                text_for_files: fileDescription,
                created: new Date().toISOString(),
                is_answer: false,
                user_id: 0, // маркер оптимиста
                optimistic: true,
                optimisticFiles: files || [],
            };

            // Создаем blob URL для всех файлов
            if (files && files.length > 0) {
                try {
                    const blobUrls = files.map(file => URL.createObjectURL(file));
                    optimistic.file_url = blobUrls;
                } catch (error) {
                    console.error('Error creating blob URLs:', error);
                }
            }

            state.messages.unshift(optimistic as ChatMessage);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWebsocketId.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(fetchWebsocketId.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.websocketId = action.payload;
            })
            .addCase(fetchWebsocketId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(openWebSocketConnection.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(openWebSocketConnection.fulfilled, (state) => {
                state.loading = false;
                state.isWsConnected = true;
            })
            .addCase(openWebSocketConnection.rejected, (state, action) => {
                state.loading = false;
                state.isWsConnected = false;
                state.error = action.payload as string;
            })
            .addCase(closeWebSocketConnection.fulfilled, (state) => {
                state.isWsConnected = false;
                state.websocketId = "";
            })
            .addCase(closeWebSocketConnection.rejected, (state, action) => {
                state.error = action.payload!;
            })
            .addCase(postMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(postMessage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;

                const newMsg = action.payload as ChatMessage & { id?: number };
                if (!newMsg) return;

                const msgId = (newMsg as any).id;

                // Ищем optimistic сообщение для замены
                const optIndex = state.messages.findIndex((m) => !m.is_answer && (m as any).optimistic === true);

                if (optIndex !== -1) {
                    const opt = state.messages[optIndex] as any;

                    // Если это первое сообщение от сервера, заменяем optimistic
                    if (!opt.serverResponseReceived) {
                        const merged: any = { ...opt, ...newMsg };

                        // Сохраняем blob URL для изображений
                        if (opt.file_url && Array.isArray(opt.file_url)) {
                            merged.file_url = opt.file_url;
                        }

                        // Убираем флаг optimistic и отмечаем что получили ответ
                        merged.optimistic = false;
                        merged.serverResponseReceived = true;

                        state.messages[optIndex] = merged;
                        return;
                    } else {
                        // Если уже получали ответ от сервера, просто добавляем новое сообщение
                        // (это может быть дополнительное сообщение для других файлов)
                        const existingIdx = state.messages.findIndex((m) => (m as any).id === msgId);
                        if (existingIdx === -1) {
                            state.messages.unshift({ ...newMsg, optimistic: false });
                        }
                        return;
                    }
                }

                // Если оптимиста нет, проверяем наличие сообщения по ID
                if (msgId) {
                    const existingIdx = state.messages.findIndex((m) => (m as any).id === msgId);
                    if (existingIdx !== -1) {
                        // Обновляем существующее сообщение
                        const existing = state.messages[existingIdx] as any;
                        const merged: any = { ...existing, ...newMsg };
                        if (existing.file_url && String(existing.file_url).startsWith("blob:")) {
                            merged.file_url = existing.file_url;
                        }
                        merged.optimistic = false;
                        state.messages[existingIdx] = merged;
                        return;
                    }
                }

                // Если ничего не нашли - добавляем как новое сообщение
                state.messages.unshift({ ...newMsg, optimistic: false });
            })
            .addCase(postMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                
                // При ошибке отправки отмечаем optimistic сообщение как ошибку
                const optIndex = state.messages.findIndex((m) => !m.is_answer && (m as any).optimistic === true);
                if (optIndex !== -1) {
                    const optMessage = state.messages[optIndex] as any;
                    // Можно либо удалить, либо отметить как ошибку
                    optMessage.optimistic = false;
                    optMessage.error = true;
                    // Или просто удаляем:
                    // state.messages.splice(optIndex, 1);
                }
            })
            .addCase(getAllMessagesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getAllMessagesThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getAllMessagesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setWebsocketId, setMessages, addMessage, setUnreadAnswersCount, addOptimisticMessage } =
    supportChatSlice.actions;

export default supportChatSlice.reducer;
