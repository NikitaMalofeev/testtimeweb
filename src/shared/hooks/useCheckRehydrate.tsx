import { useState, useEffect } from 'react';
import { persistor } from 'app/providers/store/config/store';

export function useCheckRehydrated() {
    const [rehydrated, setRehydrated] = useState(false);

    useEffect(() => {
        // Если persist уже успел bootstrap (бывает, если это второй раз), 
        // то сразу ставим true:
        if (persistor.getState().bootstrapped) {
            setRehydrated(true);
            return;
        }

        // Если нет, подписываемся
        const unsub = persistor.subscribe(() => {
            const { bootstrapped } = persistor.getState();
            if (bootstrapped) {
                setRehydrated(true);
                unsub();
            }
        });
    }, []);

    return rehydrated;
}
