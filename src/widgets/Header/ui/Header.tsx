// Header.jsx

import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import HeaderIcon from 'shared/assets/svg/headerLogo.svg';
import AccountIcon from 'shared/assets/svg/AccountIcon.svg';
import SupportChatIcon from 'shared/assets/svg/supportChatBlue.svg';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';
import { setError } from 'entities/Error/slice/errorSlice';
import PhoneIcon from 'shared/assets/svg/phone.svg'
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import { logoutUser } from 'entities/User/slice/userSlice';

interface HeaderProps {
    currentNotificationsCount?: number;
    variant: 'main' | 'fallback';
}

export const Header = ({ currentNotificationsCount, variant }: HeaderProps) => {
    if (variant === 'fallback') {
        return (
            <header className={styles.header}>
                <Icon Svg={HeaderIcon} width={171} height={18.5} />
            </header>
        );
    }

    const handleLogout = () => {
        dispatch(logoutUser() as any);
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const location = useLocation()

    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const modalState = useSelector((state: RootState) => state.modal.identificationModal)
    const haveUser = useSelector((state: RootState) => state.user.token)

    // useEffect(() => {
    //     if (!token) {
    //         navigate('/')
    //     } else if (token && !modalState.isOpen) {
    //         navigate('/lk')
    //     }
    // }, [token])

    const toggleBurger = () => {
        setIsActive((prev) => !prev);
    };

    const onKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleBurger();
        }
    };

    const burgerMods: Mods = {
        [styles.activeOne]: isActive,
    };
    const headerMods: Mods = {
        [styles.open]: isOpen,
    };


    return (
        <header className={classNames(styles.header, headerMods, [])} style={location.pathname === '/' ? {} : {}}>
            <Icon Svg={HeaderIcon} width={171} height={18.5} onClick={() => navigate('/')} className={styles.header__logo} />
            {!haveUser
                ?
                <div className={styles.header__entry}>
                    {/* Кнопка "Чат поддержки" убрана - доступна только авторизованным пользователям */}
                </div>
                // <div
                //     className={classNames(styles.burger__container, burgerMods, [])}
                //     onClick={toggleBurger}
                //     aria-label="Меню"
                //     role="button"
                //     tabIndex={0}
                //     onKeyPress={onKeyPress}
                // >
                //     <div className={`${styles.hamburgerOne} ${styles.hamburger}`}></div>
                // </div>
                :
                <div className={styles.header__account} >
                    {currentNotificationsCount ? <div className={styles.header__notifications} onClick={() => {
                        dispatch(closeAllModals())
                        navigate('/notifications')


                    }}>{currentNotificationsCount}</div> : <span className={styles.header__notifications_empty}>Нет новых уведомлений</span>}
                    <Icon Svg={AccountIcon} width={24} height={24} pointer onClick={() => {
                        navigate('/lk')

                        //костыль потом исправить FIXME
                        // document.body.style.overflow = "";
                        // document.body.style.position = "";
                        // document.body.style.width = "";
                        // document.documentElement.style.overflow = "";
                        dispatch(closeAllModals())

                    }} />
                </div>}
            {/* <div onClick={handleLogout}>Выйти</div> */}
        </header>
    );
};
