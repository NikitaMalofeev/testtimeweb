import React, { useEffect, useState } from "react";
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

/** Компонент пользовательского сообщения */
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

    /**
     * При монтировании — получаем websocketId
     */
    useEffect(() => {
        dispatch(fetchWebsocketId());
        dispatch(getAllMessagesThunk())
    }, []);

    /**
     * Как только websocketId появится, открываем WebSocket
     */
    useEffect(() => {
        console.log('открытие вебсокета 0')
        if (websocketId) {
            console.log('открытие вебсокета 1')
            dispatch(openWebSocketConnection(websocketId));
        }
    }, [websocketId]);

    /**
     * Отправка сообщения пользователем
     */
    const handleSendMessage = () => {
        if (!messageText.trim()) return;

        // Формируем объект сообщения
        const newMessage: ChatMessage = {
            // В реальном проекте пригодятся поля id, sender, createdAt и т.д.
            text: messageText,
            // примитивная дата для примера
        };

        // Отправляем на сервер через наш thunk
        dispatch(postMessage(newMessage));

        // По желанию можно очистить инпут
        setMessageText("");
    };

    // Обработчик изменения инпута
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setMessageText(e.target.value);
    };

    if (loading) {
        return (
            <Loader />
        )
    } else {
        return (
            <div className={styles.chat}>
                <div className={styles.chat__header}>
                    <div className={styles.chat__header__content}>
                        <Icon Svg={ArrowBack} width={24} height={24} onClick={() => navigate(-1)} />
                        <h2 className={styles.chat__header__title}>Чат поддержки</h2>
                    </div>
                    <div className={styles.chat__header__status}>онлайн</div>
                    <div className={styles.chat__header__description}>
                        <span>
                            Вы общаетесь с Дмитрием из службы поддержки RANKS autopilot, пожалуйста, опишите вашу проблему
                        </span>
                    </div>
                </div>

                <div className={styles.chat__chat__container}>
                    <div className={styles.chat__chat}>
                        {/* Показываем историю сообщений */}
                        {messages.map((msg, index) =>
                            msg.is_answer ? (
                                <UserMessage key={index} message={msg} />
                            ) : (
                                <SupportMessage key={index} message={msg} />
                            )
                        )}
                    </div>

                    {/* Инпут и кнопка отправки */}
                    <div className={styles.chat__input}>
                        <Icon Svg={ChatImportIcon} width={24} height={24} className={styles.chat__input__icon} />

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
        )
    }
};
