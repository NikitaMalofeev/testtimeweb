// entities/SupportChat/ui/SupportChat.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Icon } from "shared/ui/Icon/Icon";
import { Input } from "shared/ui/Input/Input";
import ArrowBack from "shared/assets/svg/ArrowBack.svg";
import ChatSendIcon from "shared/assets/svg/ChatSendIcon.svg";
import styles from "./styles.module.scss";
import { RootState } from "app/providers/store/config/store";
import { ChatMessage } from "entities/SupportChat/model/chatModel";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useSelector } from "react-redux";
import uploadIcon from 'shared/assets/svg/ChatImportIcon.svg';
import closeIcon from 'shared/assets/svg/close.svg';
import {
  fetchWebsocketId,
  getAllMessagesThunk,
  openWebSocketConnection,
  postMessage,
  setUnreadAnswersCount,
  addMessage,
  closeWebSocketConnection,
  addOptimisticMessage,
  fetchChatSettings,
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

// Кеш для blob URL optimistic файлов
const optimisticBlobCache = new Map<File, string>();

// Функция для очистки кеша
const clearImageCache = () => {
  imageCache.forEach(entry => {
    URL.revokeObjectURL(entry.blobUrl);
  });
  imageCache.clear();
};

// Функция для получения изображения из кеша или загрузки через новый API
const getCachedImage = async (messageId: number, fileIndex: number, token: string): Promise<ImageCacheEntry | null> => {
  const cacheKey = `${messageId}-${fileIndex}`;

  const cached = imageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { getFileByQuestionIdAndIndex } = await import('entities/SupportChat/api/supportChatApi');

    const blob = await getFileByQuestionIdAndIndex(messageId, fileIndex, token);
    let blobUrl: string;
    let isZipFile = false;

    if (blob.type === 'application/zip' || blob.type === 'application/x-zip-compressed') {
      isZipFile = true;
      const extractedUrl = await extractImageFromZip(blob);
      if (extractedUrl) {
        blobUrl = extractedUrl;
      } else {
        throw new Error('Не удалось извлечь изображение из ZIP');
      }
    } else {
      blobUrl = URL.createObjectURL(blob);
    }

    const cacheEntry: ImageCacheEntry = {
      blobUrl,
      isZipFile,
      timestamp: Date.now()
    };

    imageCache.set(cacheKey, cacheEntry);
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
    <div className={styles.imageModal} onClick={onClose}>
      <div className={styles.imageModal__content} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className={styles.imageModal__image} />
      </div>
    </div>,
    document.body
  );
};

