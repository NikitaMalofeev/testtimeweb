import React, { memo } from 'react';
import cls from './styles.module.scss';
import { classNames } from 'shared/lib/helpers/classNames/classNames';

export enum IconTheme {
    DEFAULT = 'default',
    CURRENT_FILL = 'currentFill',
}

interface IconProps {
    className?: string;
    Svg?: React.FC<React.SVGProps<SVGSVGElement>> | string;
    theme?: IconTheme;
    width?: number | string;  // Поддержка % и px
    height?: number | string; // Поддержка % и px
    maxWidth?: number; // Ограничение ширины
    maxHeight?: number; // Ограничение высоты
    onClick?: () => void;
    objectFit?: 'contain' | 'cover' | 'fill'; // Контроль за fit
    pointer?: boolean;
}

export const Icon = memo(({
    className,
    Svg,
    theme = IconTheme.DEFAULT,
    width = '100%',
    height = '100%',
    maxWidth,
    maxHeight,
    onClick,
    pointer,
    objectFit = 'contain',
}: IconProps) => {

    if (typeof Svg === 'string') {
        return (
            <img
                src={Svg}
                className={classNames(cls.Icon, {}, [className, cls[theme]])}
                alt="icon"
                style={{
                    width,
                    height,
                    maxWidth,
                    maxHeight,
                    objectFit,
                    cursor: pointer ? 'pointer' : 'default'
                }}
                onClick={onClick}
            />
        );
    }

    if (Svg) {
        return (
            <Svg
                className={classNames(cls.Icon, {}, [className, cls[theme]])}
                width={width}
                height={height}
                style={{
                    maxWidth,
                    maxHeight,
                    objectFit,
                    cursor: pointer ? 'pointer' : 'default'
                }}
                preserveAspectRatio={objectFit === 'cover' ? "none" : "xMidYMid meet"}
            />
        );
    }

    return null;
});
