// PaymentsCardList.tsx
import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from 'app/providers/store/config/store';
import {
    getAllTariffsThunk,
    setTariffIdThunk,
    signingTariffThunk,
    setCurrentOrderStatus,
    setCurrentOrderId,
    getAllUserTariffsThunk,
    getAllActiveTariffsThunk,     // <== НОВОЕ
} from 'entities/Payments/slice/paymentsSlice';
import { setStepAdditionalMenuUI, setWarning } from 'entities/ui/Ui/slice/uiSlice';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Loader } from 'shared/ui/Loader/Loader';
import PaymentsBase from 'shared/assets/images/paymentsBase.png';
import PaymentsActive from 'shared/assets/images/paymentsActive.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import { PaymentsCard } from '../PaymentsCard/PaymentsCard';
import { Checkbox } from 'shared/ui/Checkbox/Checkbox';
import { CheckboxGroup } from 'shared/ui/CheckboxGroup/CheckboxGroup';
import styles from './styles.module.scss';
import { closeModal, openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import { Icon } from 'shared/ui/Icon/Icon';
import { ConfirmDocsModal } from 'features/RiskProfile/ConfirmDocsModal/ConfirmDocsModal';
import { getAllBrokersThunk, setCurrentConfirmationMethod } from 'entities/Documents/slice/documentsSlice';
import { PaymentsStatus } from '../PaymentsStatus/PaymentsStatus';
import { SelectModal } from 'features/Ui/SelectModal/SelectModal';
import { Select } from 'shared/ui/Select/Select';
import { useDevice } from 'shared/hooks/useDevice';

const messageTypeOptions = { SMS: 'SMS', EMAIL: 'Email', WHATSAPP: 'Whatsapp' } as const;
type MessageKey = keyof typeof messageTypeOptions;

const schema = Yup.object().shape({
    is_agree: Yup.boolean().oneOf([true], 'Необходимо подтвердить согласие'),
    type_message: Yup.mixed<MessageKey>()
        .oneOf(Object.keys(messageTypeOptions) as MessageKey[])
        .required(),
});

export interface PaymentsProps {
    isPaid: (value: boolean) => void;
}

export const Payments: React.FC<PaymentsProps> = ({ isPaid }) => {
    const dispatch = useAppDispatch();

    /* ---------------- url параметр ---------------- */
    const device = useDevice()
    const { status: statusParam, uuid: orderIdParam } = useParams<{
        status?: 'success' | 'loading' | 'failed';
        uuid?: string;
    }>();
    const allowedStatus = ['success', 'loading', 'failed'] as const;

    /* ---------------- redux ---------------- */
    const tariffs = useSelector((s: RootState) => s.payments.tariffs);
    const idForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const { brokersCount, filledRiskProfileChapters, brokerIds } = useSelector((s: RootState) => s.documents);
    const modalState = useSelector((s: RootState) => s.modal);
    const currentPaymentOrder = useSelector((s: RootState) => s.payments.currentOrder);
    const currentOrderStatus = useSelector((s: RootState) => s.payments.currentOrderStatus);
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs);
    const currentOrderId = useSelector((s: RootState) => s.payments.currentOrderId);
    const currentUserTariffIdForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const paymentsInfo = useSelector((s: RootState) => s.payments.payments_info);
    const tariffsRequestedRef = useRef(false);
    const paidTariffKeys = useSelector(
        (s: RootState) => s.payments.paidTariffKeys
    );

    // ② преобразуем его В ЗНАЧЕНИЯ (user-keys) и кладём в Set
    const paidUserKeys = useMemo(
        () => new Set(Object.values(paidTariffKeys)),   // ← values, не keys!
        [paidTariffKeys]
    );

    const isPaidAndActive = (catalogId: string) => {
        if (activeTariffs.some(tariff => tariff.is_active)) {
            const userKey = paidTariffKeys[catalogId];
            return !!userKey && paidUserKeys.has(userKey);
        }
    };

    useEffect(() => {
        if (statusParam && allowedStatus.includes(statusParam as any)) {
            dispatch(setCurrentOrderStatus(statusParam as any));
        }
    }, [statusParam, dispatch]);


    // 2. Когда статус в сторе стал SUCCESS – грузим тарифы
    useEffect(() => {
        if (currentOrderStatus === 'success' && !tariffsRequestedRef.current) {
            dispatch(getAllActiveTariffsThunk({ onSuccess() { } }));
            dispatch(getAllUserTariffsThunk({ onSuccess() { } }));
            tariffsRequestedRef.current = true;       // блокируем повтор
        }
    }, [currentOrderStatus, dispatch]);


    /* сброс статуса при уходе со страницы */
    useEffect(() => {
        return () => {
            dispatch(setCurrentOrderStatus(''));
        };
    }, [dispatch]);


    useEffect(() => {
        if (tariffs.length < 1) {
            dispatch(getAllTariffsThunk());
        }
    }, [tariffs]);

    useEffect(() => {
        dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
        dispatch(getAllTariffsThunk());
    }, []);

    const brokersItems = [
        {
            value: brokerIds[0],
            label: 'Тинькофф инвестиции'
        }
    ]

    /* ---------------- ui state ------------- */
    const [isConfirming, setIsConfirming] = useState(false);
    const [currentTimeout, setCurrentTimeout] = useState(0);

    /* ---------------- countdown ------------- */
    useEffect(() => {
        if (currentTimeout <= 0) return;
        const t = setTimeout(() => setCurrentTimeout((p) => p - 1), 1000);
        return () => clearTimeout(t);
    }, [currentTimeout]);

    /* ---------------- formik ---------------- */
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


    const handleChooseTariff = useCallback(
        (id: string) => {
            if (currentOrderId === id) return;
            dispatch(setCurrentOrderId(id));        // <== НОВОЕ
        },
        [currentOrderId, dispatch],
    );

    const handleSetTariff = useCallback(() => {
        // if (!filledRiskProfileChapters.is_exist_scan_passport) {
        //     dispatch(
        //         setWarning({
        //             active: true,
        //             description: "Для подключения тарифа, пожалуйста, заполните паспортные данные",
        //             buttonLabel: "Перейти к заполнению",
        //             action: () => {
        //                 dispatch(setStepAdditionalMenuUI(2));
        //                 dispatch(
        //                     openModal({
        //                         type: ModalType.IDENTIFICATION,
        //                         animation: ModalAnimation.LEFT,
        //                         size: ModalSize.FULL,
        //                     }),
        //                 );
        //                 dispatch(closeModal(ModalType.WARNING))
        //             },
        //         }),
        //     );
        //     return;
        // }
        // if (brokersCount === 0) {
        //     dispatch(
        //         setWarning({
        //             active: true,
        //             description: "Для подключения тарифа, пожалуйста, предоставьте api-ключ брокера для работы с вашим счетом и заполните паспортные данные",
        //             buttonLabel: "Перейти к заполнению",
        //             action: () => {
        //                 dispatch(setStepAdditionalMenuUI(5));
        //                 dispatch(
        //                     openModal({
        //                         type: ModalType.IDENTIFICATION,
        //                         animation: ModalAnimation.LEFT,
        //                         size: ModalSize.FULL,
        //                     }),
        //                 );
        //             },
        //         }),
        //     );
        //     return;
        // }

        currentOrderId && dispatch(setTariffIdThunk({
            tariff_key: currentOrderId, broker_id: formik.values.broker_id, onSuccess: () => {
                setIsConfirming(true);
                isPaid(true);
            }
        }));

    }, [brokersCount, filledRiskProfileChapters, currentOrderId, isPaid, formik.values.broker_id]);

    useEffect(() => {
        document.body.style.overflow = isConfirming ? 'hidden' : '';
    }, [isConfirming]);


    if (currentOrderStatus) {
        return <PaymentsStatus status={currentOrderStatus as any} paymentId={currentUserTariffIdForPayments || currentOrderId} payAction={() => {
            if (!currentPaymentOrder?.payment_url) return;
            const newTab = window.open(currentPaymentOrder.payment_url, '_blank', 'noopener,noreferrer');
            if (newTab) newTab.focus(); 8
        }} />;
    } else if (statusParam && allowedStatus.includes(statusParam as any)) {
        return <PaymentsStatus status={statusParam as any} paymentId={currentUserTariffIdForPayments || currentOrderId} payAction={() => {
            if (!currentPaymentOrder?.payment_url) return;
            const newTab = window.open(currentPaymentOrder.payment_url, '_blank', 'noopener,noreferrer');
            if (newTab) newTab.focus(); 8
        }} />;
    }

    // if (isFetching && !currentOrderStatus && !statusParam) return <Loader />;

    /* Cards, списки отображаем только пока не в confirm-step */
    const listPart = (
        <>
            <AnimatePresence mode="popLayout">

                {(currentOrderId ? tariffs.filter((t) => t.id === currentOrderId) : tariffs).map(
                    (t, index) => (
                        <motion.div
                            key={t.id}
                            layout="position"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PaymentsCard
                                index={index}
                                title_additional={t.title_additional
                                }
                                isSelected={t.id === currentOrderId}
                                status={t.is_active ? 'Active' : 'Inactive'}
                                title={t.title}
                                titleDesc={t.description}
                                descriptionDetail={t.description_detailed}
                                upfront={t.commission_deposit != null ? `${t.commission_deposit}%` : ''}
                                fee={t.commission_asset != null ? `${t.commission_asset}%` : ''}
                                capital={`${t.days_service_validity} days`}
                                imageUrl={t.title === 'Базовый тариф' ? PaymentsBase : PaymentsActive}
                                onMore={() => handleChooseTariff(t.id)}
                                paidFor={isPaidAndActive(t.id)}
                            />
                        </motion.div>
                    ),
                )}
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
                                formik.setFieldValue('broker_id', val)
                            }}
                            noMargin
                            needValue
                            title='Выберите брокера для подключения тарифа'
                            label='Брокерский счет для подключения тарифа'
                        // error={formik.touched.broker && formik.errors.broker}
                        />
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            padding="10px 25px"
                            className={styles.button}
                            onClick={() => {
                                dispatch(setCurrentOrderId(''));
                                setIsConfirming(false);
                                formik.resetForm();
                            }}
                        >
                            Вернуться к выбору тарифов
                        </Button>

                        <Button disabled={!formik.values.broker_id} theme={ButtonTheme.BLUE} className={styles.button} padding="10px 25px" onClick={handleSetTariff}>
                            Подключить
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );

    /* --- 3-й шаг — подтверждение тарифа --- */
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
                                setIsConfirming(false);
                                isPaid(false);
                            }}
                        />
                        Подключение тарифа
                    </motion.span>

                    <AnimatePresence mode="popLayout">
                        {(currentOrderId ? tariffs.filter((t) => t.id === currentOrderId) : tariffs).map(
                            (t, index) => (
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
                                        title_additional={t.title_additional
                                        }
                                        titleDesc={t.description}
                                        descriptionDetail={t.description_detailed}
                                        upfront={t.commission_deposit != null ? `${t.commission_deposit}%` : ''}
                                        fee={t.commission_asset != null ? `${t.commission_asset}%` : ''}
                                        capital={`${t.days_service_validity} days`}
                                        imageUrl={t.title === 'Долгосрочный инвестор' ? PaymentsBase : PaymentsActive}
                                        onMore={() => handleChooseTariff(t.id)}
                                        paidFor={isPaidAndActive(t.id)}
                                    />
                                </motion.div>
                            ),
                        )}
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

                                label={
                                    <span className={styles.checkbox__text}>
                                        Я ознакомился с тарифом и его содержанием
                                    </span>
                                }
                                error={
                                    formik.touched.is_agree && formik.errors.is_agree
                                        ? formik.errors.is_agree
                                        : ''
                                }
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
                                disabled={
                                    !formik.values.is_agree ||
                                    formik.values.type_message === '' ||
                                    currentTimeout > 0
                                }
                            >
                                {!currentTimeout ? 'Подтвердить' : `(${currentTimeout})`}
                            </Button>
                        </div>

                    </motion.form>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={styles.list}>

            {!isConfirming
                ? listPart
                : confirmPart}

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
