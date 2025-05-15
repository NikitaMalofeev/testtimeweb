import { useEffect, useState } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import CoverIcon from 'shared/assets/svg/Cover.svg';

export const Cover = () => {
    const [isMounted, setIsMounted] = useState(true);

    useEffect(() => {
        // 300 мс — время анимации, 500 мс — “жить” на экране
        const hideTimer = setTimeout(() => setIsMounted(false), 800);
        return () => clearTimeout(hideTimer);
    }, []);

    if (!isMounted) return null;

    return (
        <div className={`${styles.Cover} ${!isMounted ? styles.hidden : ''}`}>
            <Icon
                Svg={CoverIcon}
                width="100%"
                height="100%"
                maxWidth={window.innerWidth}
                maxHeight={window.innerHeight}
                objectFit="cover"
            />
        </div>
    );
};
