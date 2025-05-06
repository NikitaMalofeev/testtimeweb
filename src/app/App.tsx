import { useEffect, useLayoutEffect, useState } from 'react';
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
import { getUserPersonalAccountInfoThunk, setUserToken } from 'entities/User/slice/userSlice';
import { closeWebSocketConnection, fetchWebsocketId, getAllMessagesThunk, openWebSocketConnection, setUnreadAnswersCount } from 'entities/SupportChat/slice/supportChatSlice';
import { useAuthTokenManagement } from 'shared/hooks/useAuthTokenManager';
import { setError } from 'entities/Error/slice/errorSlice';
import { useModalsController } from 'shared/hooks/useModalsController';
import { useAuthModalsController } from 'shared/hooks/useAuthModalsController';
import { setScrollToTop } from 'entities/ui/Ui/slice/uiSlice';
import { WarningPopup } from 'features/Ui/WarningPopup/WarningPopup';

function App() {
  const modalState = useSelector((state: RootState) => state.modal);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isMainPages = location.pathname === '/lk' || location.pathname === '/' || location.pathname === '/tariffs';
  const { websocketId, messages, unreadAnswersCount } = useSelector(
    (state: RootState) => state.supportChat
  );
  const { token, userId } = useSelector((state: RootState) => state.user);

  const isNeedScrollToTop = useSelector((state: RootState) => state.ui.isScrollToBottom);

  useAuthTokenManagement();
  useModalsController();
  useAuthModalsController();

  useLayoutEffect(() => {
    const userVh = window.innerHeight;
    document.documentElement.style.setProperty('--vh', `${userVh}px`);
  }, []);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        // 1) Получаем свежий ID
        const id = await dispatch(fetchWebsocketId()).unwrap();

        // 2) Открываем сокет на этот ID (старый внутри закроется сам)
        await dispatch(openWebSocketConnection(id));

        // 3) Подтягиваем историю
        dispatch(getAllMessagesThunk());
      } catch (err) {
        console.error("WebSocket init error:", err);
      }
    })();
  }, [token, userId, dispatch]);
  // // Обновляем сообщения в личном кабинете каждые 30 секунд
  // useEffect(() => {
  //   if (location.pathname !== '/' && token) {
  //     const interval = setInterval(() => {
  //       // Здесь вызывается getAllMessages для получения полного списка сообщений
  //       dispatch(getAllMessagesThunk());
  //     }, 30000);
  //     return () => clearInterval(interval);
  //   }
  // }, [location.pathname, token, dispatch]);

  // useEffect(() => {
  //   const handleLogout = () => {
  //     localStorage.removeItem("savedToken");
  //     localStorage.removeItem("lastExit");
  //     localStorage.removeItem("lastExitSignature");
  //     dispatch(setUserToken(""));
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   };

  //   handleLogout()
  // }, [])

  // Логика для вычисления количества новых сообщений по сравнению с localStorage
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const storedAnswerCount = Number(localStorage.getItem("chatAnswerCount") || 0);
    const currentAnswerCount = messages.filter((m) => m.is_answer).length;
    const unread = currentAnswerCount > storedAnswerCount ? currentAnswerCount - storedAnswerCount : 0;
    dispatch(setUnreadAnswersCount(unread));
  }, [messages, dispatch]);

  useEffect(() => {
    if (isNeedScrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // window.scrollTo({ top: 0 });

      // Ставим обратно false, чтобы не скроллить снова
      // dispatch(setScrollToTop(false));
    }
  }, [isNeedScrollToTop]);

  useEffect(() => {
    dispatch(getUserPersonalAccountInfoThunk());
  }, []);

  return (
    <div className='page__wrapper'>
      <div className='page__content'>
        <Header currentNotificationsCount={unreadAnswersCount} variant='main' />
        <div className="page__scroll">
          <Cover />
          <AppRouter />
          {isMainPages && <Footer />}
        </div>
      </div>


      <ErrorPopup />
      <WarningPopup />
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
