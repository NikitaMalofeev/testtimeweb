import { useEffect, useState } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import CoverIcon from 'shared/assets/svg/Cover.svg';

export const Cover = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Таймер исчезновения через 2.7 секунды
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
        }, 800);

        return () => clearTimeout(hideTimer);
    }, []);

    return (
        <div className={`${styles.Cover} ${!isVisible ? styles.hidden : ''}`}>
            <Icon
                Svg={CoverIcon}
                width="100%"
                height="100%"
                maxWidth={1200}
                maxHeight={1200}
                objectFit="cover"
            />
        </div>
    );
};
