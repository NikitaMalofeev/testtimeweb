import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from './styles.module.scss'
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setError } from "entities/Error/slice/errorSlice";



export const ErrorPopup = () => {
    const [visible, setVisible] = useState(false);
    const error = useSelector((state: RootState) => state.error.error)
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (error) {
            setVisible(true);

            const hideTimer = setTimeout(() => setVisible(false), 4000);
            const clearErrorTimer = setTimeout(() => dispatch(setError('')), 4500);

            return () => {
                clearTimeout(hideTimer);
                clearTimeout(clearErrorTimer);
            };
        }
    }, [error]);


    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={visible ? { y: 24, opacity: 1 } : { y: -50, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.errorModal}
        >
            {error}
        </motion.div>
    );
}
