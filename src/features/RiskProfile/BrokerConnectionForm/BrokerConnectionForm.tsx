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
import { postBrokerApiTokenThunk, firstSelectBrokerThunk, thirdSetBrokerTokenThunk, setIsBrokerTokenSent } from 'entities/RiskProfile/slice/riskProfileSlice';
import { useSelector as useReduxSelector } from 'react-redux';
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
    const { brokerIds, currentConfirmableDoc } = useSelector((state: RootState) => state.documents)
    const device = useDevice()
    const isBulk = useSelector((s: RootState) => s.user.userPersonalAccountInfo?.is_confirm_all_documents_one_code)
    const firstBrokerSelect = useSelector((s: RootState) => s.riskProfile.firstBrokerSelect)

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

    // Проверяем тип документа для определения режима формы
    const isFirstSelect = currentConfirmableDoc === 'type_doc_agreement_account_maintenance';
    const isSecondSelect = currentConfirmableDoc === 'type_doc_agreement_transfer_broker';

    // Проверяем, нужно ли показывать только форму ввода токена (для Тинькофф при type_doc_agreement_transfer_broker)
    const isTinkoffTokenEntry = isSecondSelect && firstBrokerSelect?.broker_value === 'tinkoff_brokers';

    // Получаем название выбранного брокера для отображения
    const getSelectedBrokerLabel = () => {
        const brokerValue = firstBrokerSelect?.broker_value;
        const broker = brokersItems.find(b => b.value === brokerValue);
        return broker?.label || firstBrokerSelect?.broker_name || 'Выбранный брокер';
    };

    const tinkoffExternalLink = 'https://www.tbank.ru/invest/'

    // Схема валидации для формы
    // Для first_select (доверенность) - токен НЕ требуется
    // Для second_select (API ключ) и Тинькофф - токен требуется
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
            then: (schema) => isFirstSelect ? schema.notRequired() : schema.required('Обязательное поле'),
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
        const isTinkoffBroker = formik.values.broker === 'tinkoff_brokers';

        // Проверяем, какой документ сейчас открыт
        const isAgreementAccountMaintenance = currentConfirmableDoc === 'type_doc_agreement_account_maintenance';
        const isBrokerApiToken = currentConfirmableDoc === 'type_doc_agreement_transfer_broker';

        // Для Тинькофф при вводе токена (isTinkoffTokenEntry) - отправляем thirdSetBrokerToken и переходим к подписанию
        if (isTinkoffTokenEntry && firstBrokerSelect?.broker_id) {
            dispatch(thirdSetBrokerTokenThunk({
                broker_id: firstBrokerSelect.broker_id,
                token: formik.values.token,
                onSuccess: () => {
                    // Устанавливаем флаг что токен отправлен
                    dispatch(setIsBrokerTokenSent(true));
                    // После успешной отправки токена переходим к подписанию документа
                    dispatch(setCurrentConfirmableDoc('type_doc_agreement_transfer_broker'));
                    dispatch(setStepAdditionalMenuUI(4));
                },
                onError: (error) => {
                    console.error('Error setting broker token:', error);
                }
            }));
            return;
        }

        if (isAgreementAccountMaintenance) {
            // Если брокер уже выбран (firstBrokerSelect существует), сразу переходим к подписанию
            if (firstBrokerSelect?.broker_id) {
                navigate('/documents');
                dispatch(setCurrentConfirmableDoc('type_doc_agreement_account_maintenance'));
                dispatch(setStepAdditionalMenuUI(4));
                dispatch(closeModal(ModalType.IDENTIFICATION));
                return;
            }

            // Для доверенности (type_doc_agreement_account_maintenance) используем firstSelectBrokerThunk
            dispatch(firstSelectBrokerThunk({
                broker: formik.values.broker,
                onSuccess: (response) => {
                    // После успешного выбора брокера сохраняем broker_id и переходим к подписанию
                    if (response && response.broker_id) {
                        // Сохраняем broker_id для дальнейшего использования
                        // broker_id будет использован в ConfirmAllDocs для генерации кода
                        navigate('/documents');
                        dispatch(setCurrentConfirmableDoc('type_doc_agreement_account_maintenance'));
                        dispatch(setStepAdditionalMenuUI(4));
                        dispatch(closeModal(ModalType.IDENTIFICATION));
                    }
                },
                onError: (error) => {
                    console.error('Error selecting broker:', error);
                }
            }));
        } else if (isBrokerApiToken && isTinkoffBroker) {
            // Для API ключа Тинькофф используем thirdSetBrokerTokenThunk
            // Используем firstBrokerSelect если есть, иначе brokerIds[0]
            const effectiveBrokerId = firstBrokerSelect?.broker_id || brokerIds[0];
            if (effectiveBrokerId) {
                dispatch(thirdSetBrokerTokenThunk({
                    broker_id: effectiveBrokerId,
                    token: formik.values.token,
                    onSuccess: () => {
                        dispatch(openModal({ type: ModalType.INFO, animation: ModalAnimation.BOTTOM, size: ModalSize.MC }));
                    },
                    onError: (error) => {
                        console.error('Error setting broker token:', error);
                    }
                }));
            }
        } else {
            // Для других брокеров (другой брокер, стандартный) используем старую логику
            let submitData;

            if (isOtherBroker) {
                submitData = {
                    broker: "other_unknown_broker",
                    description_from_user: formik.values.customBrokerName
                };
            } else if (isStandardBroker) {
                submitData = {
                    broker: formik.values.broker,
                    description_from_user: ""
                };
            } else {
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
            }));
        }
    }

    // Если это ввод токена для Тинькофф (type_doc_agreement_transfer_broker)
    if (isTinkoffTokenEntry) {
        return (
            <form className={styles.form}>
                <div className={styles.desktop__container}>
                    <div className={styles.broker__container}>
                        <div>
                            <h2 className={styles.broker__title}>Выбранный брокер: {getSelectedBrokerLabel()}</h2>
                            <p className={styles.broker__description}>Введите токен для подключения к брокерскому счету</p>

                            <div className={styles.broker__instruction}>
                                <Icon Svg={PdfIcon} width={37} height={37} />
                                <span className={styles.broker__instruction__text} onClick={() => dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW_PDF, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))}>
                                    Инструкция подключения к брокеру
                                </span>
                            </div>

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

                        <div className={styles.desktop__broker__item}>
                            <Button
                                theme={ButtonTheme.BLUE}
                                className={styles.submitButton}
                                padding='19px 70px'
                                disabled={!formik.values.token}
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

                <DocumentsPreviewPdfModal
                    pdfUrl={brokerInstructionPDF}
                    isOpen={modalState.documentsPreviewPdf.isOpen}
                    onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_PDF))}
                />

                <ProblemsModal
                    isOpen={modalState.problem.isOpen}
                    title='Проблемы с подключением брокера'
                    problemScreen='Подключение брокера'
                    onClose={() => dispatch(closeModal(ModalType.PROBLEM))}
                />

                <InfoModal
                    isOpen={modalState.info.isOpen}
                    title='Токен подключен'
                    description='Токен брокера успешно подключен. Теперь вы можете подписать документ.'
                    buttonText='Перейти к подписи'
                    action={() => {
                        navigate('/documents')
                        dispatch(setCurrentConfirmableDoc('type_doc_agreement_transfer_broker'))
                        dispatch(setStepAdditionalMenuUI(4))
                        dispatch(closeModal(ModalType.INFO));
                        dispatch(closeModal(ModalType.IDENTIFICATION))
                    }}
                    onClose={() => dispatch(closeModal(ModalType.INFO))}
                />
            </form>
        );
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
                    <p className={styles.broker__description}>Создайте брокерский счет и получите в личном кабинете ключи, которые позволят подключить ваш торговый счет</p>
                    {formik.values.broker === 'tinkoff_brokers' && (
                        <div className={styles.broker__instruction}>
                            <Icon Svg={PdfIcon} width={37} height={37} /> <span className={styles.broker__instruction__text} onClick={() => dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW_PDF, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))}>Инструкция подключения к брокеру</span>
                        </div>
                    )}
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
                        {formik.values.broker === 'tinkoff_brokers' && !isFirstSelect && (
                            <span className={styles.broker__site__title}> Личный кабинет на сайте брокера</span>
                        )}
                        <Button
                            onClick={
                                formik.values.broker === 'tinkoff_brokers' && !isFirstSelect
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

            {formik.values.broker === 'tinkoff_brokers' && !isFirstSelect && (
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
            }} docId='type_doc_agreement_transfer_broker' />

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
                    //     dispatch(setCurrentConfirmableDoc('type_doc_agreement_transfer_broker'))
                    //     dispatch(closeModal(ModalType.INFO));
                    //     dispatch(closeModal(ModalType.IDENTIFICATION))
                    // } else {
                    //     navigate('/documents')
                    //     dispatch(setCurrentConfirmableDoc('type_doc_agreement_transfer_broker'))
                    //     dispatch(setStepAdditionalMenuUI(4))
                    //     dispatch(closeModal(ModalType.INFO));
                    // }
                    navigate('/documents')
                    dispatch(setCurrentConfirmableDoc('type_doc_agreement_transfer_broker'))
                    dispatch(setStepAdditionalMenuUI(4))
                    dispatch(closeModal(ModalType.INFO));

                }}
                onClose={() => {
                    dispatch(closeModal(ModalType.INFO));
                }} />
        </form>
    );
};

