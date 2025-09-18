// entities/SupportChat/slice/supportChatSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getAllQuestions, getGroupWs, getWebSocketUrl, getChatSettings } from "../api/supportChatApi";
import { RootState } from "app/providers/store/config/store";
import { ChatMessage } from "../model/chatModel";
import axios from "axios";
import apiUrl from "../api/supportChatApi"; // default export = base API url
import { setError } from "entities/Error/slice/errorSlice";

interface ChatSettings {
    min_length_text: number;
    min_length_text_for_files: number;
    max_count_file: number;
    max_size_file_mb: number;
    file_allowed_content_types: string[];
}

interface SupportChatState {
    websocketId: string;
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    success: boolean;
    isWsConnected: boolean;
    unreadAnswersCount: number;
    chatSettings: ChatSettings | null;
}

const initialState: SupportChatState = {
    websocketId: "",
    messages: [],
    loading: false,
    error: null,
    success: false,
    isWsConnected: false,
    unreadAnswersCount: 0,
    chatSettings: null,
};

// --------------------------------------------------
// ВСЕГДА один сокет на приложение
let chatSocket: WebSocket | null = null;
// Cache for optimistic blob URLs
const optimisticBlobCache = new Map<string, string>();
// --------------------------------------------------

export const fetchWebsocketId = createAsyncThunk<
    string,
    void,
    { rejectValue: string; state: RootState }
>("supportChat/fetchWebsocketId", async (_, { getState, rejectWithValue, dispatch }) => {
    try {
        const token = getState().user.token;
        console.log("Fetching websocketId with token:", token ? "present" : "missing");

        const response = await getGroupWs(token);
        console.log("getGroupWs response:", response);

        const { group_ws } = response;
        console.log("Received websocketId:", group_ws);

        dispatch(setWebsocketId(group_ws));
        return group_ws;
    } catch (e: any) {
        console.error("Error fetching websocketId:", e);
        return rejectWithValue(e.response?.data?.message ?? "Не смогли получить websocketId");
    }
});

export const openWebSocketConnection = createAsyncThunk<
    void,
    string,
    { rejectValue: string; state: RootState }
