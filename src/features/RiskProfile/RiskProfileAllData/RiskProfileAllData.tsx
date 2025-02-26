import { useEffect } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { fetchAllSelects } from 'entities/RiskProfile/slice/riskProfileSlice';



export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();

    const allUserData = useSelector(
        (state: RootState) => state.user.allUserDataForDocuments
    );

    const allSelects = useSelector(
        (state: RootState) => state.riskProfile.riskProfileSelectors
    );

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchAllSelects() as any);
    }, [dispatch]);

    const riskProfileMapping: Record<string, string> = {
        risk_prof_conservative: 'Консервативный',
        risk_prof_conservative_moderately: 'Умеренно-консервативный',
        risk_prof_balanced: 'Сбалансированный',
        risk_prof_aggressive_moderately: 'Умеренно-агрессивный',
        risk_prof_aggressive: 'Агрессивный',
        risk_prof_aggressive_super: 'Супер-агрессивный',
    };

    const getRiskProfileTranslated = (code: string | undefined): string => {
        if (!code) return 'Не указано';
        return riskProfileMapping[code] ?? code;
    };

    const getTranslatedValue = (dictionary: Record<string, string> | undefined, code: string | undefined): string => {
        if (!dictionary || !code) {
            return '';
        }
        return dictionary[code] ?? code;
    }
    const formatCurrency = (value: string | number | undefined): string => {
        if (!value) return 'Не указано';
        const numberValue = Number(value);
        if (isNaN(numberValue)) return String(value);
        return numberValue.toLocaleString('ru-RU') + ' ₽';
    };

    const renderField = (label: string, value: string | undefined) => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>{label}</span>
            <span className={styles.page__answer}>{value ?? 'Не указано'}</span>
        </div>
    );

    const renderCurrencyField = (label: string, value: string | number | undefined) => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>{label}</span>
            <span className={styles.page__answer}>{formatCurrency(value)}</span>
        </div>
    );

    const renderCurrencyPotentialField = (label: string, value: string | number | undefined, valuePersent: string) => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>{label}</span>
            <span className={styles.page__answer}>{formatCurrency(value)}</span>
            <span className={styles.page__answer}>{valuePersent}</span>
        </div>
    );

    const renderTrustedPersonField = () => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>2. Доверенное лицо</span>
            <div style={{ display: 'flex' }}>
                <span>{allUserData?.trusted_person_fio}</span>
            </div>
            <span>{allUserData?.trusted_person_phone}</span>
            <span>{allUserData?.trusted_person_other_contact}</span>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.page__item}>
                <h2 className={styles.page__subtitle}>Идентификация</h2>
                {renderField('Фамилия', allUserData?.last_name)}
                {renderField('Имя', allUserData?.first_name)}
                {renderField('Отчество', allUserData?.patronymic)}
                {renderField('Номер телефона', allUserData?.phone)}
            </div>

            <div className={styles.page__item}>
                <h2 className={styles.page__subtitle}>Риск-профилирование</h2>
                {renderField('1. Гражданство', getTranslatedValue(allSelects?.countries, allUserData?.citizenship))}
                {renderTrustedPersonField()}
                {renderField(
                    '3. Статус квалифицированного инвестора',
                    allUserData?.is_qualified_investor_status ? 'Да' : 'Нет'
                )}

                {renderField(
                    '4. Валюта инвестирования',
                    getTranslatedValue(allSelects?.currency_investment, allUserData?.currency_investment)
                )}

                {renderField(
                    '5. Возраст',
                    getTranslatedValue(allSelects?.age_parameters, allUserData?.age_parameters)
                )}

                {renderField(
                    '6. Ваше образование',
                    getTranslatedValue(allSelects?.education, allUserData?.education)
                )}

                {renderField(
                    '7. Срок инвестирования, в течение, которого вы не планируете вносить существенные изменения в свой инвестиционный портфель',
                    getTranslatedValue(allSelects?.investment_period, allUserData?.investment_period)
                )}

                {renderField(
                    '8. Цели инвестирования',
                    getTranslatedValue(allSelects?.invest_target, allUserData?.invest_target)
                )}

                {renderField(
                    '9. Объем ваших среднемесячных доходов (за последние 12 месяцев)',
                    getTranslatedValue(allSelects?.monthly_income, allUserData?.monthly_income)
                )}

                {renderField(
                    '10.Информация о ваших среднемесячных расходах (за последние 12 месяцев)',
                    getTranslatedValue(allSelects?.monthly_expense, allUserData?.monthly_expense)
                )}

                {renderField(
                    '11. Информация о наличии и сумме сбережений',
                    getTranslatedValue(allSelects?.savings_level, allUserData?.savings_level)
                )}

                {renderField(
                    '12. Как вы оцениваете свой опыт (знания) в области инвестирования',
                    getTranslatedValue(allSelects?.investment_experience, allUserData?.investment_experience)
                )}

                {renderField(
                    '13. Практический опыт в области инвестирования, в том числе опыт работы в организациях, осуществляющих деятельность на фондовом рынке',
                    getTranslatedValue(allSelects?.practical_investment_experience, allUserData?.practical_investment_experience)
                )}

                {renderField(
                    '14. Как Вы поступите, если Ваши активы из-за рыночных потрясений потеряют более 20% стоимости?',
                    getTranslatedValue(allSelects?.question_assets_losing_value, allUserData?.question_assets_losing_value)
                )}

                {renderField(
                    '15. Планируемые будущие ежегодные доходы',
                    getTranslatedValue(allSelects?.planned_future_income, allUserData?.planned_future_income)
                )}

                {renderField(
                    '16. Информация о Ваших текущих имущественных обязательствах и их соотношение с текущими доходами?',
                    getTranslatedValue(allSelects?.current_loans, allUserData?.current_loans)
                )}

                {renderField(
                    '17. Сведения о наличии существенных имущественных обязательств, которые сохранят свое действие в течение периода не менее, чем инвестиционный горизонт',
                    getTranslatedValue(allSelects?.obligations_invest_horizon, allUserData?.obligations_invest_horizon)
                )}

                {renderField(
                    '18. Доход от Ваших инвестиций предназначен для',
                    getTranslatedValue(allSelects?.income_investments_intended, allUserData?.income_investments_intended)
                )}

                {renderField(
                    '19. Информация о доходности на которую Вы рассчитываете и допустимом риске убытков от таких операций',
                    getTranslatedValue(allSelects?.profit_expect, allUserData?.profit_expect)
                )}
            </div>


            <h2 className={styles.page__subtitle}>Уточнение риск профиля</h2>
            {renderCurrencyField('Баланс портфеля', '0')}
            {renderCurrencyField('Деньги', `${allUserData?.risk_more_amount_expected_replenishment}`)}
            {renderField(
                'Параметры портфеля',
                getRiskProfileTranslated(allUserData?.risk_more_portfolio_parameters)
            )}
            {renderCurrencyPotentialField('Возможная потеря', `${allUserData?.risk_more_possible_loss}`, `${allUserData?.risk_more_possible_loss_percent}`)}
            {renderCurrencyPotentialField('Потенциальный доход', `${allUserData?.risk_more_potential_income}`, `${allUserData?.risk_more_potential_income_percent}`)}
        </div>
    );
};
