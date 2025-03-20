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
import { StateSchema } from './providers/store/config/StateSchema';
import { closeModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Footer } from 'shared/ui/Footer/Footer';
import { setUserToken } from 'entities/User/slice/userSlice';
import { getAllMessagesThunk, setUnreadAnswersCount } from 'entities/SupportChat/slice/supportChatSlice';

function App() {
  const { token } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const modalState = useSelector((state: StateSchema) => state.modal);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isMainPages = location.pathname === '/lk' || location.pathname === '/';
  const savedToken = localStorage.getItem('savedToken');
  const lastExit = localStorage.getItem('lastExit');
  const SECRET_KEY = import.meta.env.VITE_RANKS_AUTHTOKEN_LS_KEY;
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const lastExitSignature = localStorage.getItem('lastExitSignature');
  const { messages } = useSelector((state: RootState) => state.supportChat);
  const { userPersonalAccountInfo, loading } = useSelector((state: RootState) => state.user);
  const { unreadAnswersCount } = useSelector((state: RootState) => state.supportChat);

  useEffect(() => {
    const savedToken = localStorage.getItem('savedToken');
    const lastExit = localStorage.getItem('lastExit');
    const lastExitSignature = localStorage.getItem('lastExitSignature');
    if (savedToken && lastExit && lastExitSignature) {
      const expectedSignature = btoa(lastExit + SECRET_KEY);
      const lastExitTime = parseInt(lastExit, 10);
      const now = Date.now();

      if (
        lastExitSignature === expectedSignature &&
        now - lastExitTime <= 3 * 60 * 1000
      ) {
        dispatch(setUserToken(savedToken));
      } else {
        localStorage.removeItem('savedToken');
        localStorage.removeItem('lastExit');
        localStorage.removeItem('lastExitSignature');
        dispatch(setUserToken(''));
      }
    }
  }, []);

  // // 2. Сохраняем в localStorage при каждом изменении token
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

  // 2) Следим за изменениями token и последней активностью
  useEffect(() => {
    const now = Date.now();
    // Если с последнего действия прошло > 2 минут (120000 мс)
    if (now - lastActivity > 3 * 60 * 1000) {
      // ...значит "иначе"-сценарий (превышен лимит бездействия) => сбрасываем localStorage
      localStorage.removeItem('savedToken');
      localStorage.removeItem('lastExit');
      localStorage.removeItem('lastExitSignature');
    } else {
      // Иначе (пользователь активен):
      // Если есть токен, сохраняем его в localStorage с текущим timeStamp
      if (token) {
        localStorage.setItem('savedToken', token);
        localStorage.setItem('lastExit', lastActivity.toString());
        const signature = btoa(lastActivity.toString() + SECRET_KEY);
        localStorage.setItem('lastExitSignature', signature);
      } else {
        // Если токен = пустой (пользователь разлогинен вручную?), всё чистим
        localStorage.removeItem('savedToken');
        localStorage.removeItem('lastExit');
        localStorage.removeItem('lastExitSignature');
      }
    }
  }, [token, lastActivity]);

  // 3.(Опционально) Используем pagehide для доп.гарантии в ios
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
  }, []);

  useEffect(() => {
    if (!token && !savedToken) {
      navigate('/');
    }
  }, [token, navigate, savedToken]);

  useEffect(() => {
    const userVh = window.innerHeight / 100;
    document.documentElement.style.setProperty('--vh', `${userVh}px`);
  }, []);

  //уведомления чата 
  // Обновляем сообщения в личном кабинете каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      // Здесь вызывается getAllMessages для получения полного списка сообщений
      dispatch(getAllMessagesThunk()); // если требуется запрос к getAllMessages, замените на соответствующий thunk
    }, 30000);
    return () => clearInterval(interval);
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
