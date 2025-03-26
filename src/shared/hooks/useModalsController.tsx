import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { closeLastModal } from 'entities/ui/Modal/slice/modalSlice';

export const useModalsController = () => {
    const dispatch = useDispatch();
    const modalStack = useSelector((state: RootState) => state.modal.modalStack);
    const isPopstateInProgress = useRef(false);
    // Храним актуальную длину стэка в ref, чтобы обработчик мог её видеть.
    const modalStackRef = useRef(modalStack);
    useEffect(() => {
        modalStackRef.current = modalStack;
    }, [modalStack]);

    // Подписываемся на popstate один раз.
    useEffect(() => {


        const handlePopState = (e: PopStateEvent) => {
            // Если уже обрабатываем popstate - выходим
            if (isPopstateInProgress.current) return;
            isPopstateInProgress.current = true;

            if (modalStackRef.current.length > 0) {
                dispatch(closeLastModal());
                window.history.forward();
            }

            // Через небольшой таймаут снова разрешаем popstate
            setTimeout(() => {
                isPopstateInProgress.current = false;
            }, 50);
        };


        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
        // Ставим только [dispatch] (или []), главное не modalStack
    }, [dispatch]);
};
