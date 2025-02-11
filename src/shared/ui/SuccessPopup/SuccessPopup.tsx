import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from './styles.module.scss'
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";

export const SuccessPopup = () => {
    const { active, message } = useSelector((state: RootState) => state.ui.isTooltipActive)
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (message) {
            dispatch(setTooltipActive({ active: true, message: message }))
            const timer = setTimeout(() => dispatch(setTooltipActive({ active: false, message: '' })), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={active ? { y: 24, opacity: 1 } : { y: -50, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.popup}
        >
            {message}
        </motion.div>
    );
}
