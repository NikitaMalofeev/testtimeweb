// src/pages/BrokerConnectionForm/BrokerConnectionForm.tsx

import React from 'react';
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

export const BrokerConnectionForm: React.FC = () => {
    const dispatch = useAppDispatch();

    const brokersItems = [
        {
            value: 'tinkoff_broker',
            label: 'Тинькофф инвестиции'
        }
    ]

    const tinkoffExternalLink = 'https://www.tbank.ru/invest/'

    // Схема валидации для формы
    const validationSchema = Yup.object().shape({
        market: Yup.string().required('Обязательное поле'),
        brokerName: Yup.string().required('Обязательное поле'),
        token: Yup.string().required('Обязательное поле'),
        tokenName: Yup.string().required('Обязательное поле'),
    });

    // Инициализируем Formik
    const formik = useFormik({
        initialValues: {
            market: '',       // 'russian' или 'global'
            brokerName: '',
            token: '',
            tokenName: '',
        },
        validationSchema,
        onSubmit: (values) => {
            console.log(formik.values)
        },
        enableReinitialize: true, // чтобы при обновлении brokerState форма обновлялась
    });

    return (
        <form className={styles.form} onSubmit={formik.handleSubmit}>
            {/* Выбор рынка */}
            <h2 className={styles.subtitle}>Выбор рынка</h2>
            <CheckboxGroup
                name="market"
                direction='row'
                // Пример опций
                options={[
                    { label: 'Российский', value: 'russian' },
                    { label: 'Глобальный', value: 'global' },
                ]}
                value={formik.values.market}
                onChange={(name, value) => formik.setFieldValue(name, value)}
            />

            <Select
                items={brokersItems}
                value={formik.values.brokerName}
                onChange={(val) => {
                    formik.setFieldValue('brokerName', val)
                }}
                needValue
                title='Выберите бокера'
                label='Выбор брокера'
                error={formik.touched.brokerName && formik.errors.brokerName}
            />

            <p className={styles.broker__description}>Создайте брокерский счет и получите в личном кабинете ключи, которые позволят подключить ваш торговый счет. Подробнее в PDF.</p>
            <div className={styles.broker__instruction}>
                <Icon Svg={PdfIcon} width={37} height={37} /> <span className={styles.broker__instruction__text}>Инструкция подключения к брокеру</span>
            </div>

            <div className={styles.broker__site}>
                <span className={styles.broker__site__title}> Личный кабинет на сайте брокера</span>
                <Button onClick={() => window.open(tinkoffExternalLink, '_blank')} className={styles.broker__site__button} children='Перейти на сайт брокера' theme={ButtonTheme.UNDERLINE} padding='19px 42px' />
            </div>

            {/* Реквизиты для подключения */}
            <div className={styles.broker__container}>
                <h2 className={styles.broker__title}>Реквизиты для подключения</h2>

                <Input
                    placeholder="Токен"
                    name="token"
                    value={formik.values.token}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.token && formik.errors.token}
                    needValue
                />

                {/* Кнопка подтверждения */}
                <Button
                    type="submit"
                    theme={ButtonTheme.BLUE}
                    className={styles.submitButton}
                    padding='19px 70px'

                >
                    Подтвердить код
                </Button>

                <Button
                    type="button"
                    theme={ButtonTheme.EMPTYBLUE}
                    className={styles.submitButton}
                >
                    Проблемы с подключением?
                </Button>
            </div>
        </form>
    );
};
