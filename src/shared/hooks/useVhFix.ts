// useFix100vh.ts
import { useEffect } from 'react';

type Opts = {
    observeBody?: boolean;     // следить за изменением классов body (модалки и т.п.)
};

export function useVhFix(opts: Opts = { observeBody: true }) {
    useEffect(() => {
        let raf = 0;

        const setVH = () => {
            const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
            document.documentElement.style.setProperty('--app-vh', `${h}px`);
        };

        const schedule = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(setVH);
        };

        // первичный расчёт + небольшой повтор (после layout)
        setVH();
        const t = setTimeout(setVH, 50);

        // системные события
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('orientationchange', schedule);
        window.addEventListener('pageshow', schedule);         // возврат из bfcache
        document.addEventListener('visibilitychange', schedule);

        // реальная видимая высота (клавиатура/адрес-бар)
        window.visualViewport?.addEventListener('resize', schedule);

        // клавиатура (Android/iOS иногда не шлют resize окну)
        document.addEventListener('focusin', schedule, true);
        document.addEventListener('focusout', schedule, true);

        // модалки/лок скролла: подстрахуемся без Redux
        let mo: MutationObserver | null = null;
        if (opts.observeBody && document.body) {
            mo = new MutationObserver(schedule);
            mo.observe(document.body, {
                attributes: true,
                attributeFilter: ['class', 'style'],
            });
        }
        //

        return () => {
            clearTimeout(t);
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', schedule as any);
            window.removeEventListener('orientationchange', schedule);
            window.removeEventListener('pageshow', schedule);
            document.removeEventListener('visibilitychange', schedule);
            window.visualViewport?.removeEventListener('resize', schedule);
            document.removeEventListener('focusin', schedule, true);
            document.removeEventListener('focusout', schedule, true);
            mo?.disconnect();
        };
    }, [opts.observeBody]);
}
