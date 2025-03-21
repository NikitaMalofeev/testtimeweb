import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import styles from "./styles.module.scss";
import MiniLogo from "shared/assets/images/miniLogo.png";
import { setPushNotificationActive, setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { getUserDocumentsNotSignedThunk, getUserDocumentsStateThunk } from "entities/Documents/slice/documentsSlice";
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";



export const PushNotification = () => {
    const { active, purpose } = useSelector((state: RootState) => state.ui.isPushNotificationActive);
    const variants = {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
    };
    const dispatch = useAppDispatch()
    const { filledRiskProfileChapters, loading } = useSelector((state: RootState) => state.documents)

    const pushPurpose: { [key: string]: { title: string; description: string, action: () => void } } = {
        filledRP: {
            title: "Необходимо заполнить “анкету РП”",
            description: "Найти “анкету РП” для подписания можно в разделе “Документы”",
            action: () => {
                dispatch(setStepAdditionalMenuUI(0));
                dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }));
            }
        },
        // anotherPurpose: {
        //     title: "Другое уведомление",
        //     description: "Это описание для другого уведомления.",
        //     action: () => {

        //     }
        // },
        // default: {
        //     title: "Уведомление",
        //     description: "Описание уведомления по умолчанию.",
        //     action: () => {

        //     }
        // },
    };

    useEffect(() => {
        if (!filledRiskProfileChapters.is_risk_profile_complete_final) {
            dispatch(setPushNotificationActive({ active: true, purpose: 'filledRP' }));
        } else {
            dispatch(setPushNotificationActive({ active: false, purpose: '' }));
        }
    }, [filledRiskProfileChapters]);

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
    }, []);

    const purposeData = pushPurpose[purpose] || pushPurpose.default;

    if (loading) {
        return
    } else
        return (
            <>
                {
                    purpose.length > 0 && (
                        <motion.div
                            initial="hidden"
                            animate={active ? variants.visible : variants.hidden}
                            variants={variants}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className={styles.pushNotification}
                            onClick={purposeData.action}
                        >
                            <img src={MiniLogo} alt="Mini Logo" className={styles.pushNotification__logo} />
                            <div>
                                <h3 className={styles.pushNotification__title}>{purposeData.title}</h3>
                                <p className={styles.pushNotification__description}>{purposeData.description}</p>
                            </div>
                        </motion.div>
                    )
                }
            </>
        );
};
