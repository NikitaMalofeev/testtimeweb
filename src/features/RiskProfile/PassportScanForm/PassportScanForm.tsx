import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Icon } from "shared/ui/Icon/Icon";
import UploadIcon from "shared/assets/svg/UploadIcon.svg";
import UploadPDFIcon from "shared/assets/svg/UploadPDFIcon.svg";
import SuccessLabel from 'shared/assets/svg/SuccessLabel.svg'
import styles from "./styles.module.scss";

export const PasportScanForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    // === STATE для превью файлов ===
    const [previewFirst, setPreviewFirst] = useState<string | null>(null);
    const [isPdfFirst, setIsPdfFirst] = useState(false);

    const [previewReg, setPreviewReg] = useState<string | null>(null);
    const [isPdfReg, setIsPdfReg] = useState(false);

    const [dragActiveFirst, setDragActiveFirst] = useState(false);
    const [dragActiveReg, setDragActiveReg] = useState(false);

    // === Состояния для большого просмотра (два отдельных)
    const [isPreviewOpenFirst, setIsPreviewOpenFirst] = useState(false);
    const [isPreviewOpenReg, setIsPreviewOpenReg] = useState(false);

    // Счетчики для DragEnter/DragLeave
    const dragCounterFirst = useRef(0);
    const dragCounterReg = useRef(0);

    // Рефы на инпуты
    const fileInputFirstRef = useRef<HTMLInputElement>(null);
    const fileInputRegRef = useRef<HTMLInputElement>(null);

    // Инициализация formik
    const formik = useFormik({
        initialValues: {
            file_scan_page_first: null,
            file_scan_page_registration: null,
        },
        onSubmit: (values) => {
            // handle submit
        },
    });

    const isButtonDisabled = !(formik.values.file_scan_page_first && formik.values.file_scan_page_registration);

    // === Действия по клику, чтобы открыть диалог загрузки ===
    const handleClickFirst = () => fileInputFirstRef.current?.click();
    const handleClickReg = () => fileInputRegRef.current?.click();

    // === Обработчик изменения файла ===
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldName: "file_scan_page_first" | "file_scan_page_registration"
    ) => {
        const file = e.currentTarget.files?.[0];
        if (file) {
            formik.setFieldValue(fieldName, file);

            if (fieldName === "file_scan_page_first") {
                updatePreview(file, setPreviewFirst, setIsPdfFirst);
            } else {
                updatePreview(file, setPreviewReg, setIsPdfReg);
            }
        }
    };

    // === Обработчики Drag & Drop ===
    const handleDragEnter = (
        e: React.DragEvent<HTMLDivElement>,
        setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
        dragCounter: React.MutableRefObject<number>
    ) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        setDragActive(true);
    };

    const handleDragLeave = (
        e: React.DragEvent<HTMLDivElement>,
        setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
        dragCounter: React.MutableRefObject<number>
    ) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setDragActive(false);
        }
    };

    const handleDrop = (
        e: React.DragEvent<HTMLDivElement>,
        fieldName: "file_scan_page_first" | "file_scan_page_registration",
        setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
        dragCounter: React.MutableRefObject<number>
    ) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            formik.setFieldValue(fieldName, e.dataTransfer.files[0]);

            if (fieldName === "file_scan_page_first") {
                updatePreview(e.dataTransfer.files[0], setPreviewFirst, setIsPdfFirst);
            } else {
                updatePreview(e.dataTransfer.files[0], setPreviewReg, setIsPdfReg);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // === Функция обновления превью ===
    // Мы НЕ отзываем URL внутри самого setState, чтобы не ломать другие превью.
    // Вместо этого будем отзывать предыдущий URL через эффект.
    const updatePreview = (
        file: File,
        setPreview: React.Dispatch<React.SetStateAction<string | null>>,
        setIsPdf: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        if (file.type === "application/pdf") {
            setIsPdf(true);
            setPreview(null);
        } else {
            setIsPdf(false);
            const newUrl = URL.createObjectURL(file);
            setPreview(newUrl);
        }
    };

    // === Открытие/закрытие первого изображения
    const toggleFullPreviewFirst = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsPreviewOpenFirst(prev => !prev);
    };

    // === Открытие/закрытие второго изображения
    const toggleFullPreviewReg = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsPreviewOpenReg(prev => !prev);
    };

    // === При смене previewFirst или размонтировании компонента — отзываем предыдущий URL
    useEffect(() => {
        return () => {
            if (previewFirst) {
                URL.revokeObjectURL(previewFirst);
            }
        };
    }, [previewFirst]);

    // === При смене previewReg или размонтировании компонента — отзываем предыдущий URL
    useEffect(() => {
        return () => {
            if (previewReg) {
                URL.revokeObjectURL(previewReg);
            }
        };
    }, [previewReg]);

    return (
        <>
            {/* Модалка для первого файла (если открыт) */}
            {isPreviewOpenFirst && previewFirst && (
                <div
                    className={styles.fullPreviewOverlay}
                    onClick={toggleFullPreviewFirst}
                    style={{ zIndex: 9998 }}
                >
                    <img
                        className={styles.fullPreviewImage}
                        src={previewFirst}
                        alt="Full preview first"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Модалка для второго файла (если открыт) */}
            {isPreviewOpenReg && previewReg && (
                <div
                    className={styles.fullPreviewOverlay}
                    onClick={toggleFullPreviewReg}
                    style={{ zIndex: 9999 }}
                >
                    <img
                        className={styles.fullPreviewImage}
                        src={previewReg}
                        alt="Full preview registration"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <form onSubmit={formik.handleSubmit} className={styles.form}>
                <p className={styles.form__title}>
                    Скан/фото паспорта для идентификации клиента необходимо предоставлять в следующем виде:
                </p>
                <ol className={styles.form__list}>
                    <li className={styles.form__list__item}>
                        Разворот первой страницы паспорта полностью, не обрезанный, без засветов,
                        все персональные данные, серия и номер паспорта должны четко читаться.
                    </li>
                    <li className={styles.form__list__item}>
                        Страница с регистрацией полностью, не обрезанная, без засветов,
                        с четко читаемым адресом регистрации, серией и номером паспорта.
                        Если страница полностью заполнена печатями с регистрациями,
                        необходимо предоставить разворот следующей страницы.
                    </li>
                    <li className={styles.form__list__item}>
                        Если предоставляется фото паспорта, то фото необходимо делать,
                        положив паспорт на стол, можно подложить лист бумаги А4,
                        пальцы рук не должны попадать в кадр.
                    </li>
                </ol>

                {/* Первая страница паспорта */}
                <div className={styles.uploadBlock__header}>
                    <span className={styles.uploadBlock__headerTitle}>ПЕРВАЯ СТРАНИЦА: &nbsp;</span>
                    <span className={styles.uploadBlock__headerExample} onClick={(e) => e.preventDefault()}>
                        СМ. ОБРАЗЕЦ
                    </span>
                </div>

                <div className={`${styles.uploadBlock} ${dragActiveFirst ? styles.uploadBlock_active : ""}`}>
                    <div
                        className={styles.uploadBlock__dropzone}
                        onClick={handleClickFirst}
                        onDragEnter={(e) => handleDragEnter(e, setDragActiveFirst, dragCounterFirst)}
                        onDragOver={handleDragOver}
                        onDragLeave={(e) => handleDragLeave(e, setDragActiveFirst, dragCounterFirst)}
                        onDrop={(e) => handleDrop(e, "file_scan_page_first", setDragActiveFirst, dragCounterFirst)}
                    >
                        <input
                            ref={fileInputFirstRef}
                            className={styles.uploadBlock__fileInput}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => handleFileChange(e, "file_scan_page_first")}
                        />
                        <div className={styles.uploadBlock__content}>
                            {previewFirst && <div className={styles.uploadBlock__preview_success}><Icon Svg={SuccessLabel} /></div>}
                            <div className={styles.uploadBlock__preview}>
                                {/* Если есть превью и это не pdf */}
                                {previewFirst && !isPdfFirst && (
                                    <img
                                        src={previewFirst}
                                        alt="preview"
                                        style={{ width: 50, height: 35, objectFit: "cover", cursor: "pointer" }}
                                        onClick={toggleFullPreviewFirst}
                                    />
                                )}
                                {/* Если PDF */}
                                {isPdfFirst && (
                                    <Icon Svg={UploadPDFIcon} width={50} height={35} />
                                )}
                                {/* Если нет ничего, показываем иконку загрузки */}
                                {!previewFirst && !isPdfFirst && (
                                    <Icon Svg={UploadIcon} width={50} height={35} />
                                )}
                            </div>

                            <div className={styles.uploadBlock__text}>
                                перенесите изображение или <span>нажмите для загрузки</span> <br />
                                PNG/JPG/PDF, не более 4 Мбайт
                            </div>
                        </div>
                    </div>
                </div>

                {/* Страница регистрации */}
                <div className={styles.uploadBlock__header}>
                    <span className={styles.uploadBlock__headerTitle}>СТРАНИЦА РЕГИСТРАЦИИ: &nbsp;</span>
                    <span className={styles.uploadBlock__headerExample} onClick={(e) => e.preventDefault()}>
                        СМ. ОБРАЗЕЦ
                    </span>
                </div>

                <div className={`${styles.uploadBlock} ${dragActiveReg ? styles.uploadBlock_active : ""}`}>
                    <div
                        className={styles.uploadBlock__dropzone}
                        onClick={handleClickReg}
                        onDragEnter={(e) => handleDragEnter(e, setDragActiveReg, dragCounterReg)}
                        onDragOver={handleDragOver}
                        onDragLeave={(e) => handleDragLeave(e, setDragActiveReg, dragCounterReg)}
                        onDrop={(e) => handleDrop(e, "file_scan_page_registration", setDragActiveReg, dragCounterReg)}
                    >
                        <input
                            ref={fileInputRegRef}
                            className={styles.uploadBlock__fileInput}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={(e) => handleFileChange(e, "file_scan_page_registration")}
                        />
                        <div className={styles.uploadBlock__content}>
                            {previewReg && <div className={styles.uploadBlock__preview_success}><Icon Svg={SuccessLabel} /></div>}
                            <div className={styles.uploadBlock__preview}>

                                {/* Если есть превью и это не pdf */}
                                {previewReg && !isPdfReg && (
                                    <img
                                        src={previewReg}
                                        alt="preview"
                                        style={{ width: 50, height: 35, objectFit: "cover", cursor: "pointer" }}
                                        onClick={toggleFullPreviewReg}
                                    />
                                )}
                                {/* Если PDF */}
                                {isPdfReg && (
                                    <Icon Svg={UploadPDFIcon} width={50} height={35} />
                                )}
                                {/* Если нет ничего, показываем иконку загрузки */}
                                {!previewReg && !isPdfReg && (
                                    <Icon Svg={UploadIcon} width={50} height={35} />
                                )}
                            </div>
                            <div className={styles.uploadBlock__text}>
                                перенесите изображение или <span>нажмите для загрузки</span> <br />
                                PNG/JPG/PDF, не более 4 Мбайт
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                    <Button
                        onClick={() => {
                            // ваш код
                        }}
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={isButtonDisabled}
                    >
                        Продолжить
                    </Button>
                </div>
            </form>
        </>
    );
};
