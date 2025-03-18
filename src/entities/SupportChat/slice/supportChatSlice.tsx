import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { askQuestion, getAllQuestions, getGroupWs } from "../api/supportChatApi";
import { RootState } from "app/providers/store/config/store";
import { ChatMessage } from "../model/chatModel";

/**
 * Интерфейс состояния слайса supportChat
 */
interface SupportChatState {
    websocketId: string;
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    success: boolean;
    isWsConnected: boolean;
}

/**
 * Начальное состояние
 */
const initialState: SupportChatState = {
    websocketId: "",
    messages: [],
    loading: false,
    error: null,
    success: false,
    isWsConnected: false,
};

/**
 * Пример локальной переменной для хранения открытого WebSocket
 * (Не храните WebSocket в state — это несерилизуемый объект)
 */
let chatSocket: WebSocket | null = null;

/**
 * Thunk для получения websocketId (например, из API)
 */
export const fetchWebsocketId = createAsyncThunk<
    string, // Возвращаемый тип данных при успехе
    void,   // Тип аргумента, который передаётся в thunk
    { rejectValue: string, state: RootState }
>(
    "supportChat/fetchWebsocketId",
    async (_, { rejectWithValue, getState, dispatch }) => {
        try {
            const token = getState().user.token;
            // Предположим, getGroupWs возвращает { websocketId: string }
            const response = await getGroupWs(token);
            const { group_ws } = response
            dispatch(setWebsocketId(group_ws))
            return response.websocketId;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения websocket ID"
            );
        }
    }
);

export const getAllMessagesThunk = createAsyncThunk<
    string, // Возвращаемый тип данных при успехе
    void,   // Тип аргумента, который передаётся в thunk
    { rejectValue: string, state: RootState }
>(
    "supportChat/getAllMessagesThunk",
    async (_, { rejectWithValue, getState, dispatch }) => {
        try {
            const token = getState().user.token;
            // Предположим, getGroupWs возвращает { websocketId: string }
            const response = await getAllQuestions(token);
            const { group_ws } = response
            dispatch(setMessages(response))
            return response.websocketId;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения websocket ID"
            );
        }
    }
);

/**
 * Thunk для открытия WebSocket-соединения.
 * При получении новых сообщений — диспатчим addMessage, чтобы обновить Redux-хранилище.
 */
export const openWebSocketConnection = createAsyncThunk<
    void,            // Возвращаем ничего, т.к. сама логика внутри
    string,          // Параметр — websocketId
    { rejectValue: string, state: RootState }
>(
    "supportChat/openWebSocketConnection",
    async (websocketId, { dispatch, rejectWithValue, getState }) => {
        try {
            // Открываем WebSocket
            if (!chatSocket) {
                chatSocket = new WebSocket(`wss://test.webbroker.ranks.pro/ws/chat_support/${websocketId}/`);
                console.log('открытие вебсокета 2')
                // Сразу после открытия
                chatSocket.onopen = () => {
                    console.log("WebSocket connection established");
                };

                // Когда прилетает новое сообщение — добавляем его в общий список
                chatSocket.onmessage = (event) => {
                    try {
                        const parsedData = JSON.parse(event.data);

                        // Вы можете дополнительно проверить поле 'type'
                        if (parsedData.type === "message_to_support_chat") {
                            // Вытаскиваем само сообщение
                            dispatch(addMessage(parsedData.data));
                        } else {
                            console.log("Неизвестный тип WebSocket-сообщения:", parsedData.type);
                        }
                    } catch (e) {
                        console.error("Ошибка парсинга сообщения из WebSocket:", e);
                    }
                };


                // Когда соединение закрывается
                chatSocket.onclose = () => {
                    console.log("WebSocket closed");
                };

                chatSocket.onerror = (error) => {
                    console.error("WebSocket error", error);
                };

            }

        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка открытия WebSocket-соединения"
            );
        }
    }
);

/**
 * Thunk для отправки сообщения (POST на сервер через REST).
 * Сам WebSocket в данном примере только «слушает» новые входящие сообщения от поддержки.
 */
export const postMessage = createAsyncThunk<
    ChatMessage,
    ChatMessage,
    { rejectValue: string, state: RootState }
>(
    "supportChat/postMessage",
    async (messageData, { rejectWithValue, getState }) => {
        const token = getState().user.token;
        try {
            const response = await askQuestion(messageData, token);
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка отправки сообщения"
            );
        }
    }
);

/**
 * Создаём слайс supportChat
 */
export const supportChatSlice = createSlice({
    name: "supportChat",
    initialState,
    reducers: {
        // Редьюсер для ручной установки websocketId, если нужно
        setWebsocketId: (state, action: PayloadAction<string>) => {
            state.websocketId = action.payload;
        },
        // Редьюсер для установки массива сообщений
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload;
        },
        // Редьюсер для добавления нового сообщения в массив
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.messages.push(action.payload);
        },
        // Закрыть соединение (по желанию)
        closeWebSocketConnection: (state) => {
            if (chatSocket) {
                chatSocket.close();
                chatSocket = null;
            }
            state.isWsConnected = false;
        },
    },
    extraReducers: (builder) => {
        builder
            /**
             * Обработка fetchWebsocketId
             */
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

            /**
             * Обработка openWebSocketConnection
             */
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

            /**
             * Обработка postMessage
             */
            .addCase(postMessage.pending, (state) => {
                // state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(postMessage.fulfilled, (state, action) => {
                // state.loading = false;
                state.success = true;
                // Добавляем своё же отправленное сообщение в список
                // state.messages.push(action.payload);
            })
            .addCase(postMessage.rejected, (state, action) => {
                // state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getAllMessagesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getAllMessagesThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Добавляем своё же отправленное сообщение в список
                // state.messages.push(action.payload);
            })
            .addCase(getAllMessagesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

/**
 * Экспортируем экшены и редьюсер
 */
export const {
    setWebsocketId,
    setMessages,
    addMessage,
    closeWebSocketConnection,
} = supportChatSlice.actions;

export default supportChatSlice.reducer;
