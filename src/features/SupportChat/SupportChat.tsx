// SupportChat.tsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "shared/ui/Icon/Icon";
import { Input } from "shared/ui/Input/Input";
import ArrowBack from "shared/assets/svg/ArrowBack.svg";
import ChatImportIcon from "shared/assets/svg/ChatImportIcon.svg";
import ChatSendIcon from "shared/assets/svg/ChatSendIcon.svg";
import styles from "./styles.module.scss";
import { RootState } from "app/providers/store/config/store";
import { ChatMessage } from "entities/SupportChat/model/chatModel";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useSelector } from "react-redux";
import {
    fetchWebsocketId,
    getAllMessagesThunk,
    openWebSocketConnection,
    postMessage,
    resetNewAnswers,
    removeHighlight
} from "entities/SupportChat/slice/supportChatSlice";
import { Loader } from "shared/ui/Loader/Loader";

export const UserMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <div className={styles.message_user}>
            <span className={styles.message__date}>
                {new Date(`${message.created}`).toLocaleDateString("ru-RU")}
            </span>
            <p className={styles.message__message_user}>{message.text}</p>
        </div>
    );
};

interface SupportMessageProps {
    message: ChatMessage;
    highlight?: boolean;
}

export const SupportMessage = ({ message, highlight }: SupportMessageProps) => {
    return (
        <div className={styles.message_support}>
            <span className={styles.message__date}>
                {new Date(`${message.created}`).toLocaleDateString("ru-RU")}
                {highlight && <div className={styles.highlight}></div>}
            </span>
            <p className={styles.message__message_support}>
                {message.text}
            </p>
        </div>
    );
};

export const SupportChat = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { websocketId, messages, loading, highlightedAnswers } = useSelector(
        (state: RootState) => state.supportChat
    );
    const token = useSelector((state: RootState) => state.user.token);

    const [messageText, setMessageText] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBottom, setIsBottom] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const prevHighlightedRef = useRef<string[]>(highlightedAnswers);

    useEffect(() => {
        const oldKeys = prevHighlightedRef.current;
        const newKeys = highlightedAnswers.filter((key) => !oldKeys.includes(key));

        newKeys.forEach((key) => {
            setTimeout(() => {
                dispatch(removeHighlight(key));
            }, 5000);
        });

        prevHighlightedRef.current = highlightedAnswers;
    }, [highlightedAnswers]);

    useEffect(() => {
        dispatch(fetchWebsocketId());
        dispatch(getAllMessagesThunk());
    }, [token]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    useEffect(() => {
        if (websocketId) {
            dispatch(openWebSocketConnection(websocketId));
        }
    }, [websocketId]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setIsScrolled(scrollTop > 0);
            setIsBottom(scrollTop + clientHeight >= scrollHeight - 10);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setMessageText(e.target.value);
    };

    const handleSendMessage = () => {
        if (!messageText.trim()) return;
        const newMessage: ChatMessage = {
            text: messageText,
        };
        dispatch(postMessage(newMessage));
        setMessageText("");
    };

    if (loading && messages.length === 0) {
        return <Loader />;
    }

    return (
        <div className={styles.chat}>
            <div className={styles.chat__header}>
                <div className={styles.chat__header__content}>
                    <Icon
                        Svg={ArrowBack}
                        width={24}
                        height={24}
                        onClick={() => navigate(-1)}
                    />
                    <h2 className={styles.chat__header__title}>Чат поддержки</h2>
                </div>
                <div className={styles.chat__header__status}>онлайн</div>
                {messages.length < 1 && (
                    <div className={styles.chat__header__description}>
                        <span>
                            Вы общаетесь с Дмитрием из службы поддержки RANKS autopilot,
                            пожалуйста, опишите вашу проблему
                        </span>
                    </div>
                )}
            </div>

            <div
                className={`${styles.chat__chat__container} ${isScrolled ? styles.shadow_top : ""
                    }`}
            >
                <div
                    className={styles.chat__wrapper}
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                >
                    <div className={styles.chat__chat}>
                        {messages
                            .slice()
                            .reverse()
                            .map((msg, index) => {
                                const msgKey = `${msg.created}-${msg.user_id}-${index}`;
                                const highlightKey = `${msg.created}-${msg.user_id}`;
                                const isHighlighted = highlightedAnswers.includes(highlightKey);

                                if (!msg.is_answer) {
                                    return (
                                        <UserMessage
                                            key={msgKey}
                                            message={msg}
                                        />
                                    );
                                }
                                return (
                                    <SupportMessage
                                        key={msgKey}
                                        message={msg}
                                        highlight={isHighlighted}
                                    />
                                );
                            })}
                    </div>
                </div>
            </div>

            <div className={`${styles.chat__input} ${!isBottom ? styles.shadow : ""}`}>
                <Icon
                    Svg={ChatImportIcon}
                    width={24}
                    height={24}
                    className={styles.chat__input__icon}
                />
                <Input
                    placeholder="Написать сообщение..."
                    name="message"
                    type="text"
                    value={messageText}
                    onChange={handleChange}
                    onBlur={() => { }}
                    withoutCloudyLabel
                    error={false}
                />
                <Icon
                    className={styles.chat__input__icon}
                    Svg={ChatSendIcon}
                    width={24}
                    height={24}
                    onClick={handleSendMessage}
                />
            </div>
        </div>
    );
};
