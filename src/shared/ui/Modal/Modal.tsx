// shared/ui/Modal/Modal.tsx
import React, { ReactNode, memo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';
import styles from './styles.module.scss';
import { ModalAnimation, ModalSize } from 'entities/ui/Modal/model/modalTypes';
import { Icon } from '../Icon/Icon';
import CloseIcon from 'shared/assets/svg/close.svg'
import { useSelector } from 'react-redux';
import { selectIsAnyModalOpen } from 'entities/ui/Modal/selectors/selectorsModals';

interface ModalProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    withCloseIcon?: boolean;
    withTitle?: string;
    titleWidth?: string;
    /** Тип анимации (LEFT / BOTTOM) */
    animation?: ModalAnimation;
    /** Размер модалки (FULL / MIDDLE / MINI) */
    size?: ModalSize;
    children: ReactNode;
}

export const Modal = memo(({
    className,
    isOpen,
    onClose,
    withCloseIcon,
    withTitle,
    animation,
    titleWidth,
    size,
    children,
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // 1. Блокируем/разблокируем скролл страницы
    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);

    // Блокируем/разблокируем скролл страницы
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.documentElement.style.overflow = 'hidden';
        }

        return () => {
            // Перед сбросом стилей проверяем, есть ли еще открытые модалки
            if (!isAnyModalOpen) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.documentElement.style.overflow = '';
            }
        };
    }, [isOpen, isAnyModalOpen]);

    // 2. Закрываем модалку по ESC
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

    if (!isOpen) return null;

    // 3. Создаём /modal-root, если его нет
    const modalRoot = document.getElementById('modal-root') || document.createElement('div');
    if (!document.getElementById('modal-root')) {
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
    }

    // 4. Настраиваем анимационные параметры
    //    Для анимации LEFT => x = 100%; BOTTOM => y = 100%
    const initialPosition = animation === ModalAnimation.LEFT
        ? { x: '100%', y: 0 }
        : { x: 0, y: '100%' };

    const exitPosition = animation === ModalAnimation.LEFT
        ? { x: '100%', y: 0 }
        : { x: 0, y: '100%' };

    // 5. Формируем классы через mods

    // Обёртка (фон) — если size === FULL, может быть без затемнения.
    // Если size !== FULL, используем затемняющий фон (Overlay).
    const wrapperMods: Mods = {
        [styles.ModalFull]: size === ModalSize.FULL,
        [styles.ModalOverlay]: size !== ModalSize.FULL,
    };

    const mods: Mods = {
        [styles[size || ModalSize.FULL]]: true,
    };

    return ReactDOM.createPortal(
        <motion.div
            className={classNames('', wrapperMods)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
        >
            <motion.div
                ref={modalRef}
                className={classNames(styles.content, mods, [className])}
                initial={initialPosition}
                animate={{ x: 0, y: 0 }}
                exit={exitPosition}
                transition={{ duration: 0.1, ease: 'linear' }}
                onClick={(e) => e.stopPropagation()}
                style={{ pointerEvents: 'auto' }}
            >
                {withCloseIcon && (
                    <Icon Svg={CloseIcon} className={styles.closeIcon} onClick={onClose} />
                )}
                {withTitle && (
                    <h2 className={styles.title} style={{ maxWidth: `${titleWidth}` }}>{withTitle}</h2>
                )}
                {children}
            </motion.div>
        </motion.div>,
        modalRoot
    );
});
