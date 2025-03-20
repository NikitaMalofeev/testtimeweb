// Header.jsx

import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import HeaderIcon from 'shared/assets/svg/headerLogo.svg';
import AccountIcon from 'shared/assets/svg/AccountIcon.svg';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';
import { useNavigate } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';

interface HeaderProps {
    currentNotificationsCount: number;
}

export const Header = ({ currentNotificationsCount }: HeaderProps) => {
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { token, is_active } = useSelector((state: RootState) => state.user)
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const modalState = useSelector((state: RootState) => state.modal.identificationModal)

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
        <header className={classNames(styles.header, headerMods, [])}>
            <Icon Svg={HeaderIcon} width={171} height={18.5} />
            {!token
                ?
                <></>
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
                    dispatch(closeAllModals())
                    //костыль потом исправить FIXME
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.width = "";
                    document.documentElement.style.overflow = "";
                    navigate('/lk')

                }}>
                    <div className={styles.header__notifications}>{currentNotificationsCount}</div>
                    <Icon Svg={AccountIcon} width={24} height={24} />
                </div>}

        </header>
    );
};
