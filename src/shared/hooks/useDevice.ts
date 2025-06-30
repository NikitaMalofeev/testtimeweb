import { useEffect, useState } from 'react';

const BREAKPOINTS = {
    mobile: [350, 1023],
    tablet: [680, 1023],
    desktop: [1024, 4000],
} as const;

type Device = keyof typeof BREAKPOINTS;

/** Определяем, к какому диапазону сейчас относится ширина */
const pickDevice = (width: number): Device => {
    if (width >= BREAKPOINTS.mobile[0] && width <= BREAKPOINTS.mobile[1]) return 'mobile';
    if (width >= BREAKPOINTS.tablet[0] && width <= BREAKPOINTS.tablet[1]) return 'tablet';
    return 'desktop'; // всё, что ≥1024 px
};

/**
 * Хук возвращает строку **'mobile' | 'tablet' | 'desktop'**  
 * и автоматически обновляется при ресайзе окна
 */
export const useDevice = (): Device => {
    // При SSR fallback-значение -- 'desktop'
    const [device, setDevice] = useState<Device>(() =>
        typeof window === 'undefined' ? 'desktop' : pickDevice(window.innerWidth),
    );

    useEffect(() => {
        const onResize = () => {
            const next = pickDevice(window.innerWidth);
            setDevice(prev => (prev === next ? prev : next));
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return device;
};
