import { useEffect } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { Loader } from 'shared/ui/Loader/Loader';
import { getUserDocumentsInfoThunk } from 'entities/Documents/slice/documentsSlice';

export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();

    const { allUserDataForDocuments, loading, user } = useSelector(
        (state: RootState) => state.user
    );
    const { userPassportData } = useSelector((state: RootState) => state.documents);
    const { legalFormData } = useSelector((state: RootState) => state.riskProfile);

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
        dispatch(getUserDocumentsInfoThunk());
    }, [dispatch]);

    const renderField = (label: string, value?: string | null) => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>{label}</span>
            <span className={styles.page__answer}>{value ?? 'Нет ответа'}</span>
        </div>
    );

    if (loading) return <Loader />;

    const isLegal = user?.is_individual_entrepreneur;

    return (
        <div className={styles.page}>
            {isLegal && legalFormData ? (
                /* -------- ДАННЫЕ ЮР. ЛИЦА -------- */
                <>
                    <div className={styles.page__item}>
                        <h2 className={styles.page__subtitle}>Данные юридического лица</h2>

                        {renderField('Название компании', legalFormData.company_name)}
                        {renderField('Фамилия руководителя', legalFormData.last_name)}
                        {renderField('Имя руководителя', legalFormData.first_name)}
                        {renderField('Отчество руководителя', legalFormData.patronymic)}
                        {renderField('ИНН компании', legalFormData.company_inn)}
                        {renderField('КПП', legalFormData.company_kpp)}
                        {renderField('ОГРН', legalFormData.company_ogrn)}
                        {renderField('Расчётный счёт', legalFormData.company_payment_account)}
                        {renderField('Банк. счёт', legalFormData.company_bank_payment_account)}
                        {renderField('БИК банка', legalFormData.company_bank_bik)}
                        {renderField('Корр. счёт', legalFormData.company_bank_correspondent_account)}
                        {renderField('Телефон', legalFormData.phone)}
                        {renderField('Email', legalFormData.email)}



                    </div>

                    <div className={styles.page__item}>

                        {/* Юридический адрес */}
                        <h3 className={styles.page__subtitle}>Юридический адрес</h3>
                        {renderField('Регион', legalFormData.company_region)}
                        {renderField('Город', legalFormData.company_city)}
                        {renderField('Улица', legalFormData.company_street)}
                        {renderField('Дом', legalFormData.company_house)}
                        {renderField('Квартира', legalFormData.company_apartment)}
                    </div>

                    <div className={styles.page__item}>
                        {/* Почтовый адрес */}
                        <h2 className={styles.page__subtitle}>Почтовый адрес</h2>
                        {renderField('Регион', legalFormData.company_mailing_region)}
                        {renderField('Город', legalFormData.company_mailing_city)}
                        {renderField('Улица', legalFormData.company_mailing_street)}
                        {renderField('Дом', legalFormData.company_mailing_house)}
                        {renderField('Квартира', legalFormData.company_mailing_apartment)}
                    </div>
                </>
            ) : (
                <>
                    {/* -------- ПАСПОРТНЫЕ ДАННЫЕ -------- */}
                    <div className={styles.page__item}>
                        <h2 className={styles.page__subtitle}>Паспортные данные</h2>
                        {renderField('Фамилия', allUserDataForDocuments?.last_name)}
                        {renderField('Имя', allUserDataForDocuments?.first_name)}
                        {renderField('Отчество', allUserDataForDocuments?.patronymic)}
                        {renderField(
                            'Пол',
                            allUserDataForDocuments?.gender === 'gender_male'
                                ? 'Мужской'
                                : 'Женский'
                        )}
                        {renderField('Дата рождения', allUserDataForDocuments?.birth_date)}
                        {renderField('Место рождения', allUserDataForDocuments?.city)}
                        {renderField('Серия паспорта', userPassportData?.passport_series)}
                        {renderField('Номер паспорта', userPassportData?.passport_number)}
                        {renderField('Код подразделения', userPassportData?.department_code)}
                        {renderField('Дата выдачи', userPassportData?.issue_date)}
                        {renderField('Кем выдан', userPassportData?.issue_whom)}
                        {renderField('ИНН', userPassportData?.inn)}
                    </div>

                    {/* -------- АДРЕС РЕГИСТРАЦИИ -------- */}
                    <div className={styles.page__item}>
                        <h2 className={styles.page__subtitle}>Адрес регистрации</h2>
                        {renderField('Регион', allUserDataForDocuments?.region)}
                        {renderField('Город', allUserDataForDocuments?.city)}
                        {renderField('Улица', allUserDataForDocuments?.street)}
                        {renderField('Дом', allUserDataForDocuments?.house)}
                        {renderField('Квартира', allUserDataForDocuments?.apartment)}
                    </div>

                    {/* -------- АДРЕС ПРОЖИВАНИЯ (если отличается) -------- */}
                    {allUserDataForDocuments?.address_residential_region &&
                        allUserDataForDocuments?.address_residential_house && (
                            <div className={styles.page__item}>
                                <h2 className={styles.page__subtitle}>Адрес проживания</h2>
                                {renderField(
                                    'Регион',
                                    allUserDataForDocuments?.address_residential_region
                                )}
                                {renderField(
                                    'Город',
                                    allUserDataForDocuments?.address_residential_city
                                )}
                                {renderField(
                                    'Улица',
                                    allUserDataForDocuments?.address_residential_street
                                )}
                                {renderField(
                                    'Дом',
                                    allUserDataForDocuments?.address_residential_house
                                )}
                                {renderField(
                                    'Квартира',
                                    allUserDataForDocuments?.address_residential_apartment
                                )}
                            </div>
                        )}
                </>
            )}
        </div>
    );
};
