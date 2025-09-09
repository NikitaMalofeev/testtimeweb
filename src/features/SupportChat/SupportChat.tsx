// entities/SupportChat/ui/SupportChat.tsx
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
import uploadIcon from 'shared/assets/svg/ChatImportIcon.svg'
import closeIcon from 'shared/assets/svg/close.svg'
import {
    fetchWebsocketId,
    getAllMessagesThunk,
    openWebSocketConnection,
    postMessage,
    setUnreadAnswersCount,
    addMessage,
    closeWebSocketConnection,
} from "entities/SupportChat/slice/supportChatSlice";
import { Loader } from "shared/ui/Loader/Loader";
import { closeAllModals } from "entities/ui/Modal/slice/modalSlice";
import { setScrollToTop } from "entities/ui/Ui/slice/uiSlice";

const formatDateTime = (datetime: any) => {
    const d = new Date(datetime);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const isImageUrl = (url?: string | null) => {
    if (!url) return false;
    const u = url.split("?")[0].toLowerCase();
    return u.endsWith(".png") || u.endsWith(".jpg") || u.endsWith(".jpeg") || 
           u.endsWith(".webp") || u.endsWith(".gif") || u.endsWith(".bmp") || 
           u.endsWith(".svg") || u.endsWith(".tiff") || u.endsWith(".ico");
};

export const UserMessage = ({ message }: { message: ChatMessage }) => {
    return (
        <div className={styles.message_user}>
            <span className={styles.message__date}>
                {formatDateTime(message.created)}
            </span>
            {message.text ? <p className={styles.message__message_user}>{message.text}</p> : null}
            {message.file_url ? (
                <div className={styles.message__attachment}>
                    {isImageUrl(message.file_url) ? (
                        <div className={styles.message__imageContainer}>
                            <img className={styles.message__fullImage} src={message.file_url} alt="attachment" />
                        </div>
                    ) : (
                        <div className={styles.message__fileContainer}>
                            <a href={message.file_url} target="_blank" rel="noreferrer" className={styles.message__fileLink}>
                                📁 Скачать файл
                            </a>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export const SupportMessage = ({ message, highlight }: { message: ChatMessage; highlight?: boolean }) => {
    return (
        <div className={styles.message_support}>
            <span className={styles.message__date}>
                {formatDateTime(message.created)}
                {highlight && <div className={styles.highlight}></div>}
            </span>
            {message.text ? <p className={styles.message__message_support}>{message.text}</p> : null}
            {message.file_url ? (
                <div className={styles.message__attachment}>
                    {isImageUrl(message.file_url) ? (
                        <div className={styles.message__imageContainer}>
                            <img className={styles.message__fullImage} src={message.file_url} alt="attachment" />
                        </div>
                    ) : (
                        <div className={styles.message__fileContainer}>
                            <a href={message.file_url} target="_blank" rel="noreferrer" className={styles.message__fileLink}>
                                📁 Скачать файл
                            </a>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export const SupportChat = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { websocketId, messages, loading, unreadAnswersCount, isWsConnected } = useSelector(
        (state: RootState) => state.supportChat
    );
    const token = useSelector((state: RootState) => state.user.token);

    const [messageText, setMessageText] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBottom, setIsBottom] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Получение ID веб-сокета и всех сообщений
    useEffect(() => {
        if (token) {
            dispatch(getAllMessagesThunk());
            dispatch(fetchWebsocketId()).then((result: any) => {
                if (result.payload) {
                    dispatch(openWebSocketConnection(result.payload));
                }
            });
        }
    }, [token, dispatch]);

    // Переоткрываем WebSocket если он закрылся
    useEffect(() => {
        if (websocketId && !isWsConnected) {
            dispatch(openWebSocketConnection(websocketId));
        }
    }, [websocketId, isWsConnected, dispatch]);

    // Закрываем любые модалки при открытии чата
    useEffect(() => {
        dispatch(closeAllModals());
    }, [dispatch]);

    // Скроллим вниз при каждом новом сообщении
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Сбрасываем счётчик непрочитанных через 5 сек (как было)
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentAnswerCount = messages.filter((m) => m.is_answer).length;
            localStorage.setItem("chatAnswerCount", String(currentAnswerCount));
            dispatch(setUnreadAnswersCount(0));
        }, 5000);
        return () => clearTimeout(timer);
    }, [messages, dispatch]);

    // Обработчик прокрутки
    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setIsScrolled(scrollTop > 0);
            setIsBottom(scrollTop + clientHeight >= scrollHeight - 10);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setMessageText(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Выбор файлов
    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setAttachedFiles((prev) => [...prev, ...files]);
        // сброс input, чтобы одинаковые файлы можно было выбрать повторно
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAttached = (idx: number) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    // Отправка сообщения (с файлами)
    const handleSendMessage = async () => {
        if (!messageText.trim() && attachedFiles.length === 0) return;

        const messageToSend = messageText.trim();
        
        // Очищаем поля сразу для UX
        setMessageText("");

        try {
            await dispatch(
                postMessage({
                    text: messageToSend || undefined,
                    files: attachedFiles.length ? attachedFiles : undefined,
                }) as any
            );
            setAttachedFiles([]); // очищаем превью после успешной отправки
        } catch (error) {
            console.error("Ошибка отправки сообщения:", error);
            // В случае ошибки возвращаем текст обратно
            setMessageText(messageToSend);
        }
    };

    // Отключаем прокрутку страницы при открытом чате и чистим WS при размонтировании
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
            dispatch(closeWebSocketConnection());
        };
    }, [dispatch]);

    const handleBlur = () => {
        dispatch(setScrollToTop(true));
    };

    // какие сообщения подсвечивать (непрочитанные)
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
                        pointer
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
                className={`${styles.chat__chat__container} ${isScrolled ? styles.shadow_top : ""}`}
                ref={chatContainerRef}
                onScroll={handleScroll}
                style={/Mobi|Android/i.test(navigator.userAgent) ? { paddingBottom: "74px" } : {}}
            >
                <div className={styles.chat__chat}>
                    {messages
                        .slice()
                        .reverse()
                        .map((msg, index) => {
                            const msgKey = `${(msg as any).id ?? "noid"}-${msg.created}-${msg.user_id}-${index}`;
                            if (!msg.is_answer) {
                                return <UserMessage key={msgKey} message={msg} />;
                            }
                            const messageKey = `${msg.created}-${msg.user_id}`;
                            const highlight = unreadMessageKeys.has(messageKey);
                            return <SupportMessage key={msgKey} message={msg} highlight={highlight} />;
                        })}
                </div>
            </div>

            <div className={`${styles.chat__input} ${!isBottom ? styles.shadow : ""}`}>
                {/* кнопка «скрепка» + скрытый input */}
                <div className={styles.chat__attach}>
                    <button
                        type="button"
                        className={styles.chat__attachBtn}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Icon Svg={uploadIcon} width={20} pointer height={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFilesSelect}
                        style={{ display: "none" }}
                    />
                </div>

                <Input
                    placeholder="Написать сообщение..."
                    name="message"
                    type="text"
                    value={messageText}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    withoutCloudyLabel
                    error={false}
                />
                <Icon
                    className={styles.chat__input__icon}
                    Svg={ChatSendIcon}
                    width={24}
                    height={24}
                    pointer
                    onClick={handleSendMessage}
                />
            </div>

            {/* превью выбранных файлов перед отправкой - полупрозрачная полоска на всю ширину */}
            {attachedFiles.length > 0 && (
                <div className={styles.chat__imagePreviewBar}>
                    <div className={styles.chat__imagePreviewContainer}>
                        {attachedFiles.map((f, idx) => {
                            const url = URL.createObjectURL(f);
                            const image = isImageUrl(f.name);
                            return (
                                <div className={styles.chat__previewItem} key={`${f.name}-${idx}`}>
                                    <div className={styles.chat__previewThumb}>
                                        {image ? (
                                            <img src={url} alt={f.name} />
                                        ) : (
                                            <div className={styles.chat__previewFileStub}>
                                                <span>FILE</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.chat__previewRemove}
                                        onClick={() => removeAttached(idx)}
                                    >
                                        <Icon pointer Svg={closeIcon} width={8} height={8} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
