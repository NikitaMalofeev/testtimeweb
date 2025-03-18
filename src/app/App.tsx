import { useEffect } from 'react';
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

  const lastExitSignature = localStorage.getItem('lastExitSignature');

  // При монтировании проверяем localStorage для восстановления токена
  useEffect(() => {
    if (savedToken && lastExit && lastExitSignature) {
      const expectedSignature = btoa(lastExit + SECRET_KEY);
      const lastExitTime = parseInt(lastExit, 10);
      const now = Date.now();
      // Если прошло не более 2 минут и подпись совпадает, восстанавливаем токен
      if (lastExitSignature === expectedSignature && now - lastExitTime <= 2 * 60 * 1000) {
        dispatch(setUserToken(savedToken));
      } else {
        // Иначе очищаем сохранённые данные и сбрасываем токен
        localStorage.removeItem('savedToken');
        localStorage.removeItem('lastExit');
        localStorage.removeItem('lastExitSignature');
        dispatch(setUserToken(''));
      }
    }
  }, [dispatch, token]);

  // При выгрузке страницы сохраняем токен, время ухода и подпись
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (token) {
        const lastExitTime = Date.now();
        localStorage.setItem('savedToken', token);
        localStorage.setItem('lastExit', lastExitTime.toString());
        const signature = btoa(lastExitTime.toString() + SECRET_KEY);
        localStorage.setItem('lastExitSignature', signature);
      } else {
        localStorage.removeItem('savedToken');
        localStorage.removeItem('lastExit');
        localStorage.removeItem('lastExitSignature');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [token]);

  useEffect(() => {
    if (!token && !savedToken) {
      navigate('/');
    }
  }, [token, navigate, savedToken]);

  useEffect(() => {
    const userVh = window.innerHeight / 100;
    document.documentElement.style.setProperty('--vh', `${userVh}px`);
  }, []);

  return (
    <div className='page__wrapper'>
      <div className='page__content'>
        <Header />
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
