import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import {
    getAllTariffsThunk,
    signingTariffThunk,
    setCurrentOrderStatus,
    setCurrentOrderId,
    getAllUserTariffsThunk,
    getAllActiveTariffsThunk,
    setCurrentTariff,
    setLockToLoading,
    getBrokerBalanceThunk,
    setIsConfirming,
    resetTariffSelection,
} from 'entities/Payments/slice/paymentsSlice';
import { setStepAdditionalMenuUI, setWarning } from 'entities/ui/Ui/slice/uiSlice';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import PaymentsBase from 'shared/assets/images/paymentsBase.png';
import PaymentsActive from 'shared/assets/images/paymentsActive.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import { PaymentsCard } from '../PaymentsCard/PaymentsCard';
import { Checkbox } from 'shared/ui/Checkbox/Checkbox';
import { CheckboxGroup } from 'shared/ui/CheckboxGroup/CheckboxGroup';
import styles from './styles.module.scss';
import { closeAllModals, closeModal, openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import { Icon } from 'shared/ui/Icon/Icon';
import { ConfirmDocsModal } from 'features/RiskProfile/ConfirmDocsModal/ConfirmDocsModal';
import { getAllBrokersThunk, setCurrentConfirmableDoc, setCurrentConfirmationMethod, setBrokers } from 'entities/Documents/slice/documentsSlice';
import { PaymentsStatus } from '../PaymentsStatus/PaymentsStatus';
import { Select } from 'shared/ui/Select/Select';
import { useDevice } from 'shared/hooks/useDevice';
import { TariffCalculator } from '../TariffCalculator/TariffCalculator';
import { Loader, LoaderSize } from 'shared/ui/Loader/Loader';
import { set } from 'lodash';
import { setStep } from 'entities/RiskProfile/slice/riskProfileSlice';
import { formatNumberWithSpaces } from 'shared/lib/helpers/formatNumber';

const messageTypeOptions = { SMS: 'SMS', EMAIL: 'Email', WHATSAPP: 'Whatsapp' } as const;
type MessageKey = keyof typeof messageTypeOptions;

const schema = Yup.object().shape({
    is_agree: Yup.boolean().oneOf([true], 'Необходимо подтвердить согласие'),
    type_message: Yup.mixed<MessageKey>().oneOf(Object.keys(messageTypeOptions) as MessageKey[]).required(),
});

export interface PaymentsProps {
    isPaid: (value: boolean) => void;
}

export const Payments: React.FC<PaymentsProps> = ({ isPaid }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const device = useDevice();
    const { status: statusParam, uuid } = useParams<{
        status?: 'success' | 'loading' | 'failed';
        uuid?: string;
    }>();
    const allowedStatus = ['success', 'loading', 'failed'] as const;

    // Redux state
    const tariffs = useSelector((s: RootState) => s.payments.tariffs);
    const idForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const { brokerIds, brokersCount, filledRiskProfileChapters } = useSelector((s: RootState) => s.documents);
    const modalState = useSelector((s: RootState) => s.modal);
    const currentPaymentOrder = useSelector((s: RootState) => s.payments.currentOrder);
    const currentOrderStatus = useSelector((s: RootState) => s.payments.currentOrderStatus);
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs);
    const currentOrderId = useSelector((s: RootState) => s.payments.currentOrderId);
    const currentUserTariffIdForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const lockToLoading = useSelector((s: RootState) => s.payments.lockToLoading);
    const balance = useSelector((s: RootState) => s.payments.balance);
    const activeTariff = useSelector((s: RootState) => s.payments.activeTariffs?.[0]);
    const isAnotherBroker = useSelector((s: RootState) => s.riskProfile.isAnotherBroker);
    const isConfirming = useSelector((s: RootState) => s.payments.isConfirming);
    const currencySymbol = useSelector((s: RootState) => s.user.userPersonalAccountInfo?.currency_symbol) || '₽';

    const tariffsRequestedRef = useRef(false);

    const isPaidAndActive = (title: string): boolean =>
        activeTariffs.some((t) => t.title === title && t.is_active);

    // ===== URL → Redux: статус и замок
    useEffect(() => {
        if (!statusParam) return;
        if (allowedStatus.includes(statusParam as any)) {
            const st = statusParam as 'success' | 'loading' | 'failed';
            dispatch(setCurrentOrderStatus(st));
            if (st === 'loading') dispatch(setLockToLoading(true));
            if (st === 'success' || st === 'failed') dispatch(setLockToLoading(false));
        }
    }, [statusParam, dispatch]);

    // ===== Принудительный редирект /payments/loading при активном замке
    useEffect(() => {
        if (
            lockToLoading &&
            location.pathname.startsWith('/payments') &&
            !location.pathname.endsWith('/loading') &&
            !location.pathname.endsWith('/success')
        ) {
            navigate('/payments/loading', { replace: true });
        }
    }, [lockToLoading, location.pathname, navigate]);

    // ===== SUCCESS, LOADING или FAILED → подтянуть свежие данные
    useEffect(() => {
        if (currentOrderStatus === 'success' || currentOrderStatus === 'loading' || currentOrderStatus === 'failed') {
            dispatch(getAllActiveTariffsThunk({ onSuccess() { } }));
            dispatch(getAllUserTariffsThunk({ onSuccess() { } }));
        }
        // Сбрасываем флаг при смене статуса для возможности повторного запроса
        tariffsRequestedRef.current = false;
    }, [currentOrderStatus, dispatch]);

    // ===== На монтировании: активные тарифы; при размонтировании — очистить только статус
    useEffect(() => {
        dispatch(getAllActiveTariffsThunk({ onSuccess() { } }));
        return () => {
            dispatch(setCurrentOrderStatus(''));
        };
    }, [dispatch]);

    // ===== При возврате на /payments (без статуса) - проверяем свежие данные тарифов
    useEffect(() => {
        if (location.pathname === '/payments' && !statusParam && !currentOrderStatus) {
            dispatch(getAllActiveTariffsThunk({ onSuccess() { } }));
            dispatch(getAllUserTariffsThunk({ onSuccess() { } }));
        }
    }, [location.pathname, statusParam, currentOrderStatus, dispatch]);

    // ===== НОВАЯ ЛОГИКА: Автоматический редирект на success при активном тарифе
    useEffect(() => {
        // Проверяем есть ли активные тарифы с is_active: true
        const hasActiveTariff = activeTariffs.some(tariff => tariff.is_active === true);

        if (hasActiveTariff && (currentOrderStatus === '' || currentOrderStatus === 'loading' || currentOrderStatus === 'failed')) {
            // Если есть активный тариф и статус пустой/loading/failed, переключаем на success
            dispatch(setCurrentOrderStatus('success'));
            // Редирект на страницу success
            if (!location.pathname.endsWith('/success')) {
                navigate('/payments/success', { replace: true });
            }
        }
    }, [activeTariffs, currentOrderStatus, dispatch, navigate, location.pathname]);

    // ===== ОБРАБОТКА СЛУЧАЯ /payments/failed/:uuid при успешной оплате
    useEffect(() => {
        if (statusParam === 'failed' && uuid) {
            // Принудительно загружаем свежие данные тарифов для проверки статуса оплаты
            dispatch(getAllActiveTariffsThunk({ onSuccess() { } }));
            dispatch(getAllUserTariffsThunk({ onSuccess() { } }));
        }
    }, [statusParam, uuid, dispatch]);

    // ===== Каталог тарифов
    useEffect(() => {
        if (tariffs.length < 1) {
            dispatch(getAllTariffsThunk());
        }
    }, [tariffs.length, dispatch]);

    // ===== Брокеры + тарифы
    useEffect(() => {
        dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
        dispatch(getAllTariffsThunk());
    }, [dispatch]);

    // ===== Запрос баланса по первому брокеру (если есть) ✨ ДОБАВЛЕНО
    useEffect(() => {
        if (brokerIds?.length > 0 && brokerIds[0] && !isAnotherBroker) {
            dispatch(getBrokerBalanceThunk({ broker_id: brokerIds[0] }));
        }
    }, [brokerIds, dispatch]);

    // Маппинг кодов брокеров на человекочитаемые названия
    const brokerNameMap: Record<string, string> = {
        'tinkoff_brokers': 'Т-инвестиции',
        'finam_broker': 'Финам',
        'alfa_broker': 'Альфа-Банк',
        'bks_broker': 'БКС',
        'tradernet_ff': 'Tradernet',
        'vtb_broker': 'ВТБ',
        'sberbank_broker': 'Сбербанк'
    };

    // Получаем данные брокеров из Redux state
    const brokers = useSelector((s: RootState) => s.documents.brokers || []);

    const brokersItems = brokers.length > 0
        ? brokers.map(broker => ({
            value: broker.id,
            label: brokerNameMap[broker.broker] || broker.name_for_list || broker.broker
        }))
        : [{ value: '', label: 'Брокер ещё не выбран' }];

    // ===== Локальный UI
    const [currentTimeout, setCurrentTimeout] = useState(0);

    // ✨ Локальное модальное окно «Подробнее о тарифе»
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // ✨
    const [detailsTariffId, setDetailsTariffId] = useState<string | null>(null); // ✨
    const detailsTariff = tariffs.find((t) => t.id === detailsTariffId) || null; // ✨

    useEffect(() => {
        if (currentTimeout <= 0) return;
        const t = setTimeout(() => setCurrentTimeout((p) => p - 1), 1000);
        return () => clearTimeout(t);
    }, [currentTimeout]);

    // ===== Formik
    const formik = useFormik({
        initialValues: {
            is_agree: false,
            type_message: 'EMAIL' as MessageKey | '',
            broker_id: '',
        },
        validationSchema: schema,
        onSubmit: ({ is_agree, type_message }) => {
            dispatch(
                signingTariffThunk({
                    tariff_id: idForPayments,
                    is_agree,
                    type_message,
                    onSuccess: () => {
                        dispatch(
                            openModal({
                                type: ModalType.CONFIRM_DOCS,
                                size: ModalSize.MIDDLE,
                                animation: ModalAnimation.LEFT,
                            }),
                        );
                        setCurrentTimeout(5);
                    },
                }),
            );
        },
    });

    // ===== Обновление formik broker_id при загрузке данных брокеров
    useEffect(() => {
        if (brokers.length > 0 && !formik.values.broker_id) {
            formik.setFieldValue('broker_id', brokers[0].id);
        }
    }, [brokers]);

    const handleChooseTariff = (id: string) => {
        dispatch(setCurrentTariff(id));
        dispatch(setCurrentOrderId(id));
    };

    // ✨ Открыть модал «Подробнее»: сохраняем выбранный тариф и открываем окно
    const handleOpenDetails = (id: string) => {
        handleChooseTariff(id);        // сохраняем выбор как и раньше
        setDetailsTariffId(id);        // для отображения данных в модалке
        // открыть модал
    };

    const handleConfirmPayment = () => {
        dispatch(setStepAdditionalMenuUI(4));
        dispatch(setCurrentConfirmableDoc('type_doc_agreement_investment_advisor_app_1'));
        dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }));
        setIsDetailsOpen(false)
    }

    const handleSetTariff = useCallback(() => {
        dispatch(closeModal(ModalType.SUCCESS));
        if (isAnotherBroker) {
            handleConfirmPayment()
        } else {
            if (brokersCount < 1) {
                dispatch(
                    setWarning({
                        active: true,
                        description: 'Для оплаты тарифа пожалуйста подпишите все документы и подключите брокерский счёт',
                        buttonLabel: 'Перейти к заполнению',
                        action: () => {
                            dispatch(closeAllModals());
                            navigate('/documents');
                        },
                    }),
                );
            } else {
                setIsDetailsOpen(true);
            }
        }

    }, [dispatch, brokersCount, navigate]);

    useEffect(() => {
        document.body.style.overflow = isConfirming ? 'hidden' : '';
    }, [isConfirming]);

    // ===== Утилиты форматирования и расчёта ✨

    // ===== Экран статуса
    if (currentOrderStatus) {
        return (
            <PaymentsStatus
                status={currentOrderStatus as any}
                paymentId={currentUserTariffIdForPayments || currentOrderId}
                payAction={() => {
                    if (!currentPaymentOrder?.payment_url) return;
                    const newTab = window.open(currentPaymentOrder.payment_url, '_blank', 'noopener,noreferrer');
                    if (newTab) newTab.focus();
                }}
                onBack={
                    currentOrderStatus === 'loading'
                        ? () => {
                            dispatch(setLockToLoading(false));
                            dispatch(setCurrentOrderStatus(''));
                            navigate('/payments', { replace: true });
                        }
                        : undefined
                }
            />
        );
    } else if (statusParam && allowedStatus.includes(statusParam as any)) {
        // Рендер по URL-параметру (подстраховка)
        return (
            <PaymentsStatus
                status={statusParam as any}
                paymentId={currentUserTariffIdForPayments || currentOrderId}
                payAction={() => {
                    if (!currentPaymentOrder?.payment_url) return;
                    const newTab = window.open(currentPaymentOrder.payment_url, '_blank', 'noopener,noreferrer');
                    if (newTab) newTab.focus();
                }}
                onBack={
                    statusParam === 'loading'
                        ? () => {
                            dispatch(setLockToLoading(false));
                            dispatch(setCurrentOrderStatus(''));
                            navigate('/payments', { replace: true });
                        }
                        : undefined
                }
            />
        );
    }

    // ===== Список карточек (основной экран)
    const listPart = (
        <>
            <AnimatePresence mode="popLayout">
                {(currentOrderId ? tariffs.filter((t) => t.id === currentOrderId) : tariffs).map((t, index) => (
                    <motion.div
                        key={t.id}
                        layout="position"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={styles.card__wrapper}
                    >
                        <PaymentsCard
                            index={index}
                            title_additional={t.title_additional}
                            isSelected={t.id === currentOrderId}
                            status={t.is_active ? 'Active' : 'Inactive'}
                            title={t.title}
                            titleDesc={t.description}
                            descriptionDetail={t.description_detailed}
                            upfront={t.commission_deposit != null ? `${t.commission_deposit}%` : ''}
                            fee={t.commission_asset != null ? `${t.commission_asset}%` : ''}
                            capital={`${t.days_service_validity} days`}
                            imageUrl={t.title === 'Базовый тариф' ? PaymentsBase : PaymentsActive}
                            onMore={() => handleOpenDetails(t.id)}  // ✨ ИЗМЕНЕНО: открываем модал
                            paidFor={isPaidAndActive(t.title) || false}
                        />

                        {currentOrderId && (
                            <>
                                <TariffCalculator
                                    tariff_key={currentOrderId}
                                    min_deposit_value={t.min_amount_start ?? 0}
                                />
                                <div>
                                    <span className={styles.disclaimer}>
                                        Указанная доходность носит исключительно справочный характер и не является гарантированной
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            <AnimatePresence>
                {currentOrderId && (
                    <motion.div
                        className={styles.detailed__actions}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <Select
                            items={brokersItems}
                            value={formik.values.broker_id}
                            onChange={(val) => {
                                formik.setFieldValue('broker_id', val);
                            }}
                            noMargin
                            needValue
                            hideArrow
                            title="Выберите брокера для подключения тарифа"
                            label="Брокерский счёт для подключения тарифа"
                        />



                        <Button
                            disabled={!isAnotherBroker ? !formik.values.broker_id : false}
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            padding="10px 25px"
                            onClick={handleSetTariff}
                        >
                            Подключить
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    // ===== (если используешь отдельный шаг подтверждения)
    const confirmPart = (
        <AnimatePresence>
            {isConfirming && (
                <div className={styles.confirm__container}>
                    <motion.span
                        className={styles.confirm__title}
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0, position: 'absolute' }}
                        transition={{ duration: 0.4 }}
                    >
                        <Icon
                            Svg={BackIcon}
                            width={24}
                            height={24}
                            onClick={() => {
                                dispatch(setIsConfirming(false));
                                isPaid(false);
                            }}
                            pointer
                        />
                        Подключение тарифа
                    </motion.span>

                    <AnimatePresence mode="popLayout">
                        {(currentOrderId ? tariffs.filter((t) => t.id === currentOrderId) : tariffs).map((t, index) => (
                            <motion.div
                                key={t.id}
                                layout="position"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={styles.confirm__card}
                            >
                                <PaymentsCard
                                    index={index}
                                    isSelected={t.id === currentOrderId}
                                    status={t.is_active ? 'Active' : 'Inactive'}
                                    title={t.title}
                                    title_additional={t.title_additional}
                                    titleDesc={t.description}
                                    descriptionDetail={t.description_detailed}
                                    upfront={t.commission_deposit != null ? `${t.commission_deposit}%` : ''}
                                    fee={t.commission_asset != null ? `${t.commission_asset}%` : ''}
                                    capital={`${t.days_service_validity} days`}
                                    imageUrl={t.title === 'Долгосрочный инвестор' ? PaymentsBase : PaymentsActive}
                                    onMore={() => handleChooseTariff(t.id)} // оставляем прежнее поведение здесь
                                    paidFor={isPaidAndActive(t.title) || false}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <motion.form
                        onSubmit={formik.handleSubmit}
                        className={styles.page__container}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 30, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className={styles.page__checkbox}>
                            <Checkbox
                                name="is_agree"
                                value={formik.values.is_agree}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                label={<span className={styles.checkbox__text}>Я ознакомился с тарифом и его содержанием</span>}
                                error={formik.touched.is_agree && formik.errors.is_agree ? (formik.errors.is_agree as string) : ''}
                            />
                        </div>

                        <div>
                            <span className={styles.method__title}>Куда прислать код</span>

                            <div className={styles.checkbox}>
                                <CheckboxGroup
                                    name="type_message"
                                    label=""
                                    direction="row"
                                    greedOrFlex={device === 'mobile' ? 'flex' : 'flex'}
                                    options={Object.entries(messageTypeOptions).map(([value, label]) => ({
                                        value,
                                        label,
                                    }))}
                                    value={formik.values.type_message}
                                    onChange={(_, v) => {
                                        const key = v as MessageKey;
                                        formik.setFieldValue('type_message', v);
                                        dispatch(setCurrentConfirmationMethod(key));
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Button
                                type="submit"
                                theme={ButtonTheme.BLUE}
                                className={styles.button}
                                disabled={!formik.values.is_agree || formik.values.type_message === '' || currentTimeout > 0}
                            >
                                {!currentTimeout ? 'Подтвердить' : `(${currentTimeout})`}
                            </Button>
                        </div>
                    </motion.form>
                </div>
            )}
        </AnimatePresence>
    );

    // ===== Модал «Подробнее о тарифе» ✨
    const detailsModal = (
        <AnimatePresence>
            {isDetailsOpen && (
                <motion.div
                    className={styles.detailsModalOverlay || 'details-modal-overlay'} // на случай, если нет класса в scss
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setIsDetailsOpen(false)}
                >
                    <motion.div
                        className={styles.detailsModal || 'details-modal'}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 20,
                            width: 'min(560px, 92vw)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 10 }}>
                            {detailsTariff?.title ? <span style={{ opacity: 0.7 }}>{detailsTariff.title}</span> : null}

                        </div>

                        <div style={{ display: 'grid', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>Ваш текущий баланс</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>
                                    {balance?.all_total ? balance.all_total : <Loader size={LoaderSize.MEDIUM} />} {currencySymbol}
                                </div>
                            </div>

                            <div style={{ height: 1, background: '#eee', margin: '6px 0' }} />

                            <div style={{ display: 'grid', gap: 6 }}>
                                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                                    *Расчёт комиссии по тарифу зависит от баланса и риск-профиля
                                </div>
                            </div>

                            <div style={{ height: 1, background: '#eee', margin: '6px 0' }} />

                            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'start', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 16, opacity: 0.8 }}>Есть вопросы?</span>
                                <Button
                                    className={styles.chat__button}
                                    theme={ButtonTheme.EMPTYBLUE}
                                    onClick={() => navigate('/support')}

                                    padding="0"
                                >
                                    Напишите в чат поддержки
                                </Button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                            <Button
                                theme={ButtonTheme.EMPTYBLUE}
                                onClick={() => setIsDetailsOpen(false)}
                                padding="10px 18px"
                            >
                                Вернуться
                            </Button>
                            <Button
                                theme={ButtonTheme.BLUE}
                                onClick={() => handleConfirmPayment()}
                                padding="10px 18px"
                            >
                                Подтвердить
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={styles.list}>
            {!isConfirming ? listPart : confirmPart}

            {/* ✨ Модальное окно «Подробнее о тарифе» */}
            {detailsModal}

            <ConfirmDocsModal
                lastData={{
                    type_message: formik.values.type_message,
                    is_agree: formik.values.is_agree,
                }}
                isOpen={modalState.confirmDocsModal.isOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                confirmationPurpose="payments"
            />
        </div>
    );
};
