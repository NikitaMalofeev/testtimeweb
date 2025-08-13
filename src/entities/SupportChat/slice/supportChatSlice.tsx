// entities/SupportChat/slice/supportChatSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { askQuestion, getAllQuestions, getGroupWs } from "../api/supportChatApi";
import { RootState } from "app/providers/store/config/store";
import { ChatMessage } from "../model/chatModel";

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
    string,            // вернём строку‑ID
    void,
    { rejectValue: string; state: RootState }
>(
    "supportChat/fetchWebsocketId",
    async (_, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            const { group_ws } = await getGroupWs(token);

            // сохраняем в стор
            dispatch(setWebsocketId(group_ws));

            return group_ws;            // <‑‑ важное изменение!
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
            // --- ГЛАВНОЕ: жёстко закрываем старый сокет ---
            if (chatSocket) {
                chatSocket.close();
                chatSocket = null;
            }

            // --- Открываем новый ---
            chatSocket = new WebSocket(`wss://test.webbroker.ranks.pro/ws/chat_support/${websocketId}/`);

            chatSocket.onopen = () => {
                // console.log("WebSocket opened:", websocketId);
            };

            chatSocket.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data);
                    if (data.type === "message_to_support_chat") {
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
            // здесь мы ничего не возвращаем, просто закрыли сокет
        } catch (e: any) {
            return rejectWithValue("Ошибка при закрытии WebSocket");
        }
    }
);

export const postMessage = createAsyncThunk<
    ChatMessage,
    ChatMessage,
    { rejectValue: string; state: RootState }
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

export const supportChatSlice = createSlice({
    name: "supportChat",
    initialState,
    reducers: {
        setWebsocketId: (state, action: PayloadAction<string>) => {
            state.websocketId = action.payload;
        },
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            const msg = action.payload;
            state.messages.unshift(msg);
            if (msg.is_answer) {
                state.unreadAnswersCount += 1;
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
            .addCase(closeWebSocketConnection.fulfilled, state => {
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
            .addCase(postMessage.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
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
