import { useEffect } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { fetchAllSelects } from 'entities/RiskProfile/slice/riskProfileSlice';

// 1. Вспомогательная функция (можно вынести её в отдельный файл util)
function getTranslatedValue(dictionary: Record<string, string> | undefined, code: string | undefined): string {
    if (!dictionary || !code) {
        return '';
    }
    return dictionary[code] ?? code;
}

export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();

    // Селектим данные о пользователе
    const allUserData = useSelector(
        (state: RootState) => state.user.allUserDataForDocuments
    );

    // Селектим наши словари (результат fetchAllSelects)
    const allSelects = useSelector(
        (state: RootState) => state.riskProfile.riskProfileSelectors
    );

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchAllSelects() as any);
    }, [dispatch]);

    return (
        <div className={styles.page}>
            <h2 className={styles.page__subtitle}>Идентификация</h2>
            <p><strong>Фамилия:</strong> {allUserData?.last_name}</p>
            <p><strong>Имя:</strong> {allUserData?.first_name}</p>
            <p><strong>Отчество:</strong> {allUserData?.patronymic ?? 'Не указано'}</p>
            <p><strong>Номер телефона:</strong> {allUserData?.phone}</p>

            <h2 className={styles.page__subtitle}>Риск-профилирование</h2>
            <p><strong>Гражданство:</strong> {allUserData?.citizenship}</p>

            <h2>Доверенное лицо</h2>
            <p><strong>ФИО:</strong> {allUserData?.trusted_person_fio}</p>
            <p><strong>Телефон:</strong> {allUserData?.trusted_person_phone}</p>
            <p><strong>Дополнительный контакт:</strong> {allUserData?.trusted_person_other_contact}</p>
            <p><strong>Статус квалифицированного инвестора:</strong> {allUserData?.is_qualified_investor_status ? 'Да' : 'Нет'}</p>

            {/* Пример использования функции для перевода */}
            <p>
                <strong>Валюта инвестирования:</strong>{' '}
                {getTranslatedValue(allSelects?.currency_investment, allUserData?.currency_investment)}
            </p>

            <p>
                <strong>Возраст:</strong>{' '}
                {getTranslatedValue(allSelects?.age_parameters, allUserData?.age_parameters)}
            </p>

            <p>
                <strong>Образование:</strong>{' '}
                {getTranslatedValue(allSelects?.education, allUserData?.education)}
            </p>

            <p>
                <strong>Инвестиционный период:</strong>{' '}
                {getTranslatedValue(allSelects?.investment_period, allUserData?.investment_period)}
            </p>

            <p>
                <strong>Цель инвестирования:</strong>{' '}
                {getTranslatedValue(allSelects?.invest_target, allUserData?.invest_target)}
            </p>

            <p>
                <strong>Доход в месяц:</strong>{' '}
                {getTranslatedValue(allSelects?.monthly_income, allUserData?.monthly_income)}
            </p>

            <p>
                <strong>Ежемесячные расходы:</strong>{' '}
                {getTranslatedValue(allSelects?.monthly_expense, allUserData?.monthly_expense)}
            </p>

            <p>
                <strong>Сумма сбережений:</strong>{' '}
                {getTranslatedValue(allSelects?.savings_level, allUserData?.savings_level)}
            </p>

            <p>
                <strong>Как Вы поступите, если активы упадут больше чем на 20%:</strong>{' '}
                {getTranslatedValue(allSelects?.question_assets_losing_value, allUserData?.question_assets_losing_value)}
            </p>

            <p>
                <strong>Планируемый доход в будущем:</strong>{' '}
                {getTranslatedValue(allSelects?.planned_future_income, allUserData?.planned_future_income)}
            </p>

            <p>
                <strong>Текущие кредиты:</strong>{' '}
                {getTranslatedValue(allSelects?.current_loans, allUserData?.current_loans)}
            </p>

            <p>
                <strong>Существенные имущественные обязательства:</strong>{' '}
                {getTranslatedValue(allSelects?.obligations_invest_horizon, allUserData?.obligations_invest_horizon)}
            </p>

            <p>
                <strong>Доход от инвестиций предназначен для:</strong>{' '}
                {getTranslatedValue(allSelects?.income_investments_intended, allUserData?.income_investments_intended)}
            </p>

            <p>
                <strong>Ожидаемая прибыль:</strong>{' '}
                {getTranslatedValue(allSelects?.profit_expect, allUserData?.profit_expect)}
            </p>

            <h2>Уточнение риск профиля</h2>
            <p><strong>Баланс портфеля:</strong> 0 ₽</p>
            <p><strong>Деньги:</strong> {allUserData?.risk_more_amount_expected_replenishment}</p>
            <p><strong>Описание профиля риска:</strong> {allUserData?.risk_profiling_text}</p>
            <p><strong>Профиль риска:</strong> {allUserData?.risk_more_portfolio_parameters}</p>
            <p><strong>Возможная потеря:</strong> {allUserData?.risk_more_possible_loss} ₽</p>
            <p><strong>Потенциальный доход:</strong> {allUserData?.risk_more_potential_income} ₽</p>
            <p>
                <strong>Рекомендуемые профили риска:</strong>{' '}
                {Object.values(allUserData?.risk_profiling_recommended_profiles || {}).join(', ')}
            </p>

        </div>
    );
};
