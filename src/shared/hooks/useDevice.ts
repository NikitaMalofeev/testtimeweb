import { useEffect, useState } from 'react';

const BREAKPOINTS = {
    mobile: [350, 958],   // <= 958 — мобилка
    desktop: [959, 4000], // >= 959 — десктоп (НО только если высота > 650)
} as const;

const MIN_DESKTOP_HEIGHT = 640;

export type Device = 'mobile' | 'desktop';

const pickDevice = (w: number, h: number): Device =>
    w >= BREAKPOINTS.desktop[0] && h > MIN_DESKTOP_HEIGHT ? 'desktop' : 'mobile';

export const useDevice = (): Device => {
    const [device, setDevice] = useState<Device>(() =>
        typeof window === 'undefined' ? 'desktop' : pickDevice(window.innerWidth, window.innerHeight),
    );

    useEffect(() => {
        const onResize = () => {
            const next = pickDevice(window.innerWidth, window.innerHeight);
            if (next !== device) setDevice(next);
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [device]);

    return device;
};
