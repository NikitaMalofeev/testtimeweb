import {
    useLayoutEffect,
    useRef,
    useState,
    ReactNode,
    CSSProperties,
} from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.scss';

type AnimateHeightWrapperProps = {
    isOpen: boolean;
    children: ReactNode;
    minHeight?: string | number;
    style: CSSProperties
};

const AnimateHeightWrapper: React.FC<AnimateHeightWrapperProps> = ({
    isOpen,
    children,
    minHeight = 500,
    style
}) => {
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = useState<string | number>(minHeight);

    // Считаем высоту ДО кадра, где браузер рисует элемент,
    // чтобы сразу отдать корректное значение motion-div’у
    useLayoutEffect(() => {
        if (contentRef.current) {
            const fullHeight = contentRef.current.scrollHeight + 20;
            setHeight(isOpen ? fullHeight : minHeight);
        }
    }, [isOpen, minHeight]);   // если style меняет габариты, пересчитываем

    return (
        <motion.div
            style={{ width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'end', justifyContent: 'center' }}   // внешний div — как было
            animate={{ height }}
            initial={false}                                 // не нужен стартовый кадр
            transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
            {/* стиль остаётся на контейнере, применяется сразу */}
            <div ref={contentRef} className={styles.container} style={style}>
                {children}
            </div>
        </motion.div>
    );
};

export default AnimateHeightWrapper;
