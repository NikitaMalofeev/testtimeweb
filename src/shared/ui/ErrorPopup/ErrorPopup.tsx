import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from './styles.module.scss'



export const ErrorPopup = () => {
    const [visible, setVisible] = useState(false);
    const error = useSelector((state: RootState) => state.error.error)

    useEffect(() => {
        if (error) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(timer);
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
