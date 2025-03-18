import { useEffect } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { Loader } from 'shared/ui/Loader/Loader';

export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();

    const { allUserDataForDocuments, loading } = useSelector(
        (state: RootState) => state.user
    );

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
    }, [dispatch]);

    const renderField = (label: string, value: string | undefined) => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>{label}</span>
            <span className={styles.page__answer}>{value ?? 'Нет ответа'}</span>
        </div>
    );

    if (loading) {
        return (
            <Loader />
        )
    } else {
        return (
            <div className={styles.page}>
                <div className={styles.page__item}>
                    <h2 className={styles.page__subtitle}>Паспортные данные</h2>
                    {renderField('Фамилия', allUserDataForDocuments?.last_name)}
                    {renderField('Имя', allUserDataForDocuments?.first_name)}
                    {renderField('Отчество', allUserDataForDocuments?.patronymic)}
                    {renderField('Пол', allUserDataForDocuments?.gender === 'male' ? 'Мужской' : 'Женский')}
                    {renderField('Дата рождения', allUserDataForDocuments?.birth_date)}
                    {renderField('Место рождения', allUserDataForDocuments?.city)}
                    {renderField('Серия паспорта', allUserDataForDocuments?.passport_series)}
                    {renderField('Номер паспорта', allUserDataForDocuments?.passport_number)}
                    {renderField('Код подразделения', allUserDataForDocuments?.department_code)}
                    {renderField('Дата выдачи', allUserDataForDocuments?.issue_date)}
                    {renderField('Кем выдан', allUserDataForDocuments?.issue_whom)}
                    {renderField('ИНН', allUserDataForDocuments?.inn)}
                </div>

                <div className={styles.page__item}>
                    <h2 className={styles.page__subtitle}>Адрес регистрации</h2>
                    {renderField('Регион', allUserDataForDocuments?.region)}
                    {renderField('Город', allUserDataForDocuments?.city)}
                    {renderField('Улица', allUserDataForDocuments?.street)}
                    {renderField('Дом', allUserDataForDocuments?.house)}
                    {renderField('Квартира', allUserDataForDocuments?.apartment)}
                </div>

                <div className={styles.page__item}>
                    <h2 className={styles.page__subtitle}>Адрес проживания</h2>
                    {renderField('Регион', allUserDataForDocuments?.address_residential_region)}
                    {renderField('Город', allUserDataForDocuments?.address_residential_city)}
                    {renderField('Улица', allUserDataForDocuments?.address_residential_street)}
                    {renderField('Дом', allUserDataForDocuments?.address_residential_house)}
                    {renderField('Квартира', allUserDataForDocuments?.address_residential_apartment)}
                </div>
            </div>
        );
    }

};
