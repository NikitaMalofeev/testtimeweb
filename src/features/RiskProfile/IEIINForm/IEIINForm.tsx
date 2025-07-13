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
import {
    openPasportScanWebsocketThunk,
    postINNScanThunk,
} from "entities/RiskProfile/slice/riskProfileSlice";
import {
    Loader,
    LoaderSize,
    LoaderTheme,
} from "shared/ui/Loader/Loader";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import IINExFirst from "shared/assets/images/INExFirst.jpg";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType,
} from "entities/ui/Modal/model/modalTypes";
import { UploadProgressModal } from "features/Ui/UploadProgressModal/UploadProgressModal";
import { getUserDocumentsStateThunk } from "entities/Documents/slice/documentsSlice";
import { setError } from "entities/Error/slice/errorSlice";

export const IEIINForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector(
        (state: RootState) => state.ui.isScrollToBottom
    );
    const loading = useSelector(
        (state: RootState) => state.riskProfile.loading
    );
    const modalState = useSelector((state: RootState) => state.modal.progress);

    /* -------------------------- local state -------------------------- */
    const [preview, setPreview] = useState<string | null>(null);
    const [isPdf, setIsPdf] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isExamplePreviewOpen, setIsExamplePreviewOpen] = useState(false);

    const dragCounter = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* --------------------------- formik ------------------------------ */
    const formik = useFormik({
        initialValues: { file_scan_inn: null as File | null },
        onSubmit: () => { },
    });

    const isButtonDisabled = !formik.values.file_scan_inn;

    /* ------------------------ helpers / handlers --------------------- */
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

    const handleClick = () => fileInputRef.current?.click();

    const updatePreview = (
        file: File,
        setPreviewCb: React.Dispatch<React.SetStateAction<string | null>>,
        setIsPdfCb: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        if (file.type === "application/pdf") {
            setIsPdfCb(true);
            setPreviewCb(null);
        } else {
            setIsPdfCb(false);
            const url = URL.createObjectURL(file);
            setPreviewCb(url);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (file.size > MAX_FILE_SIZE) {
                dispatch(setError("Загруженный файл превышает 5 МБ"));
                return;
            }

            formik.setFieldValue("file_scan_inn", file);
            updatePreview(file, setPreview, setIsPdf);
        }
    };

    /* ------------------------ drag-nd-drop --------------------------- */
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setDragActive(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];

            if (file.size > MAX_FILE_SIZE) {
                dispatch(setError("Загруженный файл превышает 5 МБ"));
                return;
            }

            formik.setFieldValue("file_scan_inn", file);
            updatePreview(file, setPreview, setIsPdf);
        }
    };

    /* -------------------------- modal & send ------------------------- */
    const handleSubmit = async () => {
        dispatch(
            openModal({
                type: ModalType.PROGRESS,
                animation: ModalAnimation.BOTTOM,
                size: ModalSize.MC,
            })
        );
        const formData = new FormData();
        if (formik.values.file_scan_inn)
            formData.append("file_scan_inn", formik.values.file_scan_inn);
        dispatch(
            postINNScanThunk({
                data: formData,
                onSuccess: () => {
                    dispatch(getUserDocumentsStateThunk());
                    setTimeout(() => {
                        closeModal(ModalType.PROGRESS);
                        dispatch(setStepAdditionalMenuUI(4));
                        dispatch(getUserDocumentsStateThunk());
                    }, 2000);
                },
            })
        );
    };

    /* ---------------------------- effects ---------------------------- */
    useEffect(() => {
        dispatch(
            openPasportScanWebsocketThunk({
                onSuccess: () => { },
            })
        );
    }, [dispatch]);

    useEffect(() => {
        if (modalState.isOpen && !loading) {
            dispatch(closeModal(ModalType.PROGRESS));
        }
    }, [modalState.isOpen, loading, dispatch]);

    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview);
        },
        [preview]
    );

    /* ---------------------------- render ----------------------------- */
    return (
        <>
            {/* full preview */}
            {isPreviewOpen && preview && (
                <div
                    className={styles.fullPreviewOverlay}
                    onClick={() => setIsPreviewOpen(false)}
                    style={{ zIndex: 9998 }}
                >
                    <img
                        className={styles.fullPreviewImage}
                        src={preview}
                        alt="Полное превью"
                    />
                </div>
            )}

            {/* example preview */}
            {isExamplePreviewOpen && (
                <div
                    className={styles.fullPreviewOverlay}
                    onClick={() => setIsExamplePreviewOpen(false)}
                    style={{ zIndex: 9997 }}
                >
                    <img
                        className={styles.fullPreviewImage}
                        src={IINExFirst}
                        alt="Пример свидетельства"
                    />
                </div>
            )}

            <form onSubmit={formik.handleSubmit} className={styles.form}>
                <p className={styles.form__title}>
                    Скан/фото свидетельства о постановке на учет российской организации в
                    налоговом органе по месту ее нахождения
                </p>
                <ol className={styles.form__list}>
                    <li className={styles.form__list__item}>Скан документа</li>
                </ol>

                {/* header */}
                <div className={styles.uploadBlock__header}>
                    <span className={styles.uploadBlock__headerTitle}>СКАН ИИН:&nbsp;</span>
                    <span
                        className={styles.uploadBlock__headerExample}
                        onClick={() => setIsExamplePreviewOpen(true)}
                    >
                        СМ. ОБРАЗЕЦ
                    </span>
                </div>

                {/* drop-zone */}
                <div
                    className={`${styles.uploadBlock} ${dragActive ? styles.uploadBlock_active : ""
                        }`}
                >
                    <div
                        className={styles.uploadBlock__dropzone}
                        onClick={handleClick}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            className={styles.uploadBlock__fileInput}
                            type="file"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={handleFileChange}
                        />

                        <div className={styles.uploadBlock__content}>
                            {formik.values.file_scan_inn && (
                                <div className={styles.uploadBlock__preview_success}>
                                    <Icon Svg={SuccessLabel} />
                                </div>
                            )}

                            <div className={styles.uploadBlock__preview}>
                                {preview && !isPdf && (
                                    <img
                                        src={preview}
                                        alt="preview"
                                        style={{
                                            width: 50,
                                            height: 35,
                                            objectFit: "cover",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setIsPreviewOpen(true)}
                                    />
                                )}
                                {isPdf && <Icon Svg={UploadPDFIcon} width={50} height={35} />}
                                {!preview && !isPdf && (
                                    <Icon Svg={UploadIcon} width={50} height={35} />
                                )}
                            </div>

                            <div className={styles.uploadBlock__text}>
                                перенесите изображение или <span>нажмите для загрузки</span>
                                <br />
                                PNG/JPG/PDF, не более 5 МБайт
                            </div>
                        </div>
                    </div>
                </div>

                {/* кнопка */}
                <div
                    className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}
                >
                    <Button
                        onClick={handleSubmit}
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={isButtonDisabled || loading}
                    >
                        {loading ? (
                            <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} />
                        ) : (
                            "Продолжить"
                        )}
                    </Button>
                </div>
            </form>

            {/* модалка прогресса */}
            <UploadProgressModal
                isOpen={modalState.isOpen}
                onClose={() => dispatch(closeModal(ModalType.PROGRESS))}
                processName="Скан ИИН"
                processTitle="Загрузка документа"
                description="Вы можете дождаться загрузки или перейти к следующему шагу"
                buttonTitle="Далее"
                action={() => {
                    closeModal(ModalType.PROGRESS);
                    dispatch(setStepAdditionalMenuUI(4));
                }}
            />
        </>
    );
};
