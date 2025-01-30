import React, { ButtonHTMLAttributes, memo, ReactNode } from 'react';
import styles from './styles.module.scss';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    square?: boolean;
    disabled?: boolean;
    children?: ReactNode;
    theme?: ButtonTheme;
    buttonForm?: ButtonForm;
}

export enum ButtonForm {
    CIRCLE = 'circle',
}

export enum ButtonTheme {
    BLUE = 'blue',
}

export const Button = memo((props: ButtonProps) => {
    const {
        className,
        children,
        theme = ButtonTheme.BLUE,
        buttonForm = ButtonForm.CIRCLE,
        square = false,
        disabled = false,
        ...otherProps
    } = props;

    const mods: Mods = {
        [styles[theme]]: true,
        [styles[buttonForm]]: true,
    };

    const buttonClasses = [
        styles.Button,
        styles.background,
        styles.size_m,
        styles.partial_bordered,
        className,
        square ? styles.square : '',
        disabled ? styles.disabled : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type="button"
            className={classNames(styles.Button, mods, [className, buttonClasses])} // Исправлено здесь
            disabled={disabled}
            {...otherProps}
        >
            {children}
        </button>
    );
});
