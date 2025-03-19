// entities/PersonalAccount/PersonalAccountMenu.tsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { setCurrentTab } from "entities/PersonalAccount/slice/personalAccountSlice";
import styles from "./styles.module.scss";
import { PersonalAccountItem } from "entities/PersonalAccount/types/personalAccountTypes";
import { Icon } from "shared/ui/Icon/Icon";
import AccountDocumentIcon from "shared/assets/svg/AccountDocumentIcon.svg";
import AccountBalanceIcon from "shared/assets/svg/AccountBalanceIcon.svg";
import AccountIIRIcon from "shared/assets/svg/AccountIIRIcon.svg";
import AccountLogoutIcon from "shared/assets/svg/AccountLogoutIcon.svg";
import AccountNotificationIcon from "shared/assets/svg/AccountNotificationIcon.svg";
import AccountSettingsIcon from "shared/assets/svg/AccountSettingsIcon.svg";
import AccountTarifsIcon from "shared/assets/svg/AccountTarifsIcon.svg";
import AccountPhoneIcon from "shared/assets/svg/AccountPhoneIcon.svg";
import AccountMailIcon from "shared/assets/svg/AccountMailIcon.svg";
import AccountChatIcon from "shared/assets/svg/AccountChatIcon.svg";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { getUserPersonalAccountInfoThunk, setUserToken } from "entities/User/slice/userSlice";
import { useNavigate } from "react-router-dom";
import { Loader } from "shared/ui/Loader/Loader";
import { PushNotification } from "features/PushNotifications/PushNotification/PushNotification";
import { RiskProfileModal } from "features/RiskProfile/RiskProfileModal/RiskProfileModal";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import WarningIcon from "shared/assets/svg/Warning.svg";
import {
    getAllMessagesThunk,
    incrementNewAnswersCount,
    resetPersonalNewAnswers
} from "entities/SupportChat/slice/supportChatSlice";

const PersonalAccountMenu: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const token = useSelector((state: RootState) => state.user.token);
    const modalRPState = useSelector((state: RootState) => state.modal.identificationModal);
    const { userDocuments } = useSelector((state: RootState) => state.documents);
    const { messages, personalNewAnswersCount } = useSelector((state: RootState) => state.supportChat);
    const { userPersonalAccountInfo, loading } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        dispatch(getUserPersonalAccountInfoThunk());
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [token, dispatch]);

    // Обновляем сообщения в личном кабинете каждую секунду
    useEffect(() => {
        const interval = setInterval(() => {
            dispatch(getAllMessagesThunk());
        }, 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    // Логика для вычисления разницы новых сообщений по сравнению с localStorage
    useEffect(() => {
        if (!messages || messages.length === 0) return;
        const oldCount = Number(localStorage.getItem("answerCount") || 0);
        const currentAnswers = messages.filter((m) => m.is_answer);
        const newCount = currentAnswers.length;
        const difference = newCount - oldCount;
        if (difference > 0) {
            dispatch(incrementNewAnswersCount(difference));
            localStorage.setItem("answerCount", String(newCount));
        }
    }, [messages, dispatch]);

    const handleLogout = () => {
        localStorage.removeItem("savedToken");
        localStorage.removeItem("lastExit");
        localStorage.removeItem("lastExitSignature");
        dispatch(setUserToken(""));
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const items: PersonalAccountItem[] = [
        {
            icon: AccountDocumentIcon,
            title: "Документы",
            route: "/documents",
            notificationsCount: 6,
            iconWidth: 23,
            iconHeight: 28,
            warningMessage: (
                <div className={styles.warning}>
                    <Icon Svg={WarningIcon} width={16} height={16} />
                    Есть неподписанные документы ({6 - userDocuments.length} шт.)
                </div>
            ),
        },
        {
            icon: AccountChatIcon,
            title: "Чат поддержки",
            action: () => {
                navigate("/support");
                dispatch(resetPersonalNewAnswers());
            },
            iconWidth: 28,
            iconHeight: 28,
            notificationsCount: personalNewAnswersCount,
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

    if (loading || !userPersonalAccountInfo?.first_name) {
        return <Loader />;
    }

    return (
        <>
            <div className={styles.page}>
                <PushNotification />
                <div className={styles.page__container}>
                    <div>
                        {userPersonalAccountInfo?.tariff_is_active ? (
                            <div className={styles.page__status_active}>активна</div>
                        ) : (
                            <div className={styles.page__status_inactive}>остановлена</div>
                        )}
                    </div>
                    <h2 className={styles.page__title}>Учетная запись</h2>
                    <div className={styles.page__info}>
                        <div className={styles.page__avatar}>
                            {userPersonalAccountInfo?.first_name[0]}
                            {userPersonalAccountInfo?.last_name[0]}
                        </div>
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
                                style={{
                                    ...(item.title !== "Документы" &&
                                        item.title !== "Чат поддержки" &&
                                        item.title !== "Выйти из учетной записи" && {
                                        opacity: "0.5",
                                    }),
                                    ...(item.warningMessage && { padding: "18px 0 34px" }),
                                }}
                                onClick={() => {
                                    if (item.route) {
                                        navigate(item.route);
                                    } else if (item.action) {
                                        item.action();
                                    }
                                }}
                                className={styles.menu__item}
                            >
                                <Icon
                                    Svg={item.icon}
                                    width={item.iconWidth}
                                    height={item.iconHeight}
                                />
                                <span>{item.title}</span>
                                {item.notificationsCount !== undefined && (
                                    <div className={styles.page__count}>
                                        {item.notificationsCount}
                                    </div>
                                )}
                                {item.warningMessage}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <RiskProfileModal
                isOpen={modalRPState.isOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.IDENTIFICATION));
                }}
            />
        </>
    );
};

export default PersonalAccountMenu;
