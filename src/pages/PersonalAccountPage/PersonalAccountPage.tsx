// entities/PersonalAccount/PersonalAccountMenu.tsx
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
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
import AccountBrokerIcon from "shared/assets/svg/AccountBrokerIcon.svg";
import AccountRPIcon from "shared/assets/svg/AccountRPIcon.svg";
import faqBlue from "shared/assets/svg/faqBlue.svg";

import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { getUserPersonalAccountInfoThunk, setUserToken } from "entities/User/slice/userSlice";
import { useNavigate } from "react-router-dom";
import { Loader } from "shared/ui/Loader/Loader";
import { PushNotification } from "features/PushNotifications/PushNotification/PushNotification";
import { RiskProfileModal } from "features/RiskProfile/RiskProfileModal/RiskProfileModal";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import WarningIcon from 'shared/assets/svg/Warning.svg'
import { setStepAdditionalMenuUI, setWarning } from "entities/ui/Ui/slice/uiSlice";
import { ProblemsCodeModal } from "features/RiskProfile/ProblemsCodeModal/ProblemsCodeModal";
import { postPasportScanThunk } from "entities/RiskProfile/slice/riskProfileSlice";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { getAllBrokersThunk, getUserDocumentsStateThunk } from "entities/Documents/slice/documentsSlice";
import { checkPushNotificationsThunk } from "entities/ui/PushNotifications/slice/pushSlice";
import BlueOk from 'shared/assets/svg/blueOk.svg'

