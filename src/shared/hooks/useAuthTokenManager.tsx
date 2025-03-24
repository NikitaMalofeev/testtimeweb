// src/hooks/useAuthTokenManagement.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { setUserToken } from 'entities/User/slice/userSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';

export function useAuthTokenManagement() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const SECRET_KEY = import.meta.env.VITE_RANKS_AUTHTOKEN_LS_KEY;
    const token = useSelector((state: RootState) => state.user.token);
    const location = useLocation()
    const savedToken = localStorage.getItem('savedToken');
    // Состояние для отслеживания последней активности пользователя
    const [lastActivity, setLastActivity] = useState<number>(Date.now());

    // 1. При инициализации проверяем сохранённые данные в localStorage и валидируем их
    useEffect(() => {

        const lastExit = localStorage.getItem('lastExit');
        const lastExitSignature = localStorage.getItem('lastExitSignature');

        if (savedToken && lastExit && lastExitSignature) {
            const expectedSignature = btoa(lastExit + SECRET_KEY);
            const lastExitTime = parseInt(lastExit, 10);
            const now = Date.now();

            if (lastExitSignature === expectedSignature && now - lastExitTime <= 3 * 60 * 1000) {
                dispatch(setUserToken(savedToken));
            } else {
                localStorage.removeItem('savedToken');
                localStorage.removeItem('lastExit');
                localStorage.removeItem('lastExitSignature');
                dispatch(setUserToken(''));
                dispatch(closeAllModals())
                navigate('/')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [SECRET_KEY, savedToken]);

    // 2. Отслеживаем активность пользователя и обновляем lastActivity
    useEffect(() => {
        const handleActivity = () => {
            setLastActivity(Date.now());
        };

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
    }, []);

    //  Периодически проверяем, не прошло ли более 0.5 минуты бездействия,
    // и обновляем localStorage, либо очищаем данные и сбрасываем Redux‑токен.
    useEffect(() => {
        const checkToken = () => {
            const now = Date.now();
            if (now - lastActivity > 3 * 60 * 1000) {
                localStorage.removeItem('savedToken');
                localStorage.removeItem('lastExit');
                localStorage.removeItem('lastExitSignature');
                dispatch(setUserToken(''));
                dispatch(closeAllModals())
                navigate('/')
            } else {
                if (token) {
                    localStorage.setItem('savedToken', token);
                    localStorage.setItem('lastExit', lastActivity.toString());
                    const signature = btoa(lastActivity.toString() + SECRET_KEY);
                    localStorage.setItem('lastExitSignature', signature);
                } else {
                    localStorage.removeItem('savedToken');
                    localStorage.removeItem('lastExit');
                    localStorage.removeItem('lastExitSignature');
                }
            }
        };

        // Вызываем функцию сразу при изменении токена или других зависимостей
        checkToken();

        // И запускаем интервал для последующих проверок
        const interval = setInterval(checkToken, 30000);

        return () => clearInterval(interval);
    }, [lastActivity, token, SECRET_KEY]);


    // 4. Дополнительная гарантия для iOS — сохраняем данные при событии pagehide
    useEffect(() => {
        const handlePageHide = () => {
            if (token) {
                const now = Date.now();
                localStorage.setItem('savedToken', token);
                localStorage.setItem('lastExit', now.toString());
                const signature = btoa(now.toString() + SECRET_KEY);
                localStorage.setItem('lastExitSignature', signature);
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, [token, SECRET_KEY]);

    return { lastActivity };
}
