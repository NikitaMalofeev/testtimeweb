import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import {
    setCurrentTab,
    setMenuItems
} from "entities/PersonalAccount/slice/personalAccountSlice";
import styles from './styles.module.scss'
import { PersonalAccountItem } from "entities/PersonalAccount/types/personalAccountTypes";
import { Icon } from "shared/ui/Icon/Icon";
import AccountDocumentIcon from 'shared/assets/svg/AccountDocumentIcon.svg'
import AccountBalanceIcon from 'shared/assets/svg/AccountBalanceIcon.svg'
import AccountIIRIcon from 'shared/assets/svg/AccountIIRIcon.svg'
import AccountLogoutIcon from 'shared/assets/svg/AccountLogoutIcon.svg'
import AccountNotificationIcon from 'shared/assets/svg/AccountNotificationIcon.svg'
import AccountSettingsIcon from 'shared/assets/svg/AccountSettingsIcon.svg'
import AccountTarifsIcon from 'shared/assets/svg/AccountTarifsIcon.svg'
import AccountPhoneIcon from 'shared/assets/svg/AccountPhoneIcon.svg'
import AccountMailIcon from 'shared/assets/svg/AccountMailIcon.svg'
import AccountChatIcon from 'shared/assets/svg/AccountChatIcon.svg'
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { getUserPersonalAccountInfoThunk, setUserToken } from "entities/User/slice/userSlice";
import { useNavigate } from "react-router-dom";
import { Loader } from "shared/ui/Loader/Loader";

/**
 * Иконки можно подключать по-разному: через svg-спрайт, через иконки из MaterialUI и т.п.
 * Ниже пример условных иконок в виде React-компонентов
 */

const PersonalAccountMenu: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate()

    useEffect(() => {
        dispatch(getUserPersonalAccountInfoThunk())
    }, [])
    const handleLogout = () => {
        // Удаляем данные из localStorage
        localStorage.removeItem('savedToken');
        localStorage.removeItem('lastExit');
        localStorage.removeItem('lastExitSignature');

        // Очищаем токен в Redux
        dispatch(setUserToken(''));

        // Перенаправляем на страницу входа или перезагружаем страницу
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Или можно вызвать: window.location.reload();
    };

    const { currentTab, menuItems } = useSelector((state: RootState) => state.personalAccount);
    const { userPersonalAccountInfo, loading } = useSelector((state: RootState) => state.user)
    /**
     * Пример: создаём массив пунктов меню.
     * Если элементы статичны, это можно сделать и вне компонента. 
     * Если нужно динамическое формирование, делаем прямо здесь, либо в useEffect.
     */
    const items: PersonalAccountItem[] = [
        {
            icon: AccountDocumentIcon,
            title: "Документы",
            route: "/documents",
            notificationsCount: 6,
            iconWidth: 23,
            iconHeight: 28,
        },
        {
            icon: AccountChatIcon,
            title: "Чат поддержки",
            action: () => navigate("/support"),
            iconWidth: 28,
            notificationsCount: 0,
            iconHeight: 28,
        },
        {
            icon: AccountNotificationIcon,
            title: "Уведомления",
            action: () => dispatch(setCurrentTab("notifications")),
            notificationsCount: 0,
            iconWidth: 25,
            iconHeight: 28,
        },
        {
            icon: AccountSettingsIcon,
            title: "Настройки",
            action: () => dispatch(setCurrentTab("settings")),
            iconWidth: 28,
            iconHeight: 28,
        },
        {
            icon: AccountIIRIcon,
            title: "Мои ИИР",
            action: () => dispatch(setCurrentTab("analytics")),
            iconWidth: 23,
            iconHeight: 23,
        },
        {
            icon: AccountBalanceIcon,
            title: "Баланс",
            action: () => dispatch(setCurrentTab("balance")),
            iconWidth: 28,
            iconHeight: 25,
        },
        {
            icon: AccountTarifsIcon,
            title: "Тарифы",
            action: () => dispatch(setCurrentTab("tariffs")),
            iconWidth: 24.54,
            iconHeight: 24.24,
        },
        {
            icon: AccountLogoutIcon,
            title: "Выйти из учетной записи",
            action: () => handleLogout(),
            iconWidth: 21,
            iconHeight: 21,
        },
    ];

    return loading ? <Loader /> : (
        <div className={styles.page}>
            <div className={styles.page__container}>
                <div>{userPersonalAccountInfo?.tariff_is_active ? <div className={styles.page__status_active}>активна</div> : <div className={styles.page__status_inactive}>остановлена</div>}</div>
                <h2 className={styles.page__title}>Учетная запись</h2>
                <div className={styles.page__info}>
                    <div className={styles.page__avatar}>{userPersonalAccountInfo?.first_name[0]}{userPersonalAccountInfo?.last_name[0]}</div>
                    <div className={styles.page__personalInfo}>
                        <div className={styles.page__fio}>
                            <span>{userPersonalAccountInfo?.first_name}</span>
                            <span>{userPersonalAccountInfo?.last_name}</span>
                            <span>{userPersonalAccountInfo?.patronymic}</span>
                        </div>
                        <div className={styles.page__contacts}>
                            <Icon Svg={AccountPhoneIcon} width={16} height={16} />
                            {userPersonalAccountInfo?.phone}
                        </div>
                        <div className={styles.page__contacts}>
                            <Icon Svg={AccountMailIcon} width={16} height={16} />
                            {userPersonalAccountInfo?.email}
                        </div>
                    </div>
                </div>
                <div>
                    {items.map((item, index) => (
                        <div
                            key={index}
                            style={(item.title !== 'Документы' && item.title !== 'Чат поддержки' && item.title !== 'Выйти из учетной записи') ? { opacity: '0.5' } : {}}
                            onClick={() => {
                                if (item.route) {
                                    navigate(item.route);
                                } else if (item.action) {
                                    item.action();
                                }
                            }}
                            className={styles.menu__item}
                        >
                            <Icon Svg={item.icon} width={item.iconWidth} height={item.iconHeight} />
                            <span>{item.title}</span>
                            {item.notificationsCount !== undefined && (
                                <div className={styles.page__count}>
                                    {item.notificationsCount}
                                </div>
                            )}
                        </div>
                    ))}

                </div>
            </div>

        </div>
    );
};

export default PersonalAccountMenu;
