import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Icon } from "shared/ui/Icon/Icon";
import UploadIcon from "shared/assets/svg/UploadIcon.svg";
import UploadPDFIcon from "shared/assets/svg/UploadPDFIcon.svg";
import SuccessLabel from "shared/assets/svg/SuccessLabel.svg";
import styles from "./styles.module.scss";
import { openPasportScanWebsocketThunk, postPasportScanThunk } from "entities/RiskProfile/slice/riskProfileSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import PasportExFirst from 'shared/assets/images/pasportExFirst.jpg'
import PasportExSecond from 'shared/assets/images/pasportExSecond.jpg'
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { UploadProgressModal } from "features/Ui/UploadProgressModal.tsx/UploadProgressModal";
import { getUserDocumentsStateThunk } from "entities/Documents/slice/documentsSlice";
import { setError } from "entities/Error/slice/errorSlice";

export interface PasportScanData {
    file_scan_page_first: null | string;
    file_scan_page_registration: null | string;
}

export const PasportScanForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const loading = useSelector((state: RootState) => state.riskProfile.loading);
    const pasportScanSocketId = useSelector((state: RootState) => state.riskProfile.pasportScanSocketId);
    const [previewFirst, setPreviewFirst] = useState<string | null>(null);
    const [isPdfFirst, setIsPdfFirst] = useState(false);
    const [previewReg, setPreviewReg] = useState<string | null>(null);
    const [isPdfReg, setIsPdfReg] = useState(false);
    const [dragActiveFirst, setDragActiveFirst] = useState(false);
    const [dragActiveReg, setDragActiveReg] = useState(false);
    const [isPreviewOpenFirst, setIsPreviewOpenFirst] = useState(false);
    const [isPreviewOpenReg, setIsPreviewOpenReg] = useState(false);
    // Новые состояния для предпросмотра примеров
    const [isExamplePreviewOpenFirst, setIsExamplePreviewOpenFirst] = useState(false);
    const [isExamplePreviewOpenSecond, setIsExamplePreviewOpenSecond] = useState(false);
    const modalState = useSelector((state: RootState) => state.modal.progress)
    const dragCounterFirst = useRef(0);
    const dragCounterReg = useRef(0);
    const fileInputFirstRef = useRef<HTMLInputElement>(null);
    const fileInputRegRef = useRef<HTMLInputElement>(null);

    const formik = useFormik({
        initialValues: {
            file_scan_page_first: null,
            file_scan_page_registration: null
        },
        onSubmit: (values) => { }
    });

    const isButtonDisabled = !(formik.values.file_scan_page_first && formik.values.file_scan_page_registration);

    const handleClickFirst = () => fileInputFirstRef.current?.click();
    const handleClickReg = () => fileInputRegRef.current?.click();

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ в байтах

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldName: "file_scan_page_first" | "file_scan_page_registration"
    ) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Проверка размера файла
            if (file.size > MAX_FILE_SIZE) {
                dispatch(setError("Загруженный фаил превышает 5 МБ"));
                return; // Прерываем дальнейшую обработку
            }

            formik.setFieldValue(fieldName, file);
            updatePreview(
                file,
                fieldName === "file_scan_page_first" ? setPreviewFirst : setPreviewReg,
                fieldName === "file_scan_page_first" ? setIsPdfFirst : setIsPdfReg
            );
        }
    };


    useEffect(() => {
        if (modalState.isOpen && !loading) {
            dispatch(closeModal(ModalType.PROGRESS))
        }
    }, [modalState.isOpen])

    const handleSubmit = async () => {
        dispatch(openModal({ type: ModalType.PROGRESS, animation: ModalAnimation.BOTTOM, size: ModalSize.MC }))
        const formData = new FormData();
        const fileFirst = formik.values.file_scan_page_first;
        const fileReg = formik.values.file_scan_page_registration;
        if (fileFirst) {
            formData.append("file_scan_page_first", fileFirst);
        }
        if (fileReg) {
            formData.append("file_scan_page_registration", fileReg);
        }
        // dispatch(
        //     postPasportScanThunk({
        //         data: formData,
        //         onSuccess: () => dispatch(setStepAdditionalMenuUI(2))
        //     })
        // );
        dispatch(
            postPasportScanThunk({
                data: formData,
                onSuccess: () => {
                    dispatch(getUserDocumentsStateThunk())
                    setTimeout(() => {
                        closeModal(ModalType.PROGRESS)
                        dispatch(setStepAdditionalMenuUI(4))
                    }, 2000)
                }
            })
        );
    };

    useEffect(() => {
        dispatch(openPasportScanWebsocketThunk({ onSuccess: () => { return } }))
    }, [])

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

    const toggleFullPreviewFirst = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsPreviewOpenFirst((prev) => !prev);
    };

    const toggleFullPreviewReg = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsPreviewOpenReg((prev) => !prev);
    };

    // Функции для предпросмотра примеров
    const toggleExamplePreviewFirst = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsExamplePreviewOpenFirst((prev) => !prev);
    };

    const toggleExamplePreviewSecond = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsExamplePreviewOpenSecond((prev) => !prev);
    };

    useEffect(() => {
        return () => {
            if (previewFirst) {
                URL.revokeObjectURL(previewFirst);
            }
        };
    }, [previewFirst]);

    useEffect(() => {
        return () => {
            if (previewReg) {
                URL.revokeObjectURL(previewReg);
            }
        };
    }, [previewReg]);

    useEffect(() => {
        console.log({
            file_scan_page_first: formik.values.file_scan_page_first,
            file_scan_page_registration: formik.values.file_scan_page_registration
        });
    }, [formik.values]);

    return (
        <>
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
            {/* Отрисовка предпросмотра примеров */}
            {isExamplePreviewOpenFirst && (
                <div
                    className={styles.fullPreviewOverlay}
                    onClick={toggleExamplePreviewFirst}
                    style={{ zIndex: 9997 }}
                >
                    <img
                        className={styles.fullPreviewImage}
                        src={PasportExFirst}
                        alt="Пример первой страницы"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            {isExamplePreviewOpenSecond && (
                <div
                    className={styles.fullPreviewOverlay}
                    onClick={toggleExamplePreviewSecond}
                    style={{ zIndex: 9997 }}
                >
                    <img
                        className={styles.fullPreviewImage}
                        src={PasportExSecond}
                        alt="Пример страницы регистрации"
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
                <div className={styles.uploadBlock__header}>
                    <span className={styles.uploadBlock__headerTitle}>ПЕРВАЯ СТРАНИЦА: &nbsp;</span>
                    <span className={styles.uploadBlock__headerExample} onClick={toggleExamplePreviewFirst}>
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
                            {(previewFirst || formik.values.file_scan_page_first) && (
                                <div className={styles.uploadBlock__preview_success}>
                                    <Icon Svg={SuccessLabel} />
                                </div>
                            )}
                            <div className={styles.uploadBlock__preview}>
                                {previewFirst && !isPdfFirst && (
                                    <img
                                        src={previewFirst}
                                        alt="preview"
                                        style={{ width: 50, height: 35, objectFit: "cover", cursor: "pointer" }}
                                        onClick={toggleFullPreviewFirst}
                                    />
                                )}
                                {isPdfFirst && <Icon Svg={UploadPDFIcon} width={50} height={35} />}
                                {!previewFirst && !isPdfFirst && <Icon Svg={UploadIcon} width={50} height={35} />}
                            </div>
                            <div className={styles.uploadBlock__text}>
                                перенесите изображение или <span>нажмите для загрузки</span> <br />
                                PNG/JPG/PDF, не более 5 Мбайт
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.uploadBlock__header}>
                    <span className={styles.uploadBlock__headerTitle}>СТРАНИЦА РЕГИСТРАЦИИ: &nbsp;</span>
                    <span className={styles.uploadBlock__headerExample} onClick={toggleExamplePreviewSecond}>
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
                            {(previewReg || formik.values.file_scan_page_registration) && (
                                <div className={styles.uploadBlock__preview_success}>
                                    <Icon Svg={SuccessLabel} />
                                </div>
                            )}
                            <div className={styles.uploadBlock__preview}>
                                {previewReg && !isPdfReg && (
                                    <img
                                        src={previewReg}
                                        alt="preview"
                                        style={{ width: 50, height: 35, objectFit: "cover", cursor: "pointer" }}
                                        onClick={toggleFullPreviewReg}
                                    />
                                )}
                                {isPdfReg && <Icon Svg={UploadPDFIcon} width={50} height={35} />}
                                {!previewReg && !isPdfReg && <Icon Svg={UploadIcon} width={50} height={35} />}
                            </div>
                            <div className={styles.uploadBlock__text}>
                                перенесите изображение или <span>нажмите для загрузки</span> <br />
                                PNG/JPG/PDF, не более 5 Мбайт
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                    <Button
                        onClick={handleSubmit}
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={isButtonDisabled || loading}
                    >
                        {loading ? <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} /> : "Продолжить"}
                    </Button>
                </div>
            </form>
            <UploadProgressModal
                isOpen={modalState.isOpen}
                onClose={() => { dispatch(closeModal(ModalType.PROGRESS)) }}
                processName='Сканы паспорта' processTitle="Загрузка документов"
                description="Вы можете дождаться загрузки или перейти к следующему шагу"
                buttonTitle="Далее" action={() => {
                    closeModal(ModalType.PROGRESS)
                    dispatch(setStepAdditionalMenuUI(4))
                }} />
        </>
    );
};
