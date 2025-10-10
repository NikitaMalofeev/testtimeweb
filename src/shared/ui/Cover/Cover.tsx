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

// Loading Cover - просто голубой фон пока грузятся данные
const CoverLoading = () => {
    return (
        <div className={styles.Cover_vip}>
            {/* Просто синий фон, без контента */}
        </div>
    );
};

// VIP Cover компонент
const CoverVIP = ({ onLoadComplete }: { onLoadComplete: () => void }) => {
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        let hideTimer: ReturnType<typeof setTimeout>;
        if (isImageLoaded) {
            hideTimer = setTimeout(() => onLoadComplete(), 800);
        }
        return () => clearTimeout(hideTimer);
    }, [isImageLoaded, onLoadComplete]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="cover-vip"
                className={styles.Cover_vip}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
                <img
                    src={VIPCoverLayer}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: isImageLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                    onLoad={() => setIsImageLoaded(true)}
                    alt=""
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
        </AnimatePresence>
    );
};

// Обычный Cover компонент
const CoverDefault = ({ onLoadComplete }: { onLoadComplete: () => void }) => {
    useEffect(() => {
        const hideTimer = setTimeout(() => onLoadComplete(), 800);
        return () => clearTimeout(hideTimer);
    }, [onLoadComplete]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="cover-default"
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
        </AnimatePresence>
    );
};

export const Cover = () => {
    const [isMounted, setIsMounted] = useState(true);
    const [isDataReady, setIsDataReady] = useState(false);
    const isVipUser = useSelector((s: RootState) => s.user.is_vip);
    const token = useSelector((s: RootState) => s.user.token);
    const userPersonalAccountInfo = useSelector((s: RootState) => s.user.userPersonalAccountInfo);

    // ⬇️ Проверяем, готовы ли данные пользователя
    useEffect(() => {
        if (!token) {
            // Нет токена = не авторизован = данные готовы (показываем обычный Cover)
            setIsDataReady(true);
        } else if (token && userPersonalAccountInfo) {
            // Есть токен и данные загружены = данные готовы (показываем VIP или обычный)
            setIsDataReady(true);
        }
    }, [token, userPersonalAccountInfo]);

    const handleLoadComplete = () => {
        setIsMounted(false);
    };

    // Скрываем Cover когда isMounted = false
    if (!isMounted) {
        return null;
    }

    // Пока данные не готовы - показываем Loading Cover (просто синий фон)
    if (!isDataReady) {
        return <CoverLoading />;
    }

    // Когда данные готовы - рендерим ТОЛЬКО нужный вариант Cover
    if (isVipUser) {
        return <CoverVIP onLoadComplete={handleLoadComplete} />;
    }

    return <CoverDefault onLoadComplete={handleLoadComplete} />;
};