const PersonalAccountMenu: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const token = useSelector((state: RootState) => state.user.token);
    const modalRPState = useSelector((state: RootState) => state.modal.identificationModal);
    const { userDocuments, filledRiskProfileChapters, currentConfirmableDoc, brokerIds, brokersCount } = useSelector((state: RootState) => state.documents);
    const pushNotifications = useSelector((state: RootState) => state.push.notifications);
    const activePush = pushNotifications.find((n) => n.active);
    // Используем новое значение unreadAnswersCount вместо personalNewAnswersCount
    const { userPersonalAccountInfo, loading } = useSelector((state: RootState) => state.user);
    const { unreadAnswersCount } = useSelector((state: RootState) => state.supportChat);
    const ifFilledRp = filledRiskProfileChapters.is_risk_profile_complete && filledRiskProfileChapters.is_risk_profile_complete_final
    const userPaymentsInfo = useSelector((state: RootState) => state.payments.payments_info);
    const hasActiveTariff = userPaymentsInfo.some(item => item.user_tariff_is_active === true)


    useEffect(() => {
        dispatch(getUserPersonalAccountInfoThunk());
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [token]);

    useEffect(() => {
        dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
        dispatch(getUserDocumentsStateThunk())
    }, []);

    useEffect(() => {
        dispatch(checkPushNotificationsThunk())
    }, [filledRiskProfileChapters, currentConfirmableDoc, brokerIds, brokersCount])


    const handleLogout = () => {
        localStorage.removeItem("savedToken");
        localStorage.removeItem("lastExit");
        localStorage.removeItem("lastExitSignature");
        dispatch(setUserToken(""));
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const isPassportFilled = filledRiskProfileChapters.is_complete_passport && filledRiskProfileChapters.is_exist_scan_passport;

    const items: PersonalAccountItem[] = [
        {
            icon: AccountRPIcon,
            title: "Риск-профиль",
            action: () => {
                if (!filledRiskProfileChapters.is_risk_profile_complete) {
                    dispatch(setStepAdditionalMenuUI(0))
                    dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
                } else if (!filledRiskProfileChapters.is_risk_profile_complete_final) {
                    dispatch(setStepAdditionalMenuUI(1))
                    dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
                }
            },
            iconWidth: 28,
            iconHeight: 28,
        },
        {
            icon: AccountDocumentIcon,
            title: "Документы",
            route: "/documents",
            notificationsCount: 9 - userDocuments.length,
            iconWidth: 28,
            iconHeight: 28,
            warningMessage: filledRiskProfileChapters.is_risk_profile_complete_final
                ? (9 - userDocuments.length !== 0 ? (
                    <div className={styles.warning}>
                        <Icon Svg={WarningIcon} width={16} height={16} />
                        <div>Есть неподписанные документы ({9 - userDocuments.length} шт.)</div>
                    </div>
                ) : null)
                :
                (
                    <div className={styles.warning}>
                        <Icon Svg={WarningIcon} width={16} height={16} />
                        <div>Заполните анкету риск-профиля</div>
                    </div>
                )
        },
        {
            icon: AccountBrokerIcon,
            title: "Брокер",
            action: () => {
                const hasBrokerKey = brokerIds.length > 0;
                const hasPassport =
                    filledRiskProfileChapters.is_complete_passport &&
                    filledRiskProfileChapters.is_exist_scan_passport;
                const hasTariff = hasActiveTariff;

                if (!hasPassport && !hasTariff) {
                    setWarning({
                        active: true,
                        description:
                            'Для подключения брокера, пожалуйста, заполните паспорт и подключите тариф',
                        buttonLabel: 'Перейти к заполнению',
                        action: () => {
                            dispatch(setStepAdditionalMenuUI(0))
                            dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
                            dispatch(setWarning(
                                {
                                    active: false
                                }
                            ))
                        },
                    });
                } else if (!hasPassport) {
                    setWarning({
                        active: true,
                        description: 'Для подключения брокера, пожалуйста, заполните паспортные данные',
                        buttonLabel: 'Перейти к заполнению',
                        action: () => {
                            dispatch(setStepAdditionalMenuUI(0))
                            dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
                            dispatch(setWarning(
                                {
                                    active: false
                                }
                            ))
                        },
                    });
                } else if (!hasTariff) {
                    setWarning({
                        active: true,
                        description: 'Для подключения брокера, пожалуйста, подключите тариф',
                        buttonLabel: 'Перейти к тарифам',
                        action: () => {
                            navigate('/payments')
                            dispatch(setWarning(
                                {
                                    active: false
                                }
                            ))
                        },
                    });
                } else {
                    dispatch(setStepAdditionalMenuUI(5))
                    dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
                }
            },
            message: brokersCount > 0 && 'подключен',
            iconWidth: 28,
            iconHeight: 28,
            largeWarningMessage: (!hasActiveTariff
                && (
                    !filledRiskProfileChapters.is_complete_passport
                    || !filledRiskProfileChapters.is_exist_scan_passport
                )
            ) ? (
                <div className={styles.warning}>
                    <Icon Svg={WarningIcon} width={16} height={16} />
                    <div>Для подключения заполните документы и подключите тариф</div>
                </div>
            ) : null,
        },
        {
            icon: AccountTarifsIcon,
            title: "Тарифы",
            action: () => navigate("/payments"),
            iconWidth: 24.54,
            iconHeight: 24.24,
        },
        {
            icon: AccountChatIcon,
            title: "Чат поддержки",
            action: () => {
                navigate("/support");

            },
            iconWidth: 28,
            iconHeight: 28,
            notificationsCount: unreadAnswersCount,
        },
        {
            icon: faqBlue,
            title: "FAQ",
            action: () => navigate("/faq"),
            iconWidth: 26,
            iconHeight: 26,
        },
        {
            icon: AccountNotificationIcon,
            title: "Уведомления",
            action: () => dispatch(setCurrentTab("notifications")),
            notificationsCount: 0,
            iconWidth: 25,
            iconHeight: 28,
        },
        // {
        //     icon: AccountSettingsIcon,
        //     title: "Настройки",
        //     action: () => dispatch(setCurrentTab("settings")),
        //     iconWidth: 28,
        //     iconHeight: 28,
        // },
        // {
        //     icon: AccountIIRIcon,
        //     title: "Мои ИИР",
        //     action: () => dispatch(setCurrentTab("analytics")),
        //     iconWidth: 23,
        //     iconHeight: 23,
        // },
        // {
        //     icon: AccountBalanceIcon,
        //     title: "Баланс",
        //     action: () => dispatch(setCurrentTab("balance")),
        //     iconWidth: 28,
        //     iconHeight: 25,
        // },

        {
            icon: AccountLogoutIcon,
            title: "Выйти из учетной записи",
            action: () => handleLogout(),
            iconWidth: 21,
            iconHeight: 21,
        },
    ];

    // useEffect(() => {
    //     dispatch(setStepAdditionalMenuUI(1))
    //     dispatch(openModal({ type: ModalType.IDENTIFICATION, animation: ModalAnimation.LEFT, size: ModalSize.FULL }));
    // }, [])

    // внутри компонента PersonalAccountMenu:
    const getMenuItemStyle = (item: PersonalAccountItem): React.CSSProperties => {
        // Инициализируем пустой объект стилей
        let style: React.CSSProperties = {};


        // Если пункт – "Документы" и риск-профиль заполнен не до конца
        if (item.title === "Документы" && !filledRiskProfileChapters.is_risk_profile_complete_final) {
            style.opacity = "0.5";
        }
        // Если пункт – "Брокер" и паспорт заполнен не полностью
        else if (item.title === "Брокер" && !isPassportFilled) {
            style.opacity = "0.5";
        }
        // Можно добавить здесь иные условия при необходимости

        return style;
    };

    useEffect(() => {
        if (filledRiskProfileChapters.is_risk_profile_complete_final) {
            dispatch(getUserDocumentsStateThunk());
            dispatch(getAllBrokersThunk({
                is_confirmed_type_doc_agreement_transfer_broker: true,
                onSuccess: () => { },
            }));
        }
    }, [filledRiskProfileChapters.is_risk_profile_complete_final, dispatch]);


    if (loading || !userPersonalAccountInfo?.first_name) {
        return <Loader />;
    }

    return (
        <>
            <div className={styles.page}>
                <PushNotification pushNotifications={pushNotifications} activePush={activePush} />
                <div className={styles.page__container}>
                    <div>
                        {userPersonalAccountInfo?.tariff_is_active ? (
                            <div className={styles.page__status}>
                                <div className={styles.page__status_inactive}>активна</div>
                                <div className={styles.page__status__tooltip}>
                                    <Tooltip
                                        positionBox={{ top: "8px", left: '30px' }}
                                        squerePosition={{ top: "15px", left: "-4px" }}
                                        topForCenteringIcons="24px"
                                        className={styles.modalContent__tooltip}
                                        description="Текущий статус вашего счета"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className={styles.page__status}>
                                <div className={styles.page__status_inactive}>Не активна</div>
                                <div className={styles.page__status__tooltip}>
                                    <Tooltip
                                        positionBox={{ top: "8px", left: '30px' }}
                                        squerePosition={{ top: "54px", left: "-4px" }}
                                        topForCenteringIcons="24px"
                                        boxWidth={{ maxWidth: '200px' }}
                                        className={styles.modalContent__tooltip}
                                        description="Текущий статус работы с Вашим счетом. Чтобы активировать, заполните документы и выберите тариф"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <h2 className={styles.page__title}>Учетная запись</h2>
                    <div className={styles.page__info}>
                        <div className={styles.page__avatar}>
                            {userPersonalAccountInfo?.last_name[0]}
                            {userPersonalAccountInfo?.first_name[0]}
                        </div>
                        <div className={styles.page__personalInfo}>
                            <div className={styles.page__fio}>
                                <span>{userPersonalAccountInfo?.last_name}</span>
                                <span>{userPersonalAccountInfo?.first_name}</span>
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
                        {items.map((item, index) => {
                            const hasNotifications = (item.notificationsCount ?? 0) > 0;
                            const isDocumentsWithoutNotifications =
                                item.title === 'Документы' && !hasNotifications;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        ...getMenuItemStyle(item),
                                        ...(item.warningMessage && { padding: '18px 0 34px' }),
                                        ...(item.largeWarningMessage && { padding: '18px 0 54px' }),
                                    }}
                                    onClick={() => {
                                        if (item.route) {
                                            if (item.route === '/documents') {
                                                filledRiskProfileChapters.is_risk_profile_complete_final &&
                                                    navigate(item.route);
                                            }
                                        } else if (item.action) {
                                            item.action();
                                        }
                                    }}
                                    className={styles.menu__item}
                                >
                                    <Icon Svg={item.icon} width={item.iconWidth} height={item.iconHeight} />
                                    <span>{item.title}</span>

                                    {hasNotifications ? (
                                        <div className={styles.page__count}>{item.notificationsCount}</div>
                                    ) : isDocumentsWithoutNotifications ? (
                                        <div className={styles.warning__documents__filled}>
                                            <Icon Svg={BlueOk} width={13} height={14} />
                                            <span>заполнено</span>
                                        </div>
                                    ) : null}

                                    {item.message && <div className={styles.page__message}>{item.message}</div>}
                                    {item.warningMessage}
                                    {item.largeWarningMessage}
                                </div>
                            );
                        })}


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
