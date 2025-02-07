import { useEffect, useState } from 'react'

import AppRouter from './providers/router/ui/AppRouter'
import './styles/index.scss'
import { Header } from 'widgets/Header/ui/Header'
import { Cover } from 'shared/ui/Cover/Cover'
import { ErrorPopup } from 'shared/ui/ErrorPopup/ErrorPopup'
import { useSelector } from 'react-redux'
import { RootState } from './providers/store/config/store'

function App() {

  useEffect(() => {
    const userVh = window.innerHeight / 100
    document.documentElement.style.setProperty('--vh', `${userVh}px`)
  }, [])

  return (
    <div className='page__wrapper'>
      <Header />
      <Cover />
      <AppRouter />
      <ErrorPopup />
    </div>
  )
}

export default App
