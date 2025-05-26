import { useEffect, useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.scss'

type AnimateHeightWrapperProps = {
    isOpen: boolean;
    children: ReactNode;
    minHeight?: string;
};

const AnimateHeightWrapper: React.FC<AnimateHeightWrapperProps> = ({
    isOpen,
    children,
    minHeight = '500px'
}) => {
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = useState<string | number>(minHeight);

    useEffect(() => {
        if (isOpen && contentRef.current) {
            const fullHeight = contentRef.current.scrollHeight + 20;
            setHeight(fullHeight);
        } else {
            setHeight(minHeight);
        }
    }, [isOpen, minHeight]);

    return (
        <motion.div
            style={{ width: '100%', overflow: 'hidden' }}
            animate={{ height }}
            transition={{ duration: 0.4, ease: "easeInOut" }}

        >
            <div className={styles.container} ref={contentRef}>{children}</div>

        </motion.div>
    );
};

export default AnimateHeightWrapper;