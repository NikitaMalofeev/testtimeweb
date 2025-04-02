import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';
import { useAppDispatch } from './useAppDispatch';
import { useLocation } from 'react-router-dom';

export const useAuthModalsController = () => {
    const dispatch = useAppDispatch();
    const token = useSelector((state: RootState) => state.user.token);
    const tokenLS = localStorage.getItem('savedToken');

    useEffect(() => {
        if (!token && !tokenLS) {
            dispatch(closeAllModals());
        }
    }, [token, tokenLS, dispatch]);
};