// Компонент для оптимистичных изображений (File объекты и blob URL)
const OptimisticImage: React.FC<{
  file?: File;
  blobUrl?: string;
  index: number;
}> = ({ file, blobUrl, index }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let url: string;
    if (file) {
      url = URL.createObjectURL(file);
    } else if (blobUrl) {
      url = blobUrl;
    } else {
      return;
    }

    setImageUrl(url);
    const timer = setTimeout(() => setLoading(false), 200);

    return () => {
      clearTimeout(timer);
      if (file && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file, blobUrl]);

  if (loading || !imageUrl) {
    return (
      <div className={`${styles.message__imageLoading} ${styles.message__fullImage}`}>
        <div className={styles.message__imageLoader}>
          <Loader size={LoaderSize.SMALL} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div onClick={() => setIsModalOpen(true)}>
        <img
          src={imageUrl}
          alt={`attachment ${index + 1}`}
          className={`${styles.message__fullImage} ${styles.clickableImage}`}
        />
      </div>
      <ImageModal
        src={imageUrl}
        alt={`attachment ${index + 1}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

// Компонент для загрузки защищенных изображений через новый API
const AuthImage: React.FC<{
  messageId: number;
  fileIndex: number;
  alt?: string;
  className?: string;
  token?: string; // <-- сделал опциональным
}> = ({ messageId, fileIndex, alt, className, token }) => {
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

        // Без токена грузить нельзя
        if (!token) {
          setError(true);
          setLoading(false);
          return;
        }

        const cacheKey = `${messageId}-${fileIndex}`;

        const cached = imageCache.get(cacheKey);
        if (cached) {
          setBlobUrl(cached.blobUrl);
          setIsZipFile(cached.isZipFile);
          setLoading(false);
          return;
        }

        if (!isInViewport) {
          setLoading(false);
          return;
        }

        const cacheEntry = await getCachedImage(messageId, fileIndex, token);
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
  }, [messageId, fileIndex, token, isInViewport]);

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

  if (isZipFile && !isInViewport) {
    return (
      <div ref={imageRef} className={`${styles.message__imageLoading} ${className || ''}`}>
        <div className={styles.message__imageLoader}><Loader size={LoaderSize.SMALL} /></div>
      </div>
    );
  }

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
          className={`${className || ''} ${styles.clickableImage}`}
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
  if (!datetime) return "";

  const d = new Date(datetime);
  if (isNaN(d.getTime())) {
    return "";
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

  const urlWithoutParams = u.split("?")[0];
  const hasImageExtension = urlWithoutParams.endsWith(".png") || urlWithoutParams.endsWith(".jpg") ||
    urlWithoutParams.endsWith(".jpeg") || urlWithoutParams.endsWith(".webp") ||
    urlWithoutParams.endsWith(".gif") || urlWithoutParams.endsWith(".bmp") ||
    urlWithoutParams.endsWith(".svg") || urlWithoutParams.endsWith(".tiff") ||
    urlWithoutParams.endsWith(".ico");

  const hasImageKeywords = u.includes("/image") || u.includes("image/") || u.includes("img/") ||
    u.includes("/photo") || u.includes("photo/") || u.includes("/picture");

  return hasImageExtension || hasImageKeywords;
};

export const UserMessage = ({ message, token }: { message: ChatMessage; token?: string }) => {
  const isOptimistic = (message as any).optimistic === true;
  const hasError = (message as any).error === true;

  let files: any[] = [];

  if (message.file_url) {
    const urls = Array.isArray(message.file_url) ? message.file_url : [message.file_url];

    if (isOptimistic && (message as any).optimisticFilesCount > 0) {
      files = urls.map(url => ({ url }));
    } else {
      files = urls.map(url => ({ url }));
    }
  }

  const fileDescription = message.text_for_files;

  return (
    <div className={styles.message_user}>
      <span className={styles.message__date}>
        {formatDateTime(message.created)}
        {isOptimistic && (
          <span className={styles.message__sending}> отправляется...</span>
        )}
        {hasError && (
          <span className={styles.message__error}> ошибка отправки</span>
        )}
      </span>

      {(fileDescription || files.length > 0) && (
        <div className={styles.message__attachment}>
          {files.length > 0 && (
            <div className={styles.message__imageContainer}>
              {files.map((file: any, index: number) => {
                const fileUrl = file.url || file;
                if (typeof fileUrl === 'string') {
                  if (fileUrl.startsWith('blob:')) {
                    return <OptimisticImage key={index} blobUrl={fileUrl} index={index} />;
                  } else {
                    const messageId = (message as any).id;
                    if (messageId) {
                      return (
                        <AuthImage
                          key={index}
                          messageId={messageId}
                          fileIndex={index}
                          className={styles.message__fullImage}
                          token={token}
                        />
                      );
                    }
                  }
                }
                return null;
              })}
            </div>
          )}
          {fileDescription && (
            <p className={`${styles.message__message_user} ${isOptimistic ? styles.message__sending_text : ''} ${hasError ? styles.message__error_text : ''}`} style={{ marginBottom: files.length > 0 ? '0' : '0' }}>
              {fileDescription}
            </p>
          )}
        </div>
      )}

      {message.text && (
        <p className={`${styles.message__message_user} ${isOptimistic ? styles.message__sending_text : ''} ${hasError ? styles.message__error_text : ''}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

export const SupportMessage = ({ message, highlight, token }: { message: ChatMessage; highlight?: boolean; token?: string }) => {
  const fileUrls = message.file_url ?
    (Array.isArray(message.file_url) ? message.file_url : [message.file_url]) :
    [];

  return (
    <div className={styles.message_support}>
      <span className={styles.message__date}>
        {formatDateTime(message.created)}
        {highlight && <div className={styles.highlight}></div>}
      </span>
      {message.text ? <p className={styles.message__message_support}>{message.text}</p> : null}
      {fileUrls.length > 0 ? (
        <div className={styles.message__attachment}>
          <div className={styles.message__imageContainer}>
            {fileUrls.map((fileUrl, index) => {
              if (!fileUrl) return null;

              const messageId = (message as any).id;
              if (messageId) {
                return (
                  <AuthImage
                    key={index}
                    messageId={messageId}
                    fileIndex={index}
                    alt={`attachment ${index + 1}`}
                    className={styles.message__fullImage}
                    token={token}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const SupportChat = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { websocketId, messages, loading, unreadAnswersCount, isWsConnected, chatSettings } = useSelector(
    (state: RootState) => state.supportChat
  );
  const token = useSelector((state: RootState) => state.user.token);

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileDescription, setFileDescription] = useState<string>("");
  const [fileDescriptionError, setFileDescriptionError] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBottom, setIsBottom] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({
      message: Yup.string().when([], {
        is: () => {
          return attachedFiles.length === 0;
        },
        then: (schema) => {
          const minLength = chatSettings?.min_length_text || 50;
          return schema
            .required("Введите сообщение или прикрепите файл")
            .min(minLength, `мин. ${minLength} символов`);
        },
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    validate: (values) => {
      const errors: any = {};
      const messageText = values.message.trim();
      const fileDescriptionText = fileDescription.trim();
      const minTextLength = chatSettings?.min_length_text || 50;

      if (attachedFiles.length > 0) {
        if (messageText && fileDescriptionText) {
          if (messageText.length < minTextLength) {
            errors.message = `мин. ${minTextLength} символов`;
          }
        } else if (messageText) {
          if (messageText.length < minTextLength) {
            errors.message = `мин. ${minTextLength} символов`;
          }
        } else if (fileDescriptionText) {
          // ок
        } else {
          errors.message = "Введите сообщение или описание файлов";
        }
      } else {
        if (!messageText) {
          errors.message = "Введите сообщение или прикрепите файл";
        } else if (messageText.length < minTextLength) {
          errors.message = `мин. ${minTextLength} символов`;
        }
      }

      return errors;
    },
    onSubmit: async (values, { resetForm }) => {
      const messageText = values.message.trim();
      const fileDescriptionText = fileDescription.trim();
      const minTextLength = chatSettings?.min_length_text || 50;
      const minTextForFilesLength = chatSettings?.min_length_text_for_files || 20;

      setFileDescriptionError("");

      if (!messageText && !fileDescriptionText && attachedFiles.length === 0) {
        return;
      }

      if (attachedFiles.length > 0) {
        let hasError = false;

        if (messageText && fileDescriptionText) {
          if (messageText.length < minTextLength) {
            formik.setFieldTouched('message', true);
            formik.setFieldError('message', `мин. ${minTextLength} символов`);
            hasError = true;
          }
          if (fileDescriptionText.length < minTextForFilesLength) {
            setFileDescriptionError(`мин. ${minTextForFilesLength} символов`);
            hasError = true;
          }
        } else if (messageText) {
          if (messageText.length < minTextLength) {
            formik.setFieldTouched('message', true);
            formik.setFieldError('message', `мин. ${минTextLength} символов`);
            hasError = true;
          }
        } else if (fileDescriptionText) {
          if (fileDescriptionText.length < minTextForFilesLength) {
            setFileDescriptionError(`мин. ${minTextForFilesLength} символов`);
            hasError = true;
          }
        } else {
          formik.setFieldTouched('message', true);
          formik.setFieldError('message', 'Введите сообщение или описание файлов');
          hasError = true;
        }

        if (hasError) {
          return;
        }
      } else {
        if (messageText.length < minTextLength) {
          formik.setFieldTouched('message', true);
          formik.setFieldError('message', `мин. ${minTextLength} символов`);
          return;
        }
      }

      dispatch(addOptimisticMessage({
        text: messageText || '',
        fileDescription: fileDescriptionText || '',
        files: attachedFiles.length > 0 ? attachedFiles : undefined
      }));

      resetForm();
      const filesToSend = [...attachedFiles];
      const descriptionToSend = fileDescriptionText;
      setAttachedFiles([]);
      setFileDescription("");
      setFileDescriptionError("");

      const payload: any = {};

      if (filesToSend.length > 0) {
        if (messageText) {
          payload.text = messageText;
        }
        if (descriptionToSend) {
          payload.text_for_files = descriptionToSend;
        }
        payload.files = filesToSend;
      } else {
        payload.text = messageText;
      }

      try {
        await dispatch(postMessage(payload) as any);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
  });

  // Получение ID веб-сокета и всех сообщений
  useEffect(() => {
    if (token) {
      dispatch(getAllMessagesThunk());
      dispatch(fetchWebsocketId()).then((result: any) => {
        if (result.payload) {
          dispatch(openWebSocketConnection(result.payload));
        }
      });
      dispatch(fetchChatSettings() as any);
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

  // Сбрасываем счётчик непрочитанных через 5 сек
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formik.handleSubmit();
    }
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setAttachedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttached = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileDescriptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFileDescription(value);

    if (fileDescriptionError) {
      const trimmedValue = value.trim();
      const minTextForFilesLength = chatSettings?.min_length_text_for_files || 20;
      const messageText = formik.values.message.trim();
      if (trimmedValue.length >= minTextForFilesLength ||
        (trimmedValue.length === 0 && messageText.length > 0)) {
        setFileDescriptionError("");
      }
    }
  };

  useEffect(() => {
    if (attachedFiles.length === 0 && fileDescription) {
      setFileDescription("");
      setFileDescriptionError("");
    }
  }, [attachedFiles.length, fileDescription]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      dispatch(closeWebSocketConnection());
      clearImageCache();
    };
  }, [dispatch]);

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

        <div className={styles.input}>
          <Input
            placeholder="Написать сообщение..."
            name="message"
            type="text"
            value={formik.values.message}
            onChange={formik.handleChange}
            onBlur={(e) => {
              formik.handleBlur(e);
              dispatch(setScrollToTop(true));
            }}
            onKeyDown={handleKeyDown}
            withoutCloudyLabel
            error={!!(formik.touched.message && formik.errors.message)} // строго boolean
          />
          {formik.touched.message && formik.errors.message && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>
              {formik.errors.message}
            </div>
          )}
        </div>
        <Icon
          className={styles.chat__input__icon}
          Svg={ChatSendIcon}
          width={24}
          height={24}
          pointer
          onClick={() => formik.handleSubmit()}
        />
      </div>

      {attachedFiles.length > 0 && (
        <div className={styles.chat__imagePreviewBar}>
          <div className={styles.chat__fileDescriptionContainer}>
            <Input
              placeholder="Описание файлов..."
              name="fileDescription"
              type="text"
              value={fileDescription}
              onChange={handleFileDescriptionChange}
              withoutCloudyLabel
              error={Boolean(fileDescriptionError)}
            />
            {fileDescriptionError && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', paddingLeft: '4px' }}>
                {fileDescriptionError}
              </div>
            )}
          </div>
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
