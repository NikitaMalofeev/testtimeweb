// src/hooks/useAuthTokenManagement.ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { setUserToken } from 'entities/User/slice/userSlice';
import { useNavigate } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';

export function useAuthTokenManagement() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const SECRET_KEY = import.meta.env.VITE_RANKS_AUTHTOKEN_LS_KEY;
    const token = useSelector((state: RootState) => state.user.token);

    // Состояние для отслеживания последней активности пользователя
    const [lastActivity, setLastActivity] = useState<number>(Date.now());

    // 1. При инициализации проверяем сохранённые данные в localStorage и валидируем их
    useEffect(() => {
        const savedToken = localStorage.getItem('savedToken');
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
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, SECRET_KEY]);

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

    // 3. Сохраняем или очищаем данные в localStorage при изменении токена или активности
    useEffect(() => {
        const now = Date.now();
        // Если прошло больше 3 минут бездействия — очищаем данные
        if (now - lastActivity > 3 * 60 * 1000) {
            localStorage.removeItem('savedToken');
            localStorage.removeItem('lastExit');
            localStorage.removeItem('lastExitSignature');
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
    }, [token, lastActivity, SECRET_KEY]);

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

    // 5. Если токена нет ни в Redux, ни в localStorage — перенаправляем на главную страницу
    useEffect(() => {
        const savedToken = localStorage.getItem('savedToken');
        if (!token && !savedToken) {
            navigate('/');
        }
    }, [token, navigate]);

    // По необходимости можно вернуть lastActivity или иную информацию
    return { lastActivity };
}
