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
import { Loader, LoaderSize } from "shared/ui/Loader/Loader";
import { closeAllModals } from "entities/ui/Modal/slice/modalSlice";
import { setScrollToTop } from "entities/ui/Ui/slice/uiSlice";
import JSZip from "jszip";
import { createPortal } from "react-dom";

// Глобальный кеш для изображений в рамках сессии
interface ImageCacheEntry {
    blobUrl: string;
    isZipFile: boolean;
    timestamp: number;
}

const imageCache = new Map<string, ImageCacheEntry>();

// Функция для очистки кеша
const clearImageCache = () => {
    imageCache.forEach(entry => {
        URL.revokeObjectURL(entry.blobUrl);
    });
    imageCache.clear();
};

// Функция для получения изображения из кеша или загрузки
const getCachedImage = async (src: string, token: string): Promise<ImageCacheEntry | null> => {
    // Проверяем кеш
    const cached = imageCache.get(src);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(src, {
            headers: {
                'Authorization': `Token ${token}`,
                'Accept': 'image/*,*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        let blobUrl: string;
        let isZipFile = false;

        // Проверяем, является ли файл ZIP архивом
        if (blob.type === 'application/zip' || blob.type === 'application/x-zip-compressed') {
            isZipFile = true;
            const extractedUrl = await extractImageFromZip(blob);
            if (extractedUrl) {
                blobUrl = extractedUrl;
            } else {
                throw new Error('Не удалось извлечь изображение из ZIP');
            }
        } else {
            // Обычное изображение
            blobUrl = URL.createObjectURL(blob);
        }

        const cacheEntry: ImageCacheEntry = {
            blobUrl,
            isZipFile,
            timestamp: Date.now()
        };

        // Сохраняем в кеш
        imageCache.set(src, cacheEntry);
        return cacheEntry;
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        return null;
    }
};

// Функция для извлечения изображения из ZIP архива
const extractImageFromZip = async (zipBlob: Blob): Promise<string | null> => {
    try {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(zipBlob);

        // Ищем первый файл изображения в архиве
        for (const fileName in zipData.files) {
            const file = zipData.files[fileName];
            if (!file.dir && isImageFileName(fileName)) {
                const imageBlob = await file.async("blob");
                return URL.createObjectURL(imageBlob);
            }
        }

        return null;
    } catch (error) {
        console.error('Ошибка извлечения изображения из ZIP:', error);
        return null;
    }
};

// Проверка является ли файл изображением по имени
const isImageFileName = (fileName: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.tiff', '.ico'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

// Хук для отслеживания видимости элемента во viewport
const useInViewport = (ref: React.RefObject<HTMLElement>) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const current = ref.current;
        if (!current) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.1 }
        );

        observer.observe(current);
        return () => observer.disconnect();
    }, [ref]);

    return isVisible;
};

