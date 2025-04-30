// PaymentsCardList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import {
    getAllTariffsThunk,
    setTariffIdThunk,
    signingTariffThunk,
} from 'entities/Payments/slice/paymentsSlice';
import { setStepAdditionalMenuUI } from 'entities/ui/Ui/slice/uiSlice';
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
import { closeModal, openModal, setCurrentConfirmModalType } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import BackIcon from 'shared/assets/svg/ArrowBack.svg'
import { Icon } from 'shared/ui/Icon/Icon';
import { ConfirmDocsModal } from 'features/RiskProfile/ConfirmDocsModal/ConfirmDocsModal';
import { setCurrentConfirmationMethod } from 'entities/Documents/slice/documentsSlice';

/* -------------------------------------------------- */
/* message-type options                               */
/* -------------------------------------------------- */
const messageTypeOptions = { SMS: "SMS", EMAIL: "Email", WHATSAPP: "Whatsapp" } as const;
type MessageKey = keyof typeof messageTypeOptions;

/* -------------------------------------------------- */
/* yup schema                                         */
/* -------------------------------------------------- */
const schema = Yup.object().shape({
    is_agree: Yup.boolean().oneOf([true], 'Необходимо подтвердить согласие'),
    type_message: Yup.mixed<keyof typeof messageTypeOptions>()
        .oneOf(Object.keys(messageTypeOptions) as (keyof typeof messageTypeOptions)[])
        .required(),
});

export interface PaymentsCardListProps {
    isPaid: (value: boolean) => void;
}

