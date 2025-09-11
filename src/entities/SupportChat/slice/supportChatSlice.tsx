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
            if (payload.text) form.append("text", payload.text);
            if (payload.files && payload.files.length) {
                payload.files.forEach((f) => form.append("files", f));
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
                if (payload.files && payload.files.length > 0) {
                    errorMessage = data.text_for_files?.[0] || data.message || errorMessage;
                    dispatch(setError(errorMessage));
                } else {
                    errorMessage = data.text?.[0] || data.message || errorMessage;
                    dispatch(setError(errorMessage));
                }
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
                // Добавляем отправленное сообщение в чат
                if (action.payload) {
                    state.messages.unshift(action.payload);
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

export const { setWebsocketId, setMessages, addMessage, setUnreadAnswersCount } =
    supportChatSlice.actions;

export default supportChatSlice.reducer;
