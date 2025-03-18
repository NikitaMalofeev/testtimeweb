import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Импортируем нужные хуки и типы
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
import { fetchWebsocketId, getAllMessagesThunk, openWebSocketConnection, postMessage } from "entities/SupportChat/slice/supportChatSlice";
import { Loader } from "shared/ui/Loader/Loader";

export const UserMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <div className={styles.message_user}>
            <span className={styles.message__date}>{new Date(`${message.created}`)
                .toLocaleDateString("ru-RU")}</span>
            <p className={styles.message__message_user}>{message.text}</p>
        </div>
    );
};

/** Компонент сообщения поддержки */
export const SupportMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <div className={styles.message_support}>
            <span className={styles.message__date}>{new Date(`${message.created}`)
                .toLocaleDateString("ru-RU")}</span>
            <p className={styles.message__message_support}>{message.text}</p>
        </div>
    );
};

export const SupportChat = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Берём из Redux
    const { websocketId, messages, loading, error } = useSelector(
        (state: RootState) => state.supportChat
    );

    // Локальное состояние для текста, который вводит пользователь
    const [messageText, setMessageText] = useState("");

    // Состояния для отслеживания скролла
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBottom, setIsBottom] = useState(true);

    // Реф для контейнера с сообщениями
    const chatContainerRef = useRef<HTMLDivElement>(null);

    /**
     * При монтировании — получаем websocketId и историю сообщений
     */
    useEffect(() => {
        dispatch(fetchWebsocketId());
        dispatch(getAllMessagesThunk());
    }, []);

    /**
     * Как только websocketId появится, открываем WebSocket
     */
    useEffect(() => {
        if (websocketId) {
            dispatch(openWebSocketConnection(websocketId));
        }
    }, [websocketId]);

    /**
     * Обработчик скролла для контейнера с сообщениями.
     * Выставляет тень для header, если скролл начался,
     * и для инпута, если скролл не дошёл до конца.
     */
    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setIsScrolled(scrollTop > 0);
            setIsBottom(scrollTop + clientHeight >= scrollHeight - 10);
        }
    };

    /**
     * Автопрокрутка контейнера с сообщениями в самый низ при обновлении сообщений.
     */
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    /**
     * Отправка сообщения пользователем
     */
    const handleSendMessage = () => {
        if (!messageText.trim()) return;

        // Формируем объект сообщения
        const newMessage: ChatMessage = {
            text: messageText,
            // Дополнительные поля можно добавить при необходимости
        };

        // Отправляем на сервер через наш thunk
        dispatch(postMessage(newMessage));

        // Очищаем инпут
        setMessageText("");
    };

    // Обработчик изменения инпута
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setMessageText(e.target.value);
    };

    if (loading) {
        return <Loader />;
    } else {
        return (
            <div className={styles.chat}>
                {/* Добавляем тень к header, если скролл начался */}
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
                                Вы общаетесь с Дмитрием из службы поддержки RANKS autopilot, пожалуйста, опишите вашу проблему
                            </span>
                        </div>
                    )}
                </div>

                {/* Контейнер для сообщений с привязанным рефом и обработчиком скролла */}
                <div
                    className={`${styles.chat__chat__container} ${isScrolled ? styles.shadow_top : ""}`}
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                >
                    <div style={{ padding: "13px 24px 0" }}>
                        <div className={styles.chat__chat}>
                            {messages.slice().reverse().map((msg, index) =>
                                !msg.is_answer ? (
                                    <UserMessage key={index} message={msg} />
                                ) : (
                                    <SupportMessage key={index} message={msg} />
                                )
                            )}
                        </div>
                    </div>

                    {/* Добавляем тень к инпуту, если скролл не достиг низа */}
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
                            withoutCloudyLabel={true}
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
            </div>
        );
    }
};
