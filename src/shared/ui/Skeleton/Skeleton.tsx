import React from 'react';
import styles from './Skeleton.module.scss';

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '16px',
    borderRadius = '4px',
    className = '',
}) => {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{
                width,
                height,
                borderRadius,
            }}
        />
    );
};
