import { useEffect, useState } from 'react'

import AppRouter from './providers/router/ui/AppRouter'
import './styles/index.scss'
import { Header } from 'widgets/Header/ui/Header'
import { Cover } from 'shared/ui/Cover/Cover'
import { ErrorPopup } from 'shared/ui/ErrorPopup/ErrorPopup'
import { useSelector } from 'react-redux'
import { RootState } from './providers/store/config/store'
import { Tooltip } from 'shared/ui/Tooltip/Tooltip'
import { SuccessPopup } from 'shared/ui/SuccessPopup/SuccessPopup'
import { useLocation, useNavigate } from 'react-router-dom'
import { RiskProfileModal } from 'features/RiskProfile/RiskProfileModal/RiskProfileModal'
import { ConfirmInfoModal } from 'features/RiskProfile/ConfirmInfoModal/ConfirmInfoModal'
import { ProblemsCodeModal } from 'features/RiskProfile/ProblemsCodeModal/ProblemsCodeModal'
import { StateSchema } from './providers/store/config/StateSchema'
import { closeModal } from 'entities/ui/Modal/slice/modalSlice'
import { ModalType } from 'entities/ui/Modal/model/modalTypes'
import { useAppDispatch } from 'shared/hooks/useAppDispatch'
import { Footer } from 'shared/ui/Footer/Footer'

function App() {

  const { token, is_active } = useSelector((state: RootState) => state.user)
  const navigate = useNavigate()
  const modalState = useSelector((state: StateSchema) => state.modal);
  const dispatch = useAppDispatch()
  const location = useLocation()

  const isMainPages = location.pathname === '/lk' || location.pathname === '/'

  useEffect(() => {
    if (!token) {
      navigate('/')
    } else if (token) {
      navigate('/lk')
    }
  }, [token])

  useEffect(() => {
    const userVh = window.innerHeight / 100
    document.documentElement.style.setProperty('--vh', `${userVh}px`)
  }, [])

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


      {/* FIXME Перенести в компоненты где используются */}
      {/* Модальные окна */}
      <RiskProfileModal isOpen={modalState.identificationModal.isOpen} onClose={() => {
        dispatch(closeModal(ModalType.IDENTIFICATION));
      }} />
      <ConfirmInfoModal isOpen={modalState.confirmCodeModal.isOpen} onClose={() => {
        dispatch(closeModal(ModalType.CONFIRM_CODE));
      }} />
      <ProblemsCodeModal isOpen={modalState.problemWithCodeModal.isOpen} onClose={() => {
        dispatch(closeModal(ModalType.PROBLEM_WITH_CODE));
      }} />
    </div>
  )
}

export default App
