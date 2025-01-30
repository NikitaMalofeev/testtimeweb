// Header.jsx

import React, { useState, KeyboardEvent } from 'react';
import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import HeaderIcon from 'shared/assets/svg/headerLogo.svg';
import { classNames, Mods } from 'shared/lib/helpers/classNames/classNames';

export const Header = () => {
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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
            <div
                className={classNames(styles.burger__container, burgerMods, [])}
                onClick={toggleBurger}
                aria-label="Меню"
                role="button"
                tabIndex={0}
                onKeyPress={onKeyPress}
            >
                <div className={`${styles.hamburgerOne} ${styles.hamburger}`}></div>
            </div>
        </header>
    );
};
