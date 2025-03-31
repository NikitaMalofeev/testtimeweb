import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';
import { useAppDispatch } from './useAppDispatch';

export const useAuthModalsController = () => {
    const dispatch = useAppDispatch();
    const token = useSelector((state: RootState) => state.user.token);
    const tokenLS = localStorage.getItem('savedToken');

    useEffect(() => {
        if (!token) {
            dispatch(closeAllModals());
        }
    }, [token, tokenLS, dispatch]);
};
