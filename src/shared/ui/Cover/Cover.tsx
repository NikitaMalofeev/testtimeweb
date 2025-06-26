import { useEffect, useState } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import CoverIcon from 'shared/assets/svg/Cover.svg';
import VIPCoverLayer from 'shared/assets/images/VIPCoverLayer.png';
import VIPCoverCrown from 'shared/assets/svg/VIPCoverCrown.svg';
import VIPCoverLogo from 'shared/assets/svg/VIPCoverLogo.svg';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';

/* framer-motion */
import { motion, AnimatePresence } from 'framer-motion';

export const Cover = () => {
    const [isMounted, setIsMounted] = useState(true);
    const isVipUser = useSelector((s: RootState) => s.user.is_vip);

    useEffect(() => {
        /* 300 мс анимация + 500 мс на экране */
        const hideTimer = setTimeout(() => setIsMounted(false), 800);
        return () => clearTimeout(hideTimer);
    }, []);

    /* Вариант для обычного и VIP-пользователей */
    const coverContent = isVipUser ? (
        <motion.div
            key="vip"
            className={styles.Cover_vip}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <Icon
                Svg={VIPCoverLayer}
                width="100%"
                height="100%"
                maxWidth={window.innerWidth}
                maxHeight={window.innerHeight}
                objectFit="cover"
            />
            <div className={styles.Cover_vip__content}>
                <Icon Svg={VIPCoverCrown} width={32} height={32} objectFit="cover" />
                <Icon
                    Svg={VIPCoverLogo}
                    width={249}
                    height={75}
                    maxWidth={window.innerWidth}
                    maxHeight={window.innerHeight}
                    objectFit="cover"
                />
            </div>
        </motion.div>
    ) : (
        <motion.div
            key="default"
            className={styles.Cover}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <Icon
                Svg={CoverIcon}
                width="100%"
                height="100%"
                maxWidth={window.innerWidth}
                maxHeight={window.innerHeight}
                objectFit="cover"
            />
        </motion.div>
    );

    return (
        <AnimatePresence mode="wait">
            {isMounted && coverContent}
        </AnimatePresence>
    );
};
