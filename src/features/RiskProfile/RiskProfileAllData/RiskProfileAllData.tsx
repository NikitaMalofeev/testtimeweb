import { useEffect, useMemo } from 'react';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllUserInfoThunk } from 'entities/User/slice/userSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { Loader } from 'shared/ui/Loader/Loader';
import { getUserDocumentsInfoThunk } from 'entities/Documents/slice/documentsSlice';
import { formatISOToRu } from 'shared/lib/helpers/isoToRu';

type Maybe<T> = T | undefined | null;

const pick = (...vals: Maybe<string>[]) =>
    vals.find(v => v !== undefined && v !== null && String(v).trim() !== '') ?? undefined;

export const RiskProfileAllData = () => {
    const dispatch = useAppDispatch();

    // userPersonalAccountInfo — более надёжный источник флага ИП
    const user = useSelector((s: RootState) => s.user.userPersonalAccountInfo);
    const { allUserDataForDocuments, loading } = useSelector((s: RootState) => s.user);

    const { userPassportData } = useSelector((s: RootState) => s.documents);
    const { legalFormData } = useSelector((s: RootState) => s.riskProfile);

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
        dispatch(getUserDocumentsInfoThunk());
    }, [dispatch]);

    // Фолбэк для юр-данных: сначала legalFormData, потом allUserDataForDocuments,
    // при необходимости — userPassportData (например, ИНН).
    const mergedLegal = useMemo(() => {
        return {
            // Основные реквизиты
            company_name: pick(legalFormData?.company_name, (allUserDataForDocuments as any)?.company_name),
            last_name: pick(legalFormData?.last_name, allUserDataForDocuments?.last_name),
            first_name: pick(legalFormData?.first_name, allUserDataForDocuments?.first_name),
            patronymic: pick(legalFormData?.patronymic, allUserDataForDocuments?.patronymic),

            company_inn: pick(legalFormData?.company_inn, (allUserDataForDocuments as any)?.company_inn, userPassportData?.inn),
            company_kpp: pick(legalFormData?.company_kpp, (allUserDataForDocuments as any)?.company_kpp),
            company_ogrn: pick(legalFormData?.company_ogrn, (allUserDataForDocuments as any)?.company_ogrn),

            company_payment_account: pick(legalFormData?.company_payment_account, (allUserDataForDocuments as any)?.company_payment_account),
            company_bank_payment_account: pick(legalFormData?.company_bank_payment_account, (allUserDataForDocuments as any)?.company_bank_payment_account),
            company_bank_bik: pick(legalFormData?.company_bank_bik, (allUserDataForDocuments as any)?.company_bank_bik),
            company_bank_correspondent_account: pick(
                legalFormData?.company_bank_correspondent_account,
                (allUserDataForDocuments as any)?.company_bank_correspondent_account
            ),

            phone: pick(legalFormData?.phone, (allUserDataForDocuments as any)?.phone),
            email: pick(legalFormData?.email, (allUserDataForDocuments as any)?.email),

            // Юр. адрес
            company_region: pick(legalFormData?.company_region, (allUserDataForDocuments as any)?.company_region, allUserDataForDocuments?.region),
            company_city: pick(legalFormData?.company_city, (allUserDataForDocuments as any)?.company_city, allUserDataForDocuments?.city),
            company_street: pick(legalFormData?.company_street, (allUserDataForDocuments as any)?.company_street, allUserDataForDocuments?.street),
            company_house: pick(legalFormData?.company_house, (allUserDataForDocuments as any)?.company_house, allUserDataForDocuments?.house),
            company_apartment: pick(legalFormData?.company_apartment, (allUserDataForDocuments as any)?.company_apartment, allUserDataForDocuments?.apartment),

            // Почтовый адрес
            company_mailing_region: pick(legalFormData?.company_mailing_region, (allUserDataForDocuments as any)?.company_mailing_region),
            company_mailing_city: pick(legalFormData?.company_mailing_city, (allUserDataForDocuments as any)?.company_mailing_city),
            company_mailing_street: pick(legalFormData?.company_mailing_street, (allUserDataForDocuments as any)?.company_mailing_street),
            company_mailing_house: pick(legalFormData?.company_mailing_house, (allUserDataForDocuments as any)?.company_mailing_house),
            company_mailing_apartment: pick(legalFormData?.company_mailing_apartment, (allUserDataForDocuments as any)?.company_mailing_apartment),
        };
    }, [legalFormData, allUserDataForDocuments, userPassportData]);

    const renderField = (label: string, value?: string | null) => (
        <div className={styles.page__field}>
            <span className={styles.page__question}>{label}</span>
            <span className={styles.page__answer}>{value ?? 'Нет ответа'}</span>
        </div>
    );

    // Показать Loader только если вообще ещё ничего не подтянулось
    const nothingLoadedYet =
        !allUserDataForDocuments && !userPassportData && !legalFormData;

    if (loading && nothingLoadedYet) return <Loader />;

    const isLegal = !!user?.is_individual_entrepreneur;

    return (
        <div className={styles.page}>
            {isLegal && (legalFormData || allUserDataForDocuments) ? (
                <>
                    <div className={styles.page__item}>
                        <h2 className={styles.page__subtitle}>Данные&nbsp;юридического&nbsp;лица</h2>

                        {renderField('Полное наименование организации', mergedLegal.company_name)}
                        {renderField('Фамилия руководителя', mergedLegal.last_name)}
                        {renderField('Имя руководителя', mergedLegal.first_name)}
                        {renderField('Отчество руководителя', mergedLegal.patronymic)}
                        {renderField('ИНН компании', mergedLegal.company_inn)}
                        {renderField('КПП', mergedLegal.company_kpp)}
                        {renderField('ОГРН', mergedLegal.company_ogrn)}
                        {renderField('Расчётный счёт', mergedLegal.company_payment_account)}
                        {renderField('Банк. счёт', mergedLegal.company_bank_payment_account)}
                        {renderField('БИК банка', mergedLegal.company_bank_bik)}
                        {renderField('Корр. счёт', mergedLegal.company_bank_correspondent_account)}
                        {renderField('Телефон', mergedLegal.phone)}
                        {renderField('Email', mergedLegal.email)}
                    </div>

                    <div className={styles.page__item}>
                        <h3 className={styles.page__subtitle}>Адрес организации</h3>
                        {renderField('Регион', mergedLegal.company_region)}
                        {renderField('Город', mergedLegal.company_city)}
                        {renderField('Улица', mergedLegal.company_street)}
                        {renderField('Дом', mergedLegal.company_house)}
                        {renderField('Квартира', mergedLegal.company_apartment)}
                    </div>

                    <div className={styles.page__item}>
                        <h2 className={styles.page__subtitle}>Почтовый&nbsp;адрес</h2>
                        {renderField('Регион', mergedLegal.company_mailing_region)}
                        {renderField('Город', mergedLegal.company_mailing_city)}
                        {renderField('Улица', mergedLegal.company_mailing_street)}
                        {renderField('Дом', mergedLegal.company_mailing_house)}
                        {renderField('Квартира', mergedLegal.company_mailing_apartment)}
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
                                : allUserDataForDocuments?.gender
                                    ? 'Женский'
                                    : undefined
                        )}
                        {renderField('Дата рождения', formatISOToRu(allUserDataForDocuments?.birth_date))}
                        {renderField('Место рождения', allUserDataForDocuments?.birth_place)}
                        {renderField('Серия паспорта', userPassportData?.passport_series)}
                        {renderField('Номер паспорта', userPassportData?.passport_number)}
                        {renderField('Код подразделения', userPassportData?.department_code)}
                        {renderField('Дата выдачи', formatISOToRu(userPassportData?.issue_date))}
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
