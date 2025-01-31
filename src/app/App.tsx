import { useEffect, useState } from 'react'

import AppRouter from './providers/router/ui/AppRouter'
import './styles/index.scss'
import { Header } from 'widgets/Header/ui/Header'
import { Cover } from 'shared/ui/Cover/Cover'

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
    </div>
  )
}

export default App
