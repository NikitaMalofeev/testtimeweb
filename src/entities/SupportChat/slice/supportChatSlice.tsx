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
>(
    "supportChat/fetchWebsocketId",
    async (_, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            const { group_ws } = await getGroupWs(token);
            dispatch(setWebsocketId(group_ws));
            return group_ws;
        } catch (e: any) {
            return rejectWithValue(e.response?.data?.message ?? "Не смогли получить websocketId");
        }
    }
);

export const openWebSocketConnection = createAsyncThunk<
    void,
    string,
    { rejectValue: string; state: RootState }
>(
    "supportChat/openWebSocketConnection",
    async (websocketId, { dispatch, rejectWithValue }) => {
        try {
            // Жёстко закрываем старый сокет
            if (chatSocket) {
                chatSocket.close();
                chatSocket = null;
            }

            // Открываем новый
            chatSocket = new WebSocket(`wss://test.webbroker.ranks.pro/ws/chat_support/${websocketId}/`);

            chatSocket.onopen = () => {
                // console.log("WebSocket opened:", websocketId);
            };

            chatSocket.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    if (data.type === "message_to_support_chat") {
                        // универсально: и новые, и отредактированные пойдут одной ручкой
                        dispatch(addMessage(data.data));
                    } else {
                        // console.log("Неизвестный тип:", data.type);
                    }
                } catch (e) {
                    console.error("Ошибка парсинга:", e);
                }
            };

            chatSocket.onclose = () => {
                // console.log("WebSocket closed:", websocketId);
            };

            chatSocket.onerror = (err) => {
                console.error("WebSocket error:", err);
            };
        } catch (e: any) {
            return rejectWithValue("Ошибка при открытии WebSocket");
        }
    }
);

export const getAllMessagesThunk = createAsyncThunk<
    ChatMessage[],
    void,
    { rejectValue: string; state: RootState }
>(
    "supportChat/getAllMessagesThunk",
    async (_, { rejectWithValue, getState, dispatch }) => {
        try {
            const token = getState().user.token;
            const response = await getAllQuestions(token);
            dispatch(setMessages(response));
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения сообщений"
            );
        }
    }
);

export const closeWebSocketConnection = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "supportChat/closeWebSocketConnection",
    async (_, { rejectWithValue }) => {
        try {
            if (chatSocket) {
                chatSocket.close();
                chatSocket = null;
            }
        } catch (e: any) {
            return rejectWithValue("Ошибка при закрытии WebSocket");
        }
    }
);

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
>(
    "supportChat/postMessage",
    async (payload, { rejectWithValue, getState, dispatch }) => {
        const token = getState().user.token;
        try {
            const form = new FormData();
            console.log('=== SLICE THUNK STARTED ===');
            console.log('payload received:', payload);
            
            // Если есть файлы - отправляем И text И text_for_files, иначе только text
            if (payload.files && payload.files.length) {
                console.log('Has files - adding both text and text_for_files');
                const messageText = payload.text_for_files || "";
                form.append("text", messageText);
                form.append("text_for_files", messageText);
                payload.files.forEach((f) => form.append("files", f));
            } else if (payload.text) {
                console.log('No files - adding only text:', payload.text);
                form.append("text", payload.text);
            }

            // Логируем содержимое FormData
            console.log('FormData contents:');
            for (let [key, value] of form.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await axios.post(
                `${apiUrl}user_lk/ask_question/`,
                form,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                        // ВАЖНО: не ставим Content-Type, пусть браузер сам проставит multipart boundary
                        "Accept-Language": "ru",
                    },
                }
            );

            return response.data as ChatMessage;
        } catch (error: any) {
            let errorMessage = "Ошибка отправки сообщения";

            const data = error.response?.data;
            if (data) {
                // Проверяем ошибки в массивах text и text_for_files
                if (data.text && Array.isArray(data.text) && data.text.length > 0) {
                    errorMessage = data.text[0];
                } else if (data.text_for_files && Array.isArray(data.text_for_files) && data.text_for_files.length > 0) {
                    errorMessage = data.text_for_files[0];
                } else if (data.message) {
                    errorMessage = data.message;
                }
                
                console.log('Error from server:', data);
                console.log('Final error message:', errorMessage);
                dispatch(setError(errorMessage));
            }

            return rejectWithValue(errorMessage);
        }

    }
);

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

        // универсальный upsert: если пришёл is_edit === true -> обновляем по id; иначе добавляем (с антидублем)
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            const msg = action.payload;
            const msgId = (msg as any).id as number | undefined;

            // is_edit работает ТОЛЬКО для сообщений от поддержки (is_answer: true)
            if (msg.is_edit && msg.is_answer && msgId != null) {
                const idx = state.messages.findIndex((m) => (m as any).id === msgId);
                if (idx !== -1) {
                    // Заменяем сообщение от поддержки полностью
                    state.messages[idx] = {
                        ...state.messages[idx],
                        ...msg,
                        is_edit: true
                    };
                } else {
                    // Если вдруг не нашли по ID - добавляем как новое (редкий случай)
                    state.messages.unshift(msg);
                    // НЕ увеличиваем unreadAnswersCount для отредактированных сообщений
                }
                return;
            }

            // Если у сообщения есть id — проверяем двойник по id
            if (msgId != null) {
                const existsById = state.messages.some((m) => (m as any).id === msgId);
                if (existsById) {
                    // Обновим (на случай если пришла новая версия без is_edit)
                    state.messages = state.messages.map((m) =>
                        (m as any).id === msgId ? { ...m, ...msg } : m
                    );
                } else {
                    state.messages.unshift(msg);
                    if (msg.is_answer) {
                        state.unreadAnswersCount += 1;
                    }
                }
                return;
            }

            // Fallback-антидубль для старого формата без id
            const exists =
                state.messages.some(
                    (existingMsg) =>
                        existingMsg.text === msg.text &&
                        existingMsg.created === msg.created &&
                        existingMsg.is_answer === msg.is_answer
                );

            if (!exists) {
                state.messages.unshift(msg);
                if (msg.is_answer) {
                    state.unreadAnswersCount += 1;
                }
            }
        },

        setUnreadAnswersCount: (state, action: PayloadAction<number>) => {
            state.unreadAnswersCount = action.payload;
        },

        // Optimistic update - добавляем сообщение пользователя сразу
        addOptimisticMessage: (state, action: PayloadAction<{ text: string; files?: File[] }>) => {
            const { text, files } = action.payload;
            const optimisticMessage: ChatMessage = {
                text: text,
                created: new Date().toISOString(),
                is_answer: false,
                user_id: 0, // временный ID
                file_url: files && files.length > 0 ? URL.createObjectURL(files[0]) : null,
            };
            
            state.messages.unshift(optimisticMessage);
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
                // Заменяем optimistic сообщение на настоящее от сервера
                if (action.payload) {
                    // Ищем optimistic сообщение (последнее сообщение пользователя)
                    const optimisticIndex = state.messages.findIndex(
                        (msg) => !msg.is_answer && msg.user_id === 0
                    );
                    
                    if (optimisticIndex !== -1) {
                        // Заменяем optimistic сообщение на настоящее
                        state.messages[optimisticIndex] = action.payload;
                    } else {
                        // Если не нашли optimistic - добавляем как новое
                        state.messages.unshift(action.payload);
                    }
                }
            })
            .addCase(postMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
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
