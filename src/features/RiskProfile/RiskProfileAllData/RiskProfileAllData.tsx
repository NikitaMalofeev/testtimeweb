import { useEffect } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';

export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();

    const allUserData = useSelector(
        (state: RootState) => state.user.allUserDataForDocuments
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

    return (
        <div className={styles.page}>
            <div className={styles.page__item}>
                <h2 className={styles.page__subtitle}>Паспортные данные</h2>
                {renderField('Фамилия', allUserData?.last_name)}
                {renderField('Имя', allUserData?.first_name)}
                {renderField('Отчество', allUserData?.patronymic)}
                {renderField('Пол', allUserData?.gender === 'male' ? 'Мужской' : 'Женский')}
                {renderField('Дата рождения', allUserData?.birth_date)}
                {renderField('Место рождения', allUserData?.city)}
                {renderField('Серия и номер паспорта', '9423 425793')}
                {renderField('Код подразделения', '150-007')}
                {renderField('Дата выдачи', '17.09.2012')}
                {renderField('Кем выдан', 'Отделением отдела УФМС РФ по г.Тамбов')}
                {renderField('ИНН', '174787273304')}
            </div>

            <div className={styles.page__item}>
                <h2 className={styles.page__subtitle}>Адрес регистрации</h2>
                {renderField('Регион', allUserData?.region)}
                {renderField('Город', allUserData?.city)}
                {renderField('Улица', allUserData?.street)}
                {renderField('Дом', allUserData?.house)}
                {renderField('Квартира', allUserData?.apartment)}
            </div>

            <div className={styles.page__item}>
                <h2 className={styles.page__subtitle}>Адрес проживания</h2>
                {renderField('Регион', allUserData?.address_residential_region)}
                {renderField('Город', allUserData?.address_residential_city)}
                {renderField('Улица', allUserData?.address_residential_street)}
                {renderField('Дом', allUserData?.address_residential_house)}
                {renderField('Квартира', allUserData?.address_residential_apartment)}
            </div>
        </div>
    );
};
