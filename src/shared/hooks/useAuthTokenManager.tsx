import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { setUserToken } from 'entities/User/slice/userSlice';
import { useNavigate } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';
import { useCheckRehydrated } from './useCheckRehydrate';

/**
 * Хук, который:
 *   - При загрузке приложения восстанавливает токен из localStorage (если он валиден и не «протух» >3 минут).
 *   - Отслеживает активность пользователя и если тот неактивен >3 мин — «разлогинивает».
 *   - Синхронизирует token/lastExit/подпись с localStorage, чтобы при обновлении/закрытии вкладки мы могли восстановиться.
 */
export function useAuthTokenManagement() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Считываем из .env (через Vite). Убедитесь, что VITE_RANKS_AUTHTOKEN_LS_KEY реально определён
    const SECRET_KEY = import.meta.env.VITE_RANKS_AUTHTOKEN_LS_KEY as string | undefined;
    const rehydrated = useCheckRehydrated();

    // Токен в Redux. Если пользователь авторизован, он должен быть != ''
    const token = useSelector((state: RootState) => state.user.token);

    // Состояние для «последнего времени активности» (число мс: Date.now())
    const [lastActivity, setLastActivity] = useState<number>(Date.now());

    /**
     * 1) При первом рендере:
     *    - Смотрим в localStorage (savedToken, lastExit, lastExitSignature)
     *    - Валидируем подпись и проверяем, не прошло ли уже >3 минут с последней активности
     *    - Если всё ок, восстанавливаем token и выставляем state lastActivity
     *    - Если нет — чистим всё и сразу отправляем на '/'
     */
    useEffect(() => {
        if (!rehydrated) return;
        const savedToken = localStorage.getItem('savedToken');
        const lastExit = localStorage.getItem('lastExit');
        const lastExitSignature = localStorage.getItem('lastExitSignature');

        if (savedToken && lastExit && lastExitSignature && SECRET_KEY) {
            const expectedSignature = btoa(lastExit + SECRET_KEY);
            const lastExitTime = parseInt(lastExit, 10);
            const now = Date.now();
            dispatch(setUserToken(savedToken));

            // Проверяем, что подпись совпадает и прошло менее 3 минут
            // if (
            //     lastExitSignature === expectedSignature &&
            //     now - lastExitTime <= 10 * 60_000
            // ) {
            //     // Всё ок — восстанавливаем токен
            //     dispatch(setUserToken(savedToken));
            //     // Можно одновременно выставить state, чтобы не считать "активность" с 0
            //     setLastActivity(lastExitTime);
            // } else {
            //     // Что-то не так или 3 мин уже прошли — удаляем всё и выходим

            //     //FIXME Убрал сброс логина пока не закончим mvp
            //     // localStorage.removeItem('savedToken');
            //     // localStorage.removeItem('lastExit');
            //     // localStorage.removeItem('lastExitSignature');

            //     // dispatch(setUserToken(''));
            //     // dispatch(closeAllModals());
            //     // navigate('/');
            // }
        }
        // Если savedToken отсутствует, то ничего не делаем —
        // пользователь просто не авторизован и, возможно, зайдёт на страницу логина.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, rehydrated]);

    /**
     * 2) Отслеживаем активность пользователя (движения мыши, нажатия, клики, скролл).
     *    При любом событии сразу обновляем state lastActivity = Date.now().
     *    Параллельно, если есть токен и SECRET_KEY, пишем свежие данные в localStorage,
     *    чтобы в случае закрытия вкладки у нас было актуальное время выхода.
     */
    useEffect(() => {
        if (!rehydrated) return;
        const handleActivity = () => {
            const now = Date.now();
            setLastActivity(now);

            // При желании можем сразу обновлять localStorage,
            // чтобы "вживую" видеть последнее время.
            if (token && SECRET_KEY) {
                localStorage.setItem('savedToken', token);
                localStorage.setItem('lastExit', now.toString());
                const signature = btoa(now.toString() + SECRET_KEY);
                localStorage.setItem('lastExitSignature', signature);
            }
        };

        // Навешиваем события
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [token, SECRET_KEY, rehydrated]);

    /**
     * 3) Каждые 10 секунд проверяем: если (Date.now() - lastActivity) > 3 мин — разлогин,
     *    иначе — актуализируем localStorage (чтобы при отсутствии активности
     *    в этот момент всё равно была запись).
     */
    useEffect(() => {
        if (!rehydrated) return;
        const interval = setInterval(() => {
            const now = Date.now();

            // Проверяем 3 минуты простоя
            if (now - lastActivity > 10 * 60_000) {
                // Логаутим
                //FIXME Убрал сброс логина пока не закончим mvp
                // localStorage.removeItem('savedToken');
                // localStorage.removeItem('lastExit');
                // localStorage.removeItem('lastExitSignature');

                // dispatch(setUserToken(''));
                // dispatch(closeAllModals());
                // navigate('/');
            } else {
                // Иначе пользователь ещё активен => перезапишем время
                if (token && SECRET_KEY) {
                    localStorage.setItem('savedToken', token);
                    localStorage.setItem('lastExit', lastActivity.toString());
                    const signature = btoa(lastActivity.toString() + SECRET_KEY);
                    localStorage.setItem('lastExitSignature', signature);
                }
            }
        }, 10_000);

        return () => clearInterval(interval);
    }, [lastActivity, token, SECRET_KEY, dispatch, navigate, rehydrated]);

    /**
     * 4) Дополнительная проверка для iOS / Safari: при сворачивании / закрытии вкладки
     *    событие pagehide. На нём тоже сохраним текущее время.
     */
    useEffect(() => {
        if (!rehydrated) return;
        const handlePageHide = () => {
            if (token && SECRET_KEY) {
                const now = Date.now();
                localStorage.setItem('savedToken', token);
                localStorage.setItem('lastExit', now.toString());
                const signature = btoa(now.toString() + SECRET_KEY);
                localStorage.setItem('lastExitSignature', signature);
            }
        };

        window.addEventListener('pagehide', handlePageHide);
        return () => {
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [token, SECRET_KEY, rehydrated]);

    // Если где-то надо в компоненте показывать, когда была последняя активность:
    return { lastActivity };
}
