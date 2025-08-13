import React, { ReactElement, ReactNode, memo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';
import styles from './styles.module.scss';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import { Icon } from '../Icon/Icon';
import CloseIcon from 'shared/assets/svg/close.svg';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAnyModalOpen, selectModalState, } from 'entities/ui/Modal/selectors/selectorsModals';
import { setModalScrolled } from 'entities/ui/Modal/slice/modalSlice';
import { RootState } from 'app/providers/store/config/store';
import { useDevice } from 'shared/hooks/useDevice';

interface ModalProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    withCloseIcon?: boolean;
    withTitle?: ReactElement;
    titleWidth?: string;
    animation?: ModalAnimation;
    size?: ModalSize;
    children: ReactNode;
    type: ModalType; // Исправлено с string на ModalType
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
    type,
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();
    const device = useDevice()
    const isDesktop = device !== 'mobile';

    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);
    const isScrolled = useSelector((state: RootState) => selectModalState(state, type)?.isScrolled);
    const additionalOverlayVisibility = useSelector((state: RootState) => state.modal.additionalOverlayVisibility);

    useEffect(() => {
        // // console.log("Modal state changed:", { isOpen, isAnyModalOpen });
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.documentElement.style.overflow = 'hidden';
        }

        return () => {
            if (!isAnyModalOpen) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.documentElement.style.overflow = '';
            }
        };
    }, [isOpen, isAnyModalOpen]);

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
        [styles.ModalOverlay]: size !== ModalSize.FULL && additionalOverlayVisibility,
        [styles.ModalOverlayOpacity]: size !== ModalSize.FULL && !additionalOverlayVisibility,
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
                <div className={`${styles.header} ${isScrolled ? styles.shadow : ''}`}>
                    {withCloseIcon && (
                        <Icon Svg={CloseIcon} className={styles.closeIcon} onClick={onClose} pointer />
                    )}
                    {withTitle && (
                        <h2 className={styles.title} style={{ maxWidth: titleWidth }}>{withTitle}</h2>
                    )}
                </div>
                {children}
            </motion.div>
        </motion.div>,
        modalRoot
    );
});
