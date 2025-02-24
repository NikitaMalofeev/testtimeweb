import { useEffect } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';

export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();
    const allUserData = useSelector((state: RootState) => state.user.allUserDataForDocuments);

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
    }, [dispatch]);

    return (
        <div className={styles.RiskProfileAllData}>
            <h2>Идентификация</h2>
            <p><strong>Фамилия:</strong> {allUserData?.last_name}</p>
            <p><strong>Имя:</strong> {allUserData?.first_name}</p>
            <p><strong>Отчество:</strong> {allUserData?.patronymic ?? 'Не указано'}</p>
            <p><strong>Номер телефона:</strong> {allUserData?.phone}</p>

            <h2>Риск-профилирование</h2>
            <p><strong>Гражданство:</strong> {allUserData?.citizenship}</p>
            <p><strong>Статус квалифицированного инвестора:</strong> {allUserData?.is_qualified_investor_status ? 'Да' : 'Нет'}</p>
            <p><strong>Валюта инвестирования:</strong> {allUserData?.currency_investment}</p>
            <p><strong>Возраст:</strong> {allUserData?.age_parameters}</p>
            <p><strong>Образование:</strong> {allUserData?.education}</p>
            <p><strong>Опыт инвестирования:</strong> {allUserData?.investment_experience}</p>
            <p><strong>Практический опыт:</strong> {allUserData?.practical_investment_experience}</p>
            <p><strong>Инвестиционный период:</strong> {allUserData?.investment_period}</p>
            <p><strong>Цель инвестирования:</strong> {allUserData?.invest_target}</p>
            <p><strong>Ожидаемая прибыль:</strong> {allUserData?.profit_expect}</p>
            <p><strong>Возможная потеря:</strong> {allUserData?.risk_more_possible_loss} ₽</p>
            <p><strong>Потенциальный доход:</strong> {allUserData?.risk_more_potential_income} ₽</p>
            <p><strong>Профиль риска:</strong> {allUserData?.risk_more_portfolio_parameters}</p>
            <p><strong>Рекомендуемые профили риска:</strong> {Object.values(allUserData?.risk_profiling_recommended_profiles || {}).join(', ')}</p>
            <p><strong>Описание профиля риска:</strong> {allUserData?.risk_profiling_text}</p>

            <h2>Паспортные данные</h2>
            <p><strong>Пол:</strong> {allUserData?.gender === 'gender_male' ? 'Мужской' : 'Женский'}</p>
            <p><strong>Дата рождения:</strong> {allUserData?.birth_date}</p>

            <h2>Адрес регистрации</h2>
            <p><strong>Регион:</strong> {allUserData?.region}</p>
            <p><strong>Город:</strong> {allUserData?.city}</p>
            <p><strong>Улица:</strong> {allUserData?.street}</p>
            <p><strong>Дом:</strong> {allUserData?.house}</p>
            <p><strong>Квартира:</strong> {allUserData?.apartment}</p>

            <h2>Адрес проживания</h2>
            <p><strong>Совпадает с адресом регистрации:</strong> {allUserData?.is_live_this_address ? 'Да' : 'Нет'}</p>
            {!allUserData?.is_live_this_address && (
                <>
                    <p><strong>Регион проживания:</strong> {allUserData?.address_residential_region}</p>
                    <p><strong>Город проживания:</strong> {allUserData?.address_residential_city}</p>
                    <p><strong>Улица проживания:</strong> {allUserData?.address_residential_street}</p>
                    <p><strong>Дом проживания:</strong> {allUserData?.address_residential_house}</p>
                    <p><strong>Квартира проживания:</strong> {allUserData?.address_residential_apartment}</p>
                </>
            )}

            <h2>Дополнительная информация</h2>
            <p><strong>Доход в месяц:</strong> {allUserData?.monthly_income}</p>
            <p><strong>Ежемесячные расходы:</strong> {allUserData?.monthly_expense}</p>
            <p><strong>Сумма сбережений:</strong> {allUserData?.savings_level}</p>
            <p><strong>Планируемый доход в будущем:</strong> {allUserData?.planned_future_income}</p>
            <p><strong>Текущие кредиты:</strong> {allUserData?.current_loans}</p>

            <h2>Доверенное лицо</h2>
            <p><strong>ФИО:</strong> {allUserData?.trusted_person_fio}</p>
            <p><strong>Телефон:</strong> {allUserData?.trusted_person_phone}</p>
            <p><strong>Дополнительный контакт:</strong> {allUserData?.trusted_person_other_contact}</p>
        </div>
    );
};
