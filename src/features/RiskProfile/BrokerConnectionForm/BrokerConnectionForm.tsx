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


// Стили (пример, вы можете адаптировать под себя)
import styles from './styles.module.scss';
import { CheckboxGroup } from 'shared/ui/CheckboxGroup/CheckboxGroup';
import { Select } from 'shared/ui/Select/Select';

export const BrokerConnectionForm: React.FC = () => {
    const dispatch = useAppDispatch();


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
            <h2 className={styles.title}>Выбор рынка</h2>
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
            {formik.touched.market && formik.errors.market && (
                <div className={styles.error}>{formik.errors.market}</div>
            )}

            {/* Выбор брокера */}
            <h2 className={styles.title}>Выбор брокера*</h2>
            {/* <Select
                placeholder="Название российского брокера"
                name="brokerName"
                value={formik.values.brokerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.brokerName && formik.errors.brokerName}
            /> */}

            {/* Инструкция подключения (PDF) + кнопка перехода */}
            <div className={styles.instructionWrapper}>
                <div className={styles.pdfIcon}>
                    {/* Замените на свой реальный путь к иконке PDF */}
                    <img src="/assets/pdf-icon.svg" alt="PDF" />
                </div>
                <span className={styles.instructionText}>Инструкция подключения к брокеру</span>
            </div>
            <a
                className={styles.link}
                href="https://example.com/broker-instruction.pdf"
                target="_blank"
                rel="noopener noreferrer"
            >
                Перейти на сайт брокера
            </a>

            {/* Реквизиты для подключения */}
            <h2 className={styles.subtitle}>Реквизиты для подключения</h2>

            <Input
                placeholder="Токен"
                name="token"
                value={formik.values.token}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.token && formik.errors.token}
            />
            <Input
                placeholder="Название токена"
                name="tokenName"
                value={formik.values.tokenName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.tokenName && formik.errors.tokenName}
            />

            {/* Кнопка подтверждения */}
            <Button
                type="submit"
                theme={ButtonTheme.BLUE}
                className={styles.submitButton}
            >
                Подтвердить код
            </Button>

            {/* Ссылка "Проблемы с подключением?" (можно сделать кнопкой, чтобы открыть модалку) */}
            <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                    // Открываем модалку или что-то ещё
                    alert('Открыть модалку "Проблемы с подключением"');
                }}
            >
                Проблемы с подключением?
            </button>
        </form>
    );
};