// Компонент кнопки скачивания для изображений вне viewport
const ImageDownloadButton: React.FC<{
    src: string;
    token: string;
    className?: string;
}> = ({ src, token, className }) => {
    const handleDownload = async () => {
        try {
            const response = await fetch(src, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Accept': 'image/*,*/*'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const blob = await response.blob();
            let downloadUrl = URL.createObjectURL(blob);
            let fileName = 'image';

            // Если это ZIP файл, попробуем извлечь изображение
            if (blob.type === 'application/zip' || blob.type === 'application/x-zip-compressed') {
                const extractedUrl = await extractImageFromZip(blob);
                if (extractedUrl) {
                    downloadUrl = extractedUrl;
                    fileName = 'extracted_image';
                } else {
                    fileName = 'archive.zip';
                }
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Ошибка скачивания изображения:', error);
        }
    };

    return (
        <button
            onClick={handleDownload}
            className={`${styles.downloadButton} ${className || ''}`}
        >
            ⬇ Скачать изображение
        </button>
    );
};

// Компонент модального окна для просмотра изображений в полном размере
const ImageModal: React.FC<{
    src: string;
    alt?: string;
    isOpen: boolean;
    onClose: () => void;
}> = ({ src, alt, isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Закрытие по клавише Escape
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={styles.imageModal}
            onClick={onClose}
        >
            <div
                className={styles.imageModal__content}
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={alt}
                    className={styles.imageModal__image}
                />
            </div>
        </div>,
        document.body
    );
};

// Компонент для загрузки защищенных изображений через Blob
const AuthImage: React.FC<{
    src: string;
    alt?: string;
    className?: string;
    token: string;
}> = ({ src, alt, className, token }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isZipFile, setIsZipFile] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);
    const isInViewport = useInViewport(imageRef);

    useEffect(() => {
        const loadImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Сначала проверяем кеш
                const cached = imageCache.get(src);
                if (cached) {
                    setBlobUrl(cached.blobUrl);
                    setIsZipFile(cached.isZipFile);
                    setLoading(false);
                    return;
                }

                // Быстрая проверка типа файла для ZIP
                const isLikelyZip = await checkIfNeedsViewport(src, token);
                if (isLikelyZip && !isInViewport) {
                    setIsZipFile(true);
                    setLoading(false);
                    return;
                }

                // Загружаем и кешируем
                const cacheEntry = await getCachedImage(src, token);
                if (cacheEntry) {
                    setBlobUrl(cacheEntry.blobUrl);
                    setIsZipFile(cacheEntry.isZipFile);
                } else {
                    setError(true);
                }

                setLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки изображения:', err);
                setError(true);
                setLoading(false);
            }
        };

        loadImage();
    }, [src, token, isInViewport]);

    // Функция для быстрой проверки типа файла без полной загрузки
    const checkIfNeedsViewport = async (src: string, token: string): Promise<boolean> => {
        try {
            const response = await fetch(src, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Token ${token}`,
                }
            });
            const contentType = response.headers.get('content-type') || '';
            return contentType === 'application/zip' || contentType === 'application/x-zip-compressed';
        } catch {
            return false;
        }
    };

    if (loading) {
        return (
            <div ref={imageRef} className={`${styles.message__imageLoading} ${className || ''}`}>
                <div className={styles.message__imageLoader}><Loader size={LoaderSize.SMALL} /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div ref={imageRef} className={`${styles.message__imageError} ${className || ''}`}>
                <span>Не удалось загрузить изображение</span>
            </div>
        );
    }

    // Если это ZIP файл и изображение не в viewport - показываем кнопку скачивания
    // if (isZipFile && !isInViewport) {
    //     return (
    //         <div ref={imageRef} className={`${styles.message__imageDownload} ${className || ''}`}>
    //             <ImageDownloadButton src={src} token={token} />
    //         </div>
    //     );
    // }
    if (isZipFile && !isInViewport) {
        return (
            <div ref={imageRef} className={`${styles.message__imageLoading} ${className || ''}`}>
                <div className={styles.message__imageLoader}><Loader size={LoaderSize.SMALL} /></div>
            </div>
        );
    }


    // Если нет blobUrl(например, ZIP вне viewport)
    // if (!blobUrl) {
    //     return (
    //         <div ref={imageRef} className={`${styles.message__imageDownload} ${className || ''}`}>
    //             <ImageDownloadButton src={src} token={token} />
    //         </div>
    //     );
    // }
    if (!blobUrl) {
        return (
            <div ref={imageRef} className={`${styles.message__imageLoading} ${className || ''}`}>
                <div className={styles.message__imageLoader}><Loader size={LoaderSize.SMALL} /></div>
            </div>
        );
    }

    return (
        <>
            <div ref={imageRef} onClick={() => setIsModalOpen(true)}>
                <img
                    src={blobUrl}
                    alt={alt}
                    className={`${className} ${styles.clickableImage}`}
                    onLoad={() => {
                        // Дополнительная очистка при успешной загрузке
                        // URL все еще нужен для отображения
                    }}
                />
            </div>
            <ImageModal
                src={blobUrl}
                alt={alt}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

const formatDateTime = (datetime: any) => {
    if (!datetime) return "Неизвестно";

    const d = new Date(datetime);

    // Проверяем валидность даты
    if (isNaN(d.getTime())) {
        return "Неизвестно";
    }

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const isImageUrl = (url?: string | null) => {
    if (!url) return false;

    const u = url.toLowerCase();

    // Проверяем по расширению (для обычных файлов)
    const urlWithoutParams = u.split("?")[0];
    const hasImageExtension = urlWithoutParams.endsWith(".png") || urlWithoutParams.endsWith(".jpg") ||
        urlWithoutParams.endsWith(".jpeg") || urlWithoutParams.endsWith(".webp") ||
        urlWithoutParams.endsWith(".gif") || urlWithoutParams.endsWith(".bmp") ||
        urlWithoutParams.endsWith(".svg") || urlWithoutParams.endsWith(".tiff") ||
        urlWithoutParams.endsWith(".ico");

    // Проверяем специфические API endpoints твоего сервера (Ranks API)
    const isRanksFileApi = u.includes("get_files_question") && u.includes("id=");

    // Проверяем по ключевым словам в URL (для других API)
    const hasImageKeywords = u.includes("/image") || u.includes("image/") || u.includes("img/") ||
        u.includes("/photo") || u.includes("photo/") || u.includes("/picture");

    // Файл считается изображением если:
    // 1. Имеет расширение изображения ИЛИ
    // 2. Это API Ranks для файлов ИЛИ  
    // 3. Содержит ключевые слова изображений
    return hasImageExtension || isRanksFileApi || hasImageKeywords;
};

export const UserMessage = ({ message, token }: { message: ChatMessage; token: string }) => {
    return (
        <div className={styles.message_user}>
            <span className={styles.message__date}>
                {formatDateTime(message.created)}
            </span>
            {message.text ? <p className={styles.message__message_user}>{message.text}</p> : null}
            {message.file_url ? (
                <div className={styles.message__attachment}>
                    {/* {isImageUrl(message.file_url) ? (
                        <div className={styles.message__imageContainer}>
                            <AuthImage
                                src={message.file_url}
                                alt="attachment"
                                className={styles.message__fullImage}
                                token={token}
                            />
                        </div>
                    ) : (
                        <div className={styles.message__fileContainer}>
                            <a href={message.file_url} target="_blank" rel="noreferrer" className={styles.message__fileLink}>
                                📁 Скачать файл
                            </a>
                        </div>
                    )} */}
                    <div className={styles.message__imageContainer}>
                        <AuthImage
                            src={message.file_url}

                            className={styles.message__fullImage}
                            token={token}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export const SupportMessage = ({ message, highlight, token }: { message: ChatMessage; highlight?: boolean; token: string }) => {
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
                            <AuthImage
                                src={message.file_url}
                                alt="attachment"
                                className={styles.message__fullImage}
                                token={token}
                            />
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
            // Очищаем кеш изображений при выходе из чата
            clearImageCache();
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
                                return <UserMessage key={msgKey} message={msg} token={token} />;
                            }
                            const messageKey = `${msg.created}-${msg.user_id}`;
                            const highlight = unreadMessageKeys.has(messageKey);
                            return <SupportMessage key={msgKey} message={msg} highlight={highlight} token={token} />;
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
