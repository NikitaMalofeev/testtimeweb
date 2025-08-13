// src/components/PushNotification/PushNotification.tsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import styles from "./styles.module.scss";
import MiniLogo from "shared/assets/images/miniLogo.png";
import { markPushAsOpened, PushNotificationItem } from "entities/ui/PushNotifications/slice/pushSlice";
import { useNavigate } from "react-router-dom";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";

interface PushNotificationProps {
    pushNotifications: PushNotificationItem[]
    activePush: PushNotificationItem | undefined
}

export const PushNotification = ({ pushNotifications, activePush }: PushNotificationProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate()

    useEffect(() => {
        if (activePush && !activePush.hasOpened) {
            dispatch(markPushAsOpened(activePush.id));

        }
        // activePush && // console.log(activePush.id)
    }, [activePush, dispatch]);

    const variants = {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
    };



    if (!activePush) return null;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={variants}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.pushNotification}
            onClick={() => {
                setTimeout(() => { activePush.route && navigate(activePush.route) }, 1000)
                if (activePush.uiStep !== undefined && activePush.uiStep !== null) {
                    if (activePush.route) navigate(activePush.route)
                    dispatch(setStepAdditionalMenuUI(activePush.uiStep));
                    dispatch(openModal({
                        type: ModalType.IDENTIFICATION,
                        animation: ModalAnimation.LEFT,
                        size: ModalSize.FULL,
                    }));
                }
            }}
            style={activePush.id === "startWork" ? { animation: "none" } : {}}
        >
            <img src={MiniLogo} alt="Mini Logo" className={styles.pushNotification__logo} />
            <div>
                <h3 className={styles.pushNotification__title}>{activePush.title}</h3>
                <p className={styles.pushNotification__description}>{activePush.description}</p>
            </div>
        </motion.div>
    );
};
