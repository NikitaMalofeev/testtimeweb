import React, { ReactNode, memo } from 'react';
import ReactDOM from 'react-dom';
import styles from './styles.module.scss';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';
import { ModalAnimation } from 'entities/ui/Ui/slice/uiSlice';

interface ModalProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    animation?: ModalAnimation;
    children: ReactNode;
}

export const Modal = memo(({ className, isOpen, onClose, animation = ModalAnimation.SCALE, children }: ModalProps) => {
    if (!isOpen) return null;

    const mods: Mods = {
        [styles.open]: isOpen,
        [styles[animation]]: true,
    };

    return ReactDOM.createPortal(
        <div className={classNames(styles.Modal, mods, [className])} onClick={onClose}>
            <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
});
