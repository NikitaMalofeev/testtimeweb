// src/pages/BrokerConnectionForm/BrokerConnectionForm.tsx

import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { Input } from 'shared/ui/Input/Input';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';

// Редакс-хуки:
import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { RootState } from 'app/providers/store/config/store';
import PdfIcon from 'shared/assets/svg/pdfIcon.svg'


// Стили (пример, вы можете адаптировать под себя)
import styles from './styles.module.scss';
import { CheckboxGroup } from 'shared/ui/CheckboxGroup/CheckboxGroup';
import { Select } from 'shared/ui/Select/Select';
import { Icon } from 'shared/ui/Icon/Icon';
import { DocumentPreviewModal } from 'features/Documents/DocumentsPreviewModal/DocumentPreviewModal';
import { closeModal, openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import BrokerInstruction from 'shared/assets/documents/brokerInstruction.pdf'
import { postBrokerApiTokenThunk } from 'entities/RiskProfile/slice/riskProfileSlice';
import { ProblemsCodeModal } from '../ProblemsCodeModal/ProblemsCodeModal';
import { ProblemsModal } from '../ProblemsModal/ProblemsModal';
import { InfoModal } from '../InfoModal/InfoModal';
import { setCurrentConfirmableDoc } from 'entities/Documents/slice/documentsSlice';
import { setStepAdditionalMenuUI } from 'entities/ui/Ui/slice/uiSlice';
import { useNavigate } from 'react-router-dom';
import brokerInstructionPDF from 'shared/assets/documents/brokerInstruction.pdf'
import { useDevice } from 'shared/hooks/useDevice';
import { DocumentsPreviewPdfModal } from 'features/Documents/DocumentsPreviewPdfModal/DocumentsPreviewPdfModal';

export const BrokerConnectionForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal)
    const navigate = useNavigate()
    const { brokerIds } = useSelector((state: RootState) => state.documents)
    const device = useDevice()
    const isBulk = useSelector((s: RootState) => s.user.userPersonalAccountInfo?.is_confirm_all_documents_one_code)

    const brokersItems = [
        {
            value: 'tinkoff_brokers',
            label: 'Т-инвестиции'
        },
        {
            value: 'finam_broker',
            label: 'Финам'
        },
        {
            value: 'alfa_broker',
            label: 'Альфа'
        },
        {
            value: 'bks_broker',
            label: 'БКС'
        },
        {
            value: "tradernet_ff",
            label: 'Трейдернет'
        },
        {
            value: 'vtb_broker',
            label: 'ВТБ'
        },
        {
            value: 'sberbank_broker',
            label: 'Сбербанк'
        },
        {
            value: 'other',
            label: 'Другой брокер'
        }
    ]

    const tinkoffExternalLink = 'https://www.tbank.ru/invest/'

    // Схема валидации для формы
    const validationSchema = Yup.object().shape({
        // market: Yup.string().required('Обязательное поле'),
        broker: Yup.string().required('Обязательное поле'),
        customBrokerName: Yup.string().when('broker', {
            is: 'other',
            then: (schema) => schema.required('Название брокера обязательно для заполнения'),
            otherwise: (schema) => schema.notRequired()
        }),
        token: Yup.string().when('broker', {
            is: 'tinkoff_brokers',
            then: (schema) => schema.required('Обязательное поле'),
            otherwise: (schema) => schema.notRequired()
        }),
    });

    // Инициализируем Formik
    const formik = useFormik({
        initialValues: {
            // market: '',
            broker: '',
            customBrokerName: '',
            token: '',
        },
        validationSchema,
        onSubmit: (values) => {

        },
        enableReinitialize: true, // чтобы при обновлении brokerState форма обновлялась
    });

    const handleSubmit = () => {
        const isOtherBroker = formik.values.broker === 'other';
        const isStandardBroker = formik.values.broker && formik.values.broker !== 'other' && formik.values.broker !== 'tinkoff_brokers';

        let submitData;

        if (isOtherBroker) {
            // Для "other" - отправляем seventh_set_broker payload
            submitData = {
                broker: "other_unknown_broker",
                description_from_user: formik.values.customBrokerName
            };
        } else if (isStandardBroker) {
            // Для обычных брокеров (кроме Тинькофф) - отправляем seventh_set_broker payload
            submitData = {
                broker: formik.values.broker,
                description_from_user: ""
            };
        } else {
            // Для Тинькофф - обычный payload с токеном (исключаем customBrokerName)
            submitData = {
                broker: formik.values.broker,
                token: formik.values.token
            };
        }

        dispatch(postBrokerApiTokenThunk({
            data: submitData,
            isOther: Boolean(isOtherBroker || isStandardBroker),
            onSuccess: () => {
                dispatch(openModal({ type: ModalType.INFO, animation: ModalAnimation.BOTTOM, size: ModalSize.MC }))
            }
        }))
    }

    return (
        <form className={styles.form}>
            {/* Выбор рынка */}
            {/* <h2 className={styles.subtitle}>Выбор рынка <span style={{ color: 'red' }}>*</span></h2>
            <CheckboxGroup
                name="market"
                direction='row'
                // Пример опций
                options={[
                    { label: 'Российский', value: 'market_russian' },
                    { label: 'Глобальный', value: 'market_global' },
                ]}
                value={formik.values.market}
                onChange={(name, value) => formik.setFieldValue(name, value)}
            /> */}

            {device !== 'desktop' && (
                <>
                    <Select
                        items={brokersItems}
                        value={formik.values.broker}
                        onChange={(val) => {
                            formik.setFieldValue('broker', val)
                            if (val !== 'other') {
                                formik.setFieldValue('customBrokerName', '')
                            }
                            if (val !== 'tinkoff_brokers') {
                                formik.setFieldValue('token', '')
                            }
                        }}
                        needValue
                        title='Выберите бокера'
                        label='Выбор брокера'
                        error={formik.touched.broker && formik.errors.broker}
                    />

                    {formik.values.broker === 'other' && (
                        <div style={{ marginTop: '16px' }}>
                            <Input
                                placeholder="Название брокера"
                                name="customBrokerName"
                                type="text"
                                value={formik.values.customBrokerName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.customBrokerName && formik.errors.customBrokerName}
                                needValue
                            />
                        </div>
                    )}
                </>
            )}


            <div className={styles.desktop__container}>
                <div className={styles.desktop__item}>
                    <p className={styles.broker__description}>Создайте брокерский счет и получите в личном кабинете ключи, которые позволят подключить ваш торговый счет. Подробнее в PDF.</p>
                    <div className={styles.broker__instruction}>
                        <Icon Svg={PdfIcon} width={37} height={37} /> <span className={styles.broker__instruction__text} onClick={() => dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW_PDF, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))}>Инструкция подключения к брокеру</span>
                    </div>
                </div>
                <div className={styles.desktop__item}>
                    {device === 'desktop' && (
                        <>
                            <Select
                                items={brokersItems}
                                value={formik.values.broker}
                                onChange={(val) => {
                                    formik.setFieldValue('broker', val)
                                    if (val !== 'other') {
                                        formik.setFieldValue('customBrokerName', '')
                                    }
                                    if (val !== 'tinkoff_brokers') {
                                        formik.setFieldValue('token', '')
                                    }
                                }}
                                needValue
                                title='Выберите бокера'
                                label='Выбор брокера'
                                error={formik.touched.broker && formik.errors.broker}
                            />

                            {formik.values.broker === 'other' && (
                                <div style={{ marginTop: '16px' }}>
                                    <Input
                                        placeholder="Название брокера"
                                        name="customBrokerName"
                                        type="text"
                                        value={formik.values.customBrokerName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.customBrokerName && formik.errors.customBrokerName}
                                        needValue
                                    />
                                </div>
                            )}
                        </>
                    )}
                    <div className={styles.broker__site}>
                        {formik.values.broker === 'tinkoff_brokers' && (
                            <span className={styles.broker__site__title}> Личный кабинет на сайте брокера</span>
                        )}
                        <Button
                            onClick={
                                formik.values.broker === 'tinkoff_brokers'
                                    ? () => window.open(tinkoffExternalLink, '_blank')
                                    : handleSubmit
                            }
                            className={styles.broker__site__button}
                            children='Подключить брокера'
                            theme={ButtonTheme.UNDERLINE}
                            padding='19px 42px'
                            disabled={
                                !formik.values.broker ||
                                formik.values.broker === '' ||
                                (formik.values.broker === 'other' && !formik.values.customBrokerName.trim())
                            }
                        />
                    </div>
                </div>
            </div>

            {formik.values.broker === 'tinkoff_brokers' && (
                <div className={styles.desktop__container}>
                    <div className={styles.broker__container}>
                        <div>
                            <h2 className={styles.broker__title}>Реквизиты для подключения</h2>

                            <Input
                                placeholder="Токен"
                                name="token"
                                type='password'
                                value={formik.values.token}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.token && formik.errors.token}
                                needValue
                            />
                        </div>

                        {/* Кнопка подтверждения */}
                        <div className={styles.desktop__broker__item}>
                            <Button
                                theme={ButtonTheme.BLUE}
                                className={styles.submitButton}
                                padding='19px 70px'
                                disabled={!(formik.isValid && formik.dirty)}
                                onClick={handleSubmit}

                            >
                                Подтвердить токен
                            </Button>

                            <Button
                                type="button"
                                theme={ButtonTheme.EMPTYBLUE}
                                className={styles.problemButton}
                                onClick={() => dispatch(openModal({ type: ModalType.PROBLEM, animation: ModalAnimation.BOTTOM, size: ModalSize.MINI }))}
                            >
                                Проблемы с подключением?
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Реквизиты для подключения */}

            <DocumentPreviewModal title={!brokerIds[0] ? 'Инструкция подключения к брокеру' : 'Согласие на передачу API ключа к брокерскому счету'} isOpen={modalState.documentsPreview.isOpen} onClose={() => {
                dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW))
            }} docId='type_doc_broker_api_token' />

            <DocumentsPreviewPdfModal
                pdfUrl={brokerInstructionPDF}
                isOpen={modalState.documentsPreviewPdf.isOpen}
                onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_PDF))}

            />

            <ProblemsModal isOpen={modalState.problem.isOpen} title='Проблемы с подключением брокера' problemScreen='Подключение брокера'
                onClose={() => {
                    dispatch(closeModal(ModalType.PROBLEM));
                }} />
            <InfoModal
                isOpen={modalState.info.isOpen}
                title='Завершающий шаг'
                description='Для предоставления услуги необходимо подписать документ «Согласие на передачу API ключа к брокерскому счету»'
                buttonText='Перейти к подписи'
                action={() => {
                    // if (isBulk) {
                    //     navigate('/documents')
                    //     dispatch(setCurrentConfirmableDoc('type_doc_broker_api_token'))
                    //     dispatch(closeModal(ModalType.INFO));
                    //     dispatch(closeModal(ModalType.IDENTIFICATION))
                    // } else {
                    //     navigate('/documents')
                    //     dispatch(setCurrentConfirmableDoc('type_doc_broker_api_token'))
                    //     dispatch(setStepAdditionalMenuUI(4))
                    //     dispatch(closeModal(ModalType.INFO));
                    // }
                    navigate('/documents')
                    dispatch(setCurrentConfirmableDoc('type_doc_broker_api_token'))
                    dispatch(setStepAdditionalMenuUI(4))
                    dispatch(closeModal(ModalType.INFO));

                }}
                onClose={() => {
                    dispatch(closeModal(ModalType.INFO));
                }} />
        </form>
    );
};

