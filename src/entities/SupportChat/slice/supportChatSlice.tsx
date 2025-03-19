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
    newAnswersCount: number;      // Количество «новых» сообщений поддержки
    highlightedAnswers: string[]; // «Ключи» новых сообщений для подсветки
}

const initialState: SupportChatState = {
    websocketId: "",
    messages: [],
    loading: false,
    error: null,
    success: false,
    isWsConnected: false,
    newAnswersCount: 0,
    highlightedAnswers: [],
};

let chatSocket: WebSocket | null = null;

export const fetchWebsocketId = createAsyncThunk<
    string,
    void,
    { rejectValue: string; state: RootState }
>(
    "supportChat/fetchWebsocketId",
    async (_, { rejectWithValue, getState, dispatch }) => {
        try {
            const token = getState().user.token;
            const response = await getGroupWs(token);
            const { group_ws } = response;
            dispatch(setWebsocketId(group_ws));
            return response.websocketId;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения websocket ID"
            );
        }
    }
);

export const getAllMessagesThunk = createAsyncThunk<
    string,
    void,
    { rejectValue: string; state: RootState }
>(
    "supportChat/getAllMessagesThunk",
    async (_, { rejectWithValue, getState, dispatch }) => {
        try {
            const token = getState().user.token;
            const response = await getAllQuestions(token);
            const { group_ws } = response;
            dispatch(setMessages(response));
            return response.websocketId;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка получения сообщений"
            );
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
            if (!chatSocket) {
                chatSocket = new WebSocket(
                    `wss://test.webbroker.ranks.pro/ws/chat_support/${websocketId}/`
                );
                chatSocket.onopen = () => {
                    console.log("WebSocket connection established");
                };

                chatSocket.onmessage = (event) => {
                    try {
                        const parsedData = JSON.parse(event.data);
                        if (parsedData.type === "message_to_support_chat") {
                            dispatch(addMessage(parsedData.data));
                        } else {
                            console.log(
                                "Неизвестный тип WebSocket-сообщения:",
                                parsedData.type
                            );
                        }
                    } catch (e) {
                        console.error("Ошибка парсинга сообщения из WebSocket:", e);
                    }
                };

                chatSocket.onclose = () => {
                    console.log("WebSocket closed");
                };

                chatSocket.onerror = (error) => {
                    console.error("WebSocket error", error);
                };
            }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Ошибка открытия WebSocket-соединения"
            );
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
            const newMessages = action.payload;
            state.messages = newMessages;

            const oldCount = Number(localStorage.getItem("answerCount") || 0);
            const currentCount = newMessages.filter((m) => m.is_answer).length;
            const diff = currentCount - oldCount;

            if (diff > 0) {
                // Вытаскиваем последние diff ответов
                const newAnswers = newMessages
                    .filter((m) => m.is_answer)
                    .slice(-diff);

                newAnswers.forEach((m) => {
                    const key = `${m.created}-${m.user_id}`;
                    if (!state.highlightedAnswers.includes(key)) {
                        state.highlightedAnswers.push(key);
                    }
                });

                state.newAnswersCount += diff;
                localStorage.setItem("answerCount", String(currentCount));
            }
        },
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            const msg = action.payload;
            state.messages.unshift(msg);

            if (msg.is_answer) {
                const oldCount = Number(localStorage.getItem("answerCount") || 0);
                localStorage.setItem("answerCount", String(oldCount + 1));
                state.newAnswersCount += 1;
                const key = `${msg.created}-${msg.user_id}`;
                if (!state.highlightedAnswers.includes(key)) {
                    state.highlightedAnswers.push(key);
                }
            }
        },
        closeWebSocketConnection: (state) => {
            if (chatSocket) {
                chatSocket.close();
                chatSocket = null;
            }
            state.isWsConnected = false;
        },
        resetNewAnswers: (state) => {
            state.newAnswersCount = 0;
            state.highlightedAnswers = [];
        },
        removeHighlight: (state, action: PayloadAction<string>) => {
            const index = state.highlightedAnswers.indexOf(action.payload);
            if (index !== -1) {
                state.highlightedAnswers.splice(index, 1);
            }
        },
        // ➜➜➜ Добавляем экшен incrementNewAnswersCount:
        incrementNewAnswersCount: (state, action: PayloadAction<number>) => {
            state.newAnswersCount += action.payload;
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

export const {
    setWebsocketId,
    setMessages,
    addMessage,
    closeWebSocketConnection,
    resetNewAnswers,
    removeHighlight,
    // Экспортируем новый экшен:
    incrementNewAnswersCount
} = supportChatSlice.actions;

export default supportChatSlice.reducer;