export const PaymentsCardList = ({ isPaid }: PaymentsCardListProps) => {
    const dispatch = useAppDispatch();

    /* ---------------- redux ---------------- */
    const tariffs = useSelector((s: RootState) => s.payments.tariffs);
    const idForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const isFetching = useSelector((s: RootState) => s.payments.isFetchingTariffs);
    const { brokersCount, filledRiskProfileChapters } = useSelector(
        (s: RootState) => s.documents,
    );
    const modalState = useSelector(
        (s: RootState) => s.modal,
    );

    /* ---------------- ui state ------------- */
    const [selectedId, setSelectedId] = useState<string | null>(null);
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
            type_message: 'EMAIL' as keyof typeof messageTypeOptions | '',
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
                        setCurrentTimeout(60);
                    },
                }),
            );
        },
    });

    useEffect(() => {
        dispatch(getAllTariffsThunk());
    }, [dispatch]);

    const handleChooseTariff = useCallback(
        (id: string) => {
            if (selectedId === id) return;
            setSelectedId(id);
        },
        [selectedId],
    );

    const handleAgreeChange = useCallback(
        (checked: boolean) => {
            // просто руками прокидываем значение в formik
            formik.setFieldValue('is_agree', checked);
        },
        [formik],
    );

    const handleSetTariff = useCallback(() => {
        /* — шаги идентификации — */
        // if (!filledRiskProfileChapters.is_exist_scan_passport) {
        //     dispatch(setStepAdditionalMenuUI(2));
        //     dispatch(
        //         openModal({
        //             type: ModalType.IDENTIFICATION,
        //             animation: ModalAnimation.LEFT,
        //             size: ModalSize.FULL,
        //         }),
        //     );
        //     return;
        // }
        // if (brokersCount === 0) {
        //     dispatch(setStepAdditionalMenuUI(5));
        //     dispatch(
        //         openModal({
        //             type: ModalType.IDENTIFICATION,
        //             animation: ModalAnimation.LEFT,
        //             size: ModalSize.FULL,
        //         }),
        //     );
        //     return;
        // }

        selectedId && dispatch(setTariffIdThunk({ tariff_key: selectedId, onSuccess: () => { } }))
        setIsConfirming(true);
        isPaid(true)
    }, [brokersCount, dispatch, filledRiskProfileChapters, selectedId]);

    useEffect(() => {
        document.body.style.overflow = isConfirming ? 'hidden' : '';

    }, [isConfirming]);

    /* -------------------------------------------------- */
    /* RENDER — LIST / CONFIRM                            */
    /* -------------------------------------------------- */
    if (isFetching) return <Loader />;

    /* Cards, списки отображаем только пока не в confirm-step */
    const listPart = (
        <>
            <AnimatePresence mode="popLayout">
                {(selectedId ? tariffs.filter((t) => t.id === selectedId) : tariffs).map(
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
                                isSelected={t.id === selectedId}
                                status={t.is_active ? 'Active' : 'Inactive'}
                                title={t.title}
                                titleDesc={t.description}
                                descriptionDetail="Длинное описание деталей Длинное описание деталейДлинное описание деталей Длинное описание деталейДлинное описание деталей Длинное описание деталей"
                                upfront={
                                    t.commission_deposit != null
                                        ? `${t.commission_deposit}%`
                                        : ''
                                }
                                fee={
                                    t.commission_asset != null
                                        ? `${t.commission_asset}%`
                                        : ''
                                }
                                capital={`${t.days_service_validity} days`}
                                imageUrl={
                                    t.title === 'Долгосрочный инвестор'
                                        ? PaymentsBase
                                        : PaymentsActive
                                }
                                onMore={() => handleChooseTariff(t.id)}
                            />
                        </motion.div>
                    ),
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedId && (
                    <motion.div
                        className={styles.detailed__actions}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            padding="10px 25px"
                            onClick={() => {
                                setSelectedId(null);
                                setIsConfirming(false);
                                formik.resetForm();
                            }}
                        >
                            Вернуться к выбору тарифов
                        </Button>

                        <Button
                            theme={ButtonTheme.BLUE}
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

    /* --- 3-й шаг — подтверждение тарифа --- */
    const confirmPart = (
        <AnimatePresence>
            {isConfirming && (
                <div className={styles.confirm__container}>
                    {/* верхний элемент */}
                    <motion.span
                        className={styles.confirm__title}
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0, position: 'absolute' }}
                        transition={{ duration: 0.4 }}
                    >
                        <Icon Svg={BackIcon} width={24} height={24} onClick={() => {
                            setIsConfirming(false)
                            isPaid(false)
                        }} />Подключение тарифа
                    </motion.span>

                    <AnimatePresence mode="popLayout">
                        {(selectedId ? tariffs.filter((t) => t.id === selectedId) : tariffs).map(
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
                                        isSelected={t.id === selectedId}
                                        status={t.is_active ? 'Active' : 'Inactive'}
                                        title={t.title}
                                        titleDesc={t.description}
                                        descriptionDetail="Длинное описание деталей Длинное описание деталейДлинное описание деталей Длинное описание деталейДлинное описание деталей Длинное описание деталейДлинное описание деталей Длинное описание деталей"
                                        upfront={
                                            t.commission_deposit != null
                                                ? `${t.commission_deposit}%`
                                                : ''
                                        }
                                        fee={
                                            t.commission_asset != null
                                                ? `${t.commission_asset}%`
                                                : ''
                                        }
                                        capital={`${t.days_service_validity} days`}
                                        imageUrl={
                                            t.title === 'Долгосрочный инвестор'
                                                ? PaymentsBase
                                                : PaymentsActive
                                        }
                                        onMore={() => handleChooseTariff(t.id)}
                                    />
                                </motion.div>
                            ),
                        )}
                    </AnimatePresence>


                    {/* форма (снизу-вверх) */}
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
                                        Я ознакомился с тарифом и его
                                        содержанием
                                    </span>
                                }
                                error={
                                    formik.touched.is_agree && formik.errors.is_agree
                                        ? formik.errors.is_agree
                                        : ''
                                }
                            />
                        </div>

                        <span className={styles.method__title}>
                            Куда прислать код
                        </span>

                        <div className={styles.checkbox}>
                            <CheckboxGroup
                                name="type_message"
                                label=""
                                direction="row"
                                options={Object.entries(messageTypeOptions).map(
                                    ([value, label]) => ({ value, label }),
                                )}
                                value={formik.values.type_message}
                                onChange={(_, v) => {
                                    const key = v as MessageKey;
                                    formik.setFieldValue('type_message', v)
                                    dispatch(setCurrentConfirmationMethod(key))
                                }
                                }
                            />
                        </div>

                        <div
                            className={styles.buttons}
                        >
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
                                {!currentTimeout
                                    ? 'Подтвердить'
                                    : `(${currentTimeout})`}
                            </Button>
                        </div>
                    </motion.form>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={styles.list}>
            {!isConfirming ? listPart : confirmPart}

            <ConfirmDocsModal
                lastData={{ type_message: formik.values.type_message, is_agree: formik.values.is_agree }}
                isOpen={modalState.confirmDocsModal.isOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                confirmationPurpose='payments'
            />
        </div>
    );
};