>("supportChat/openWebSocketConnection", async (websocketId, { dispatch, rejectWithValue, getState }) => {
    try {
        // Закрываем старый сокет
        if (chatSocket) {
            console.log("Closing existing WebSocket connection");
            chatSocket.close();
            chatSocket = null;
        }

        if (!websocketId || websocketId.trim() === '') {
            console.error("Invalid websocketId:", websocketId);
            return rejectWithValue("Неверный websocketId");
        }

        const baseWsUrl = getWebSocketUrl();
        const wsUrl = `${baseWsUrl}chat_support/${websocketId}/`;
        console.log("Attempting to connect WebSocket to:", wsUrl);

        return new Promise((resolve, reject) => {
            chatSocket = new WebSocket(wsUrl);

            // Таймаут для подключения
            const connectionTimeout = setTimeout(() => {
                console.error("WebSocket connection timeout");
                if (chatSocket) {
                    chatSocket.close();
                    chatSocket = null;
                }
                reject("Таймаут подключения WebSocket");
            }, 10000); // 10 секунд

            chatSocket.onopen = () => {
                console.log("WebSocket opened successfully:", websocketId);
                clearTimeout(connectionTimeout);
                resolve();
            };

            chatSocket.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);

                if (data?.type === "message_to_support_chat") {
                    const msg: ChatMessage & { id?: number; is_edit?: boolean } = data.data;

                    // Проверяем что сообщение валидно
                    if (!msg || typeof msg !== 'object') {
                        console.warn("Invalid message received from WS:", msg);
                        return;
                    }

                    // В ЧАТ ИЗ WS БЕРЕМ:
                    // 1. СЕРВЕРНЫЕ СООБЩЕНИЯ (ответы поддержки)
                    // 2. РЕДАКТИРОВАНИЯ сообщений
                    // 3. ПОЛЬЗОВАТЕЛЬСКИЕ сообщения (но только если нет optimistic дубля)
                    if (msg?.is_answer || msg?.is_edit) {
                        // Ответы поддержки и редактирования всегда принимаем
                        console.log("WS: Received support message or edit:", msg?.id, msg.is_answer ? "answer" : "edit");
                        dispatch(addMessage(msg));
                    } else if (msg?.id != null) {
                        // Пользовательское сообщение с ID - проверяем нет ли уже optimistic
                        const state = getState();
                        const hasOptimistic = state.supportChat.messages.some(
                            (m: ChatMessage) => !m.is_answer && (m as any).optimistic === true
                        );

                        if (hasOptimistic) {
                            // Есть optimistic - пытаемся его заменить
                            console.log("WS: Merging with optimistic message:", msg?.id);
                            dispatch(addMessage(msg));
                        } else {
                            // Нет optimistic - проверяем нет ли уже такого ID
                            const hasExisting = state.supportChat.messages.some((m: ChatMessage) => (m as any).id === msg.id);
                            if (!hasExisting) {
                                console.log("WS: Adding new user message:", msg?.id);
                                dispatch(addMessage(msg));
                            } else {
                                console.log("WS: Message already exists, skipping:", msg?.id);
                            }
                        }
                    } else {
                        console.log("WS: Ignoring message without ID or criteria:", msg);
                    }
                }
            } catch (e) {
                console.error("WS parse error:", e);
            }
        };

            chatSocket.onclose = (event) => {
                console.log("WebSocket closed:", {
                    websocketId,
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });
                clearTimeout(connectionTimeout);

                // Переподключение если соединение закрылось неожиданно (не код 1000)
                if (event.code !== 1000 && websocketId) {
                    console.log("WebSocket closed unexpectedly, attempting reconnection in 5 seconds...");
                    setTimeout(() => {
                        if (!chatSocket || chatSocket.readyState === WebSocket.CLOSED) {
                            console.log("Attempting to reconnect WebSocket...");
                            dispatch(openWebSocketConnection(websocketId));
                        }
                    }, 5000);
                }
            };

            chatSocket.onerror = (err) => {
                console.error("WebSocket error details:", {
                    websocketId,
                    error: err,
                    readyState: chatSocket?.readyState,
                    url: chatSocket?.url
                });
                clearTimeout(connectionTimeout);
                reject("Ошибка подключения WebSocket");
            };
        });
    } catch (error) {
        console.error("Exception in openWebSocketConnection:", error);
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

export const fetchChatSettings = createAsyncThunk<
    ChatSettings,
    void,
    { rejectValue: string; state: RootState }
>("supportChat/fetchChatSettings", async (_, { rejectWithValue, getState }) => {
    try {
        const token = getState().user.token;
        const response = await getChatSettings(token);
        return response;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "Ошибка получения настроек чата");
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
                const existingIndex = state.messages.findIndex((m) => (m as any).id === msgId);
                if (existingIndex !== -1) {
                    // Обновляем существующее сообщение, сохраняя важные поля
                    const existing = state.messages[existingIndex];
                    const merged = { ...existing, ...msg };

                    // Сохраняем blob URL если они есть
                    if ((existing as any).file_url &&
                        Array.isArray((existing as any).file_url) &&
                        (existing as any).file_url.some((url: string) => url.startsWith('blob:'))) {
                        merged.file_url = (existing as any).file_url;
                    }

                    state.messages[existingIndex] = merged;
                } else {
                    // Добавляем новое сообщение
                    console.log("Adding new message with ID:", msgId, msg);
                    state.messages.unshift(msg);
                    if (msg.is_answer) state.unreadAnswersCount += 1;
                }
                return;
            }

            // Fallback-антидубль (для старого формата без ID)
            const exists = state.messages.some(
                (existingMsg) =>
                    existingMsg.text === msg.text &&
                    existingMsg.created === msg.created &&
                    existingMsg.is_answer === msg.is_answer &&
                    existingMsg.user_id === msg.user_id
            );

            if (!exists) {
                console.log("Adding message via fallback (no ID):", msg);
                state.messages.unshift(msg);
                if (msg.is_answer) state.unreadAnswersCount += 1;
            } else {
                console.log("Message already exists (fallback check):", msg);
            }
        },

        setUnreadAnswersCount: (state, action: PayloadAction<number>) => {
            state.unreadAnswersCount = action.payload;
        },

        setChatSettings: (state, action: PayloadAction<ChatSettings>) => {
            state.chatSettings = action.payload;
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
                // Вместо сохранения File объектов, сохраняем только метаданные
                optimisticFilesCount: files?.length || 0,
            };

            // Создаем blob URL для всех файлов
            if (files && files.length > 0) {
                try {
                    const blobUrls = files.map(file => URL.createObjectURL(file));
                    optimistic.file_url = blobUrls;

                    // Сохраняем File объекты во внешнем Map-кеше вместо Redux state
                    const optimisticId = Date.now().toString();
                    optimistic.optimisticId = optimisticId;
                    optimisticBlobCache.clear(); // очищаем предыдущий кеш
                    files.forEach((file, index) => {
                        optimisticBlobCache.set(`${optimisticId}-${index}` as any, blobUrls[index]);
                    });
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
            })
            .addCase(fetchChatSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChatSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.chatSettings = action.payload;
            })
            .addCase(fetchChatSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setWebsocketId, setMessages, addMessage, setUnreadAnswersCount, addOptimisticMessage, setChatSettings } =
    supportChatSlice.actions;

export default supportChatSlice.reducer;
