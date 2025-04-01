import { useEffect, useState } from 'react';
import AppRouter from './providers/router/ui/AppRouter';
import './styles/index.scss';
import { Header } from 'widgets/Header/ui/Header';
import { Cover } from 'shared/ui/Cover/Cover';
import { ErrorPopup } from 'shared/ui/ErrorPopup/ErrorPopup';
import { useSelector } from 'react-redux';
import { RootState } from './providers/store/config/store';
import { SuccessPopup } from 'shared/ui/SuccessPopup/SuccessPopup';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiskProfileModal } from 'features/RiskProfile/RiskProfileModal/RiskProfileModal';
import { ConfirmInfoModal } from 'features/RiskProfile/ConfirmInfoModal/ConfirmInfoModal';
import { ProblemsCodeModal } from 'features/RiskProfile/ProblemsCodeModal/ProblemsCodeModal';
import { closeModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Footer } from 'shared/ui/Footer/Footer';
import { setUserToken } from 'entities/User/slice/userSlice';
import { getAllMessagesThunk, setUnreadAnswersCount } from 'entities/SupportChat/slice/supportChatSlice';
import { useAuthTokenManagement } from 'shared/hooks/useAuthTokenManager';
import { setError } from 'entities/Error/slice/errorSlice';
import { useModalsController } from 'shared/hooks/useModalsController';
import { useAuthModalsController } from 'shared/hooks/useAuthModalsController';

function App() {
  const modalState = useSelector((state: RootState) => state.modal);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isMainPages = location.pathname === '/lk' || location.pathname === '/';
  const { messages } = useSelector((state: RootState) => state.supportChat);
  const { unreadAnswersCount } = useSelector((state: RootState) => state.supportChat);
  const token = useSelector((state: RootState) => state.user.token);

  useAuthTokenManagement()
  useModalsController()
  useAuthModalsController()

  useEffect(() => {
    const userVh = window.innerHeight / 100;
    document.documentElement.style.setProperty('--vh', `${userVh}px`);
  }, []);

  // Обновляем сообщения в личном кабинете каждые 30 секунд
  useEffect(() => {
    if (location.pathname !== '/' && token) {
      const interval = setInterval(() => {
        // Здесь вызывается getAllMessages для получения полного списка сообщений
        dispatch(getAllMessagesThunk()); // если требуется запрос к getAllMessages, замените на соответствующий thunk
      }, 30000);
      return () => clearInterval(interval);
    }

  }, []);

  // Логика для вычисления количества новых сообщений по сравнению с localStorage
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const storedAnswerCount = Number(localStorage.getItem("chatAnswerCount") || 0);
    const currentAnswerCount = messages.filter((m) => m.is_answer).length;
    const unread = currentAnswerCount > storedAnswerCount ? currentAnswerCount - storedAnswerCount : 0;
    dispatch(setUnreadAnswersCount(unread));
  }, [messages]);

  return (
    <div className='page__wrapper'>
      <div className='page__content'>
        <Header currentNotificationsCount={unreadAnswersCount} />
        <Cover />
        <AppRouter />
      </div>

      {isMainPages && <Footer />}
      <ErrorPopup />
      <SuccessPopup />
      <RiskProfileModal
        isOpen={modalState.identificationModal.isOpen}
        onClose={() => {
          dispatch(closeModal(ModalType.IDENTIFICATION));
        }}
      />
      <ConfirmInfoModal
        isOpen={modalState.confirmCodeModal.isOpen}
        onClose={() => {
          dispatch(closeModal(ModalType.CONFIRM_CODE));
        }}
      />
      <ProblemsCodeModal
        isOpen={modalState.problemWithCodeModal.isOpen}
        onClose={() => {
          dispatch(closeModal(ModalType.PROBLEM_WITH_CODE));
        }}
      />
    </div>
  );
}

export default App;
