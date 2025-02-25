import React from 'react';
import styles from './styles.module.scss';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';

export enum LoaderTheme {
    BLUE = 'blue',
    WHITE = 'white',
}

export enum LoaderSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
}

interface LoaderProps {
    theme?: LoaderTheme;
    size?: LoaderSize;
    className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
    theme = LoaderTheme.BLUE,
    size = LoaderSize.MEDIUM,
    className,
}) => {
    const mods: Mods = {
        [styles[theme]]: true,
        [styles[size]]: true,
    };

    return (
        <div className={classNames(styles.spinner__container, mods, [className])}>
            <svg className={styles.spinner} viewBox="25 25 50 50">
                <circle
                    className={styles.path}
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};
