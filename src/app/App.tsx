import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { setPushNotificationActive, setScrollToTop, setWarning } from 'entities/ui/Ui/slice/uiSlice';
import { WarningPopup } from 'features/Ui/WarningPopup/WarningPopup';
import { getAllUserTariffsThunk } from 'entities/Payments/slice/paymentsSlice';
import { deleteUserTariffs } from 'entities/User/api/userApi';
import { Loader } from 'shared/ui/Loader/Loader';
import { useVhFix } from 'shared/hooks/useVhFix';
import { getAllNotificationsThunk, selectNotifications, updateAllNotificationsThunk } from 'entities/Notification/slice/notificationSlice';
import { NotificationPopup } from 'features/Ui/NotificationPopup/NotificationPopup';
import { updateAllNotifications } from 'entities/Notification/api/notificationApi';

function App() {
  const modalState = useSelector((state: RootState) => state.modal);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isMainPages = location.pathname === '/lk' || location.pathname === '/' || location.pathname === '/tariffs';
  const { websocketId, messages, unreadAnswersCount } = useSelector(
    (state: RootState) => state.supportChat
  );
  const { filledRiskProfileChapters, brokerIds } = useSelector((state: RootState) => state.documents);
  const notifications = useSelector((state: RootState) => selectNotifications(state));
  const { token, userId } = useSelector((state: RootState) => state.user);

  const isNeedScrollToTop = useSelector((state: RootState) => state.ui.isScrollToBottom);
  const allNotificationsCount = notifications.filter((item) => !item.is_read).length;
  useVhFix()
  useAuthTokenManagement();
  useModalsController();
  useAuthModalsController();

  // Убрано - useVhFix уже устанавливает --app-vh и следит за изменениями

  // ПЕРВЫЙ ЗАПРОС: Загружаем данные пользователя сразу при наличии токена
  useEffect(() => {
    if (token) {
      dispatch(getUserPersonalAccountInfoThunk());
      dispatch(getAllUserTariffsThunk({ onSuccess: () => { } }))
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (!token) {
      console.log("WebSocket init: No token available, closing connection");
      dispatch(closeWebSocketConnection());
      return;
    }

    console.log("WebSocket init: Starting connection process");

    (async () => {
      try {
        // 1) Получаем свежий ID
        console.log("WebSocket init: Fetching websocket ID");
        const id = await dispatch(fetchWebsocketId()).unwrap();
        console.log("WebSocket init: Received websocket ID:", id);

        // 2) Открываем сокет на этот ID (старый внутри закроется сам)
        console.log("WebSocket init: Opening connection");
        await dispatch(openWebSocketConnection(id));
        console.log("WebSocket init: Connection opened successfully");

        // 3) Подтягиваем историю
        console.log("WebSocket init: Fetching message history");
        dispatch(getAllMessagesThunk());
      } catch (err) {
        console.error("WebSocket init error:", err);
      }
    })();

    // Cleanup функция для закрытия WebSocket при размонтировании
    return () => {
      console.log("WebSocket cleanup: Closing connection");
      dispatch(closeWebSocketConnection());
    };
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNeedScrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // window.scrollTo({ top: 0 });

      // Ставим обратно false, чтобы не скроллить снова
      // dispatch(setScrollToTop(false));
    }
  }, [isNeedScrollToTop]);

  useEffect(() => {
    dispatch(getAllNotificationsThunk({
      status: 'notif_info',
      is_active: true,
      is_read: false,
    }));
  }, [filledRiskProfileChapters.is_exist_scan_passport, filledRiskProfileChapters.is_complete_person_legal, brokerIds])

  useLayoutEffect(() => {
    if (location.pathname === '/lk') {
      const node = scrollRef.current;
      if (!node) return;

      const prev = node.style.scrollBehavior;
      node.style.scrollBehavior = 'auto';
      node.scrollTop = 0;
      node.style.scrollBehavior = prev;
    }
  }, [location.pathname]);

  const handleResetTariffs = async () => {
    const res = await deleteUserTariffs(token)
  }

  return (
    <div className='page__wrapper'>
      <Cover />
      <div className='page__content'>
        <Header currentNotificationsCount={allNotificationsCount} variant='main' />
        <div className="page__scroll" ref={scrollRef}>
          <div className="page__scroll-content">
            {/* <button onClick={handleResetTariffs}>reset</button> */}
            <AppRouter />
          </div>
          {isMainPages && <Footer />}
        </div>
      </div>


      <ErrorPopup />
      <WarningPopup />
      <NotificationPopup />
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
