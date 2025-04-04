import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "shared/ui/Icon/Icon";
import { Input } from "shared/ui/Input/Input";
import ArrowBack from "shared/assets/svg/ArrowBack.svg";
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
    setUnreadAnswersCount,
} from "entities/SupportChat/slice/supportChatSlice";
import { Loader } from "shared/ui/Loader/Loader";
import { closeAllModals } from "entities/ui/Modal/slice/modalSlice";

interface SupportMessageProps {
    message: ChatMessage;
    highlight?: boolean;
}

const formatDateTime = (datetime: any) => {
    const d = new Date(datetime);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export const UserMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <div className={styles.message_user}>
            <span className={styles.message__date}>
                {formatDateTime(message.created)}
            </span>
            <p className={styles.message__message_user}>{message.text}</p>
        </div>
    );
};

export const SupportMessage = ({ message, highlight }: SupportMessageProps) => {
    return (
        <div className={styles.message_support}>
            <span className={styles.message__date}>
                {formatDateTime(message.created)}
                {highlight && <div className={styles.highlight}></div>}
            </span>
            <p className={styles.message__message_support}>{message.text}</p>
        </div>
    );
};

export const SupportChat = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { websocketId, messages, loading, unreadAnswersCount } = useSelector(
        (state: RootState) => state.supportChat
    );
    const token = useSelector((state: RootState) => state.user.token);

    const [messageText, setMessageText] = useState("");
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBottom, setIsBottom] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Получение ID веб-сокета и сообщений
    useEffect(() => {
        dispatch(fetchWebsocketId());
        dispatch(getAllMessagesThunk());
    }, [token, dispatch]);

    // Закрываем все модальные окна при открытии чата
    useEffect(() => {
        dispatch(closeAllModals());
    }, [dispatch]);

    // // Отключаем прокрутку страницы при открытом чате
    // useEffect(() => {
    //     const originalOverflow = document.body.style.overflow;
    //     document.body.style.overflow = "hidden";
    //     return () => {
    //         document.body.style.overflow = originalOverflow;
    //     };
    // }, []);

    useEffect(() => {
        if (websocketId) {
            dispatch(openWebSocketConnection(websocketId));
        }
    }, [websocketId, dispatch]);

    // Автоскролл вниз при изменении сообщений
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const setVh = () => {
            // Берём текущую высоту экрана
            const vh = window.innerHeight * 0.01;
            // Записываем её как CSS-переменную
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh(); // Устанавливаем при загрузке
        window.addEventListener('resize', setVh);

        return () => {
            window.removeEventListener('resize', setVh);
        };
    }, []);


    // Сброс непрочитанных сообщений через 5 секунд
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentAnswerCount = messages.filter((m) => m.is_answer).length;
            localStorage.setItem("chatAnswerCount", String(currentAnswerCount));
            dispatch(setUnreadAnswersCount(0));
        }, 5000);
        return () => clearTimeout(timer);
    }, [messages, dispatch]);

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

    // Вычисляем ключи для непрочитанных сообщений поддержки
    const unreadMessageKeys = React.useMemo(() => {
        const answerMessages = messages.filter((m) => m.is_answer).slice().reverse();
        const count = unreadAnswersCount;
        const unreadMessages = count > 0 ? answerMessages.slice(-count) : [];
        return new Set(unreadMessages.map((m) => `${m.created}-${m.user_id}`));
    }, [messages, unreadAnswersCount]);

    if (loading && messages.length === 0) {
        return <Loader />;
    }

    return (
        <div className={styles.chat}>
            <div className={`${styles.chat__header} ${isScrolled ? styles.shadow : ""}`}>
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
                className={`${styles.chat__chat__container} ${isScrolled ? styles.shadow_top : ""}`} ref={chatContainerRef}
                onScroll={handleScroll}
            >
                <div className={styles.chat__chat}>
                    {messages
                        .slice()
                        .reverse()
                        .map((msg, index) => {
                            const msgKey = `${msg.created}-${msg.user_id}-${index}`;
                            if (!msg.is_answer) {
                                return <UserMessage key={msgKey} message={msg} />;
                            }
                            const messageKey = `${msg.created}-${msg.user_id}`;
                            const highlight = unreadMessageKeys.has(messageKey);
                            return (
                                <SupportMessage
                                    key={msgKey}
                                    message={msg}
                                    highlight={highlight}
                                />
                            );
                        })}
                </div>

            </div>
            <div className={styles.chat__input__container}>
                <div className={`${styles.chat__input} ${!isBottom ? styles.shadow : ""}`}>
                    {/* <Icon
                    Svg={ChatImportIcon}
                    width={24}
                    height={24}
                    className={styles.chat__input__icon}
                /> */}

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

        </div>
    );
};
