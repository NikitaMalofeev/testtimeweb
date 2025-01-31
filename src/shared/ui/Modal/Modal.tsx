import React, { ReactNode, memo } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import styles from './styles.module.scss';
import { ModalAnimation } from 'entities/ui/Ui/slice/uiSlice';

interface ModalProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    animation?: ModalAnimation;
    children: ReactNode;
}

export const Modal = memo(({ className, isOpen, onClose, animation = ModalAnimation.LEFT, children }: ModalProps) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <motion.div
            className={styles.Modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
        >
            <motion.div
                className={`${styles.content} ${className}`}
                initial={{ x: animation === ModalAnimation.LEFT ? "100%" : 0 }}
                animate={{ x: 0 }}
                exit={{ x: animation === ModalAnimation.LEFT ? "100%" : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </motion.div>
        </motion.div>,
        document.body
    );
});
