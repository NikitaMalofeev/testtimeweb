import React, { ReactNode, memo, useEffect, useRef } from 'react';
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
    const modalRef = useRef<HTMLDivElement>(null);

    // 🔹 1. Блокируем/разблокируем скролл страницы
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = ''; // Возвращаем скролл при размонтировании
        };
    }, [isOpen]);

    // 🔹 2. Закрываем модалку при нажатии `Escape`
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // 🔹 3. Фокус остается в модалке
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // 🔹 4. Создаем `modal-root`, если его нет
    const modalRoot = document.getElementById('modal-root') || document.createElement('div');
    if (!document.getElementById('modal-root')) {
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
    }

    return ReactDOM.createPortal(
        <motion.div
            className={styles.Modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
        >
            <motion.div
                ref={modalRef}
                className={`${styles.content} ${className}`}
                initial={{ x: animation === ModalAnimation.LEFT ? "100%" : 0 }}
                animate={{ x: 0 }}
                exit={{ x: animation === ModalAnimation.LEFT ? "100%" : 0 }}
                transition={{ duration: 0.1, ease: "linear" }}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1} // Фокус на модальном окне
            >
                {children}
            </motion.div>
        </motion.div>,
        modalRoot // 🚀 Рендерим в `modal-root`
    );
});
