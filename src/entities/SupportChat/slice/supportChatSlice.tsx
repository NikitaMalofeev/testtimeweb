import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { askQuestion, getAllQuestions, getGroupWs } from "../api/supportChatApi";
import { ChatMessage } from "../model/chatModel";
// Импортируем API-функции для работы с чатом



// Интерфейс состояния слайса supportChat
interface SupportChatState {
    websocketId: string;
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    success: boolean;
}

// Начальное состояние
const initialState: SupportChatState = {
    websocketId: "",
    messages: [],
    loading: false,
    error: null,
    success: false,
};

// Thunk для получения websocketId через API (getGroupWs)
export const fetchWebsocketId = createAsyncThunk<
    string,
    void,
    { rejectValue: string }
>(
    "supportChat/fetchWebsocketId",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await getGroupWs();
            dispatch(setWebsocketId(response))
            // Предполагается, что API возвращает объект с полем websocketId
            return response.websocketId;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения websocket ID"
            );
        }
    }
);

// Thunk для отправки сообщения (postMessage)
export const postMessage = createAsyncThunk<
    ChatMessage,
    ChatMessage,
    { rejectValue: string }
>(
    "supportChat/postMessage",
    async (messageData, { rejectWithValue }) => {
        try {
            const response = await askQuestion(messageData);
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка отправки сообщения"
            );
        }
    }
);

// Thunk для получения всех сообщений (getAllMessages)
export const getAllMessages = createAsyncThunk<
    ChatMessage[],
    void,
    { rejectValue: string }
>(
    "supportChat/getAllMessages",
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAllQuestions();
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения сообщений"
            );
        }
    }
);

// Создаем слайс supportChat
export const supportChatSlice = createSlice({
    name: "supportChat",
    initialState,
    reducers: {
        // Редьюсер для ручной установки websocketId, если потребуется
        setWebsocketId: (state, action: PayloadAction<string>) => {
            state.websocketId = action.payload;
        },
        // Редьюсер для установки массива сообщений
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Обработка fetchWebsocketId
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
            // Обработка postMessage
            .addCase(postMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(postMessage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Добавляем новое сообщение в список
                state.messages.push(action.payload);
            })
            .addCase(postMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Обработка getAllMessages
            .addCase(getAllMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getAllMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.messages = action.payload;
            })
            .addCase(getAllMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Экспортируем действия и редьюсер
export const { setWebsocketId, setMessages } = supportChatSlice.actions;
export default supportChatSlice.reducer;
