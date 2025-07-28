// Header.jsx

import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import HeaderIcon from 'shared/assets/svg/headerLogo.svg';
import AccountIcon from 'shared/assets/svg/AccountIcon.svg';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';
import { setError } from 'entities/Error/slice/errorSlice';
import PhoneIcon from 'shared/assets/svg/phone.svg'
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import { setUserToken } from 'entities/User/slice/userSlice';

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
        localStorage.removeItem("savedToken");
        localStorage.removeItem("lastExit");
        localStorage.removeItem("lastExitSignature");
        dispatch(setUserToken(""));
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
            <Icon Svg={HeaderIcon} width={171} height={18.5} onClick={() => navigate('/')} />
            {!haveUser
                ?
                <div className={styles.header__entry}>
                    {/* <div className={styles.header__contacts} >
                        <Icon Svg={PhoneIcon} width={24} height={24} />
                        <a href="tel:+78432126778">+7 843 212 67 78</a>
                    </div> */}
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        children='Чат поддержки'
                        padding='10px 22px'
                        className={styles.header__button}
                        onClick={() => navigate('/support')}
                    />
                    {/* <Button
                        theme={ButtonTheme.UNDERLINE}
                        children='Подключиться'
                        padding='10px 22px'
                        className={styles.header__button}
                    // onClick={() => navigate('/auth')} 
                    /> */}
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
                <div className={styles.header__account} onClick={() => {
                    navigate('/lk')

                    //костыль потом исправить FIXME
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.width = "";
                    document.documentElement.style.overflow = "";
                    dispatch(closeAllModals())

                }}>
                    {currentNotificationsCount ? <div className={styles.header__notifications}>{currentNotificationsCount}</div> : <span className={styles.header__notifications_empty}>Нет новых уведомлений</span>}
                    <Icon Svg={AccountIcon} width={24} height={24} />
                </div>}
            {/* <div onClick={handleLogout}>Выйти</div> */}
        </header>
    );
};
