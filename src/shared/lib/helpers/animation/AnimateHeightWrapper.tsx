import { useEffect, useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

type AnimateHeightWrapperProps = {
    isOpen: boolean;
    children: ReactNode;
    minHeight?: string;
};

const AnimateHeightWrapper: React.FC<AnimateHeightWrapperProps> = ({
    isOpen,
    children,
    minHeight = '68vh'
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
            <div ref={contentRef}>{children}</div>

        </motion.div>
    );
};

export default AnimateHeightWrapper;