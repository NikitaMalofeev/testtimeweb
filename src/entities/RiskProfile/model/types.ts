export interface IdentificationProfileData {
    phone: string;
    email: string;
    first_name: string;
    patronymic: string;
    last_name: string;
    password: string;
    password2: string;
    is_agreement: boolean;
    g_recaptcha: string;
    is_individual_entrepreneur: boolean;
    type_sms_message?: string

}

export interface ConfirmationCodeData {
    user_id: string;
    code: string;
    type: "phone" | 'email' | 'whatsapp';
}

export interface ConfirmationDocsData {
    code: string;
    type_document?: string;
    broker_id?: string;
}

export interface ConfirmationCustomDocsData {
    code: string;
    type_document?: string;
    id_sign: string;
    broker_id?: string;
}

export interface NeedHelpData {
    user_id: string;
    screen: string;
    email: string;
    phone: string;
    description: string;
}

export interface TrustedPersonInfo {
    trusted_person_fio: string
    trusted_person_phone: string
    trusted_person_other_contact: string
}

export interface RiskProfileFormData {
    person_type?: "type_doc_person_natural" | "type_doc_person_legal" | "";
    citizenship?: string;
    residence_permit?: string;
    trusted_person_fio?: string;
    trusted_person_phone?: string;
    trusted_person_other_contact?: string;
    is_qualified_investor_status?: boolean;
    expected_return_investment?: number;
    max_allowable_drawdown?: number;
    [key: string]: string | number | boolean | string[] | undefined; // Поддержка динамических полей
}

export interface RiskProfileFormValues extends RiskProfileFormData {
    /** делаем person_type строго обязательным,
        чтобы Formik.values.person_type всегда существовал */
    person_type: "type_doc_person_natural" | "type_doc_person_legal" | "";
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface SecondRiskProfileResponse {
    step_scroll_amount_expected_replenishment: number;
    min_amount_expected_replenishment: number | undefined;
    info: string;
    summ: number;
    recommended_risk_profiles: Record<string, string>;
    risk_profiling_possible_loss_percent: number;
    risk_profiling_potential_income_percent: number;
    possible_loss: number;
    potential_income: number;
}

export interface SendCodePayload {
    user_id: string;
    codeFirst: string;        // Код из первой формы
    codeSecond?: string;      // Код из второй формы (при методе 'phone' + email)
    method: 'SMS' | 'email' | 'WHATSAPP' | 'whatsapp' | 'phone' | 'EMAIL'  // Как в вашем modalSlice
    purposeNewContacts?: boolean;
    onSuccess?: (data?: any) => void;
    onError?: (data?: any) => void;
    onClose?: () => void;
}

export interface SendCodeDocsConfirmPayload {
    codeFirst: string;
    codeSecond?: string;
    docs: string;
    onSuccess?: (data?: any) => void;
    onClose?: () => void
}

export interface SendCodeCustomDocsConfirmPayload {
    codeFirst: string;
    codeSecond?: string;
    docs: string;
    id_sign: string;
    onSuccess?: (data?: any) => void;
    onClose?: () => void
}

export interface SecondRiskProfilePayload {
    amount_expected_replenishment: number | undefined,
    portfolio_parameters: string,
}

export interface SecondRiskProfileFinalPayload {
    amount_expected_replenishment: number | undefined,
    portfolio_parameters: string,
    risk_profiling_final?: string
}

export interface RiskProfileSelectors {
    [key: string]: Record<string, string>;
}

export interface ThirdRiskProfileResponse {
    is_success: boolean;
    risk_profiling_possible_loss_percent: number;
    risk_profiling_potential_income_percent: number;
    possible_loss: number;
    potential_income: number;
}

export interface PasportFormData {
    g_recaptcha: string;
    type_message: string;
    gender?: string;
    first_name?: string;
    patronymic?: string;
    last_name?: string;
    birth_date: string | null;
    birth_place: string;
    passport_series: string;
    passport_number: string;
    department_code: string;
    issue_date: string | null;
    issue_whom: string;
    inn: string;
    region: string;
    city: string;
    street: string;
    house: string;
    apartment: string | undefined;
    is_live_this_address: boolean;
    is_receive_mail_this_address: boolean;
    address_residential_region: string;
    address_residential_city: string;
    address_residential_street: string;
    address_residential_house: string;
    address_residential_apartment: string;
}

export interface PassportFormData {
    last_name: string;
    first_name: string;
    patronymic?: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    passport_series: string;
    passport_number: string;
    department_code: string;
    issue_date: string;
    issue_whom: string;
    inn: string;
    region: string;
    city: string;
    street: string;
    house: string;
    apartment: string;
    is_live_this_address: boolean;
    is_receive_mail_this_address: boolean;
    address_residential_region: string;
    address_residential_city: string;
    address_residential_street: string;
    address_residential_house: string;
    address_residential_apartment: string;
}

// entities/RiskProfile/model/types.ts
/** Поля, которые API действительно принимает */
export interface LegalDataFormRequest {
    /* company block */
    company_name: string;
    first_name?: string;
    last_name?: string;
    patronymic: string;
    type_message: "SMS" | "EMAIL" | "WHATSAPP";

    company_inn: string;
    company_kpp: string;
    company_ogrn: string;

    company_payment_account: string;
    company_bank_payment_account: string;
    company_bank_bik: string;
    company_bank_correspondent_account: string;

    phone?: string;
    email?: string;

    /* legal address */
    company_region: string;
    company_city: string;
    company_street: string;
    company_house: string;
    company_apartment: string;
    is_receive_mail_this_address?: string;
    company_mailing_region: string;
    company_mailing_city: string;
    company_mailing_street: string;
    company_mailing_house: string;
    company_mailing_apartment: string;
}




export interface BrokerSetTokenPayload {
    market?: string;
    broker: string;
    token: string;
}

export interface LegalFormData {
    /* реквизиты (вариант #1) */
    organization_name: string;
    general_director: string;
    inn: string;
    kpp: string;
    ogrn: string;
    bank_name: string;
    checking_account: string;
    correspondent_account: string;
    bik: string;
    work_email: string;
    work_phone: string;

    /* company-block (вариант #2) */
    company_name: string;
    first_name: string;
    last_name: string;
    patronymic: string;
    type_message: "SMS" | "EMAIL" | "WHATSAPP";

    company_inn: string;
    company_kpp: string;
    company_ogrn: string;

    company_payment_account: string;
    company_bank_payment_account: string;
    company_bank_bik: string;
    company_bank_correspondent_account: string;

    phone: string;
    email: string;

    /* юридический адрес (оба варианта) */
    legal_region: string;
    legal_city: string;
    legal_street: string;
    legal_house: string;
    legal_apartment: string;

    company_region: string;
    company_city: string;
    company_street: string;
    company_house: string;
    company_apartment: string;

    /* флаг совпадения адресов */
    is_receive_mail_this_address: boolean;

    /* почтовый адрес (оба варианта) */
    postal_region: string;
    postal_city: string;
    postal_street: string;
    postal_house: string;
    postal_apartment: string;

    company_mailing_region: string;
    company_mailing_city: string;
    company_mailing_street: string;
    company_mailing_house: string;
    company_mailing_apartment: string;
    g_recaptcha: string
}

export interface LegalConfirmData {
    is_send_email: boolean;
    is_send_phone: boolean;
    is_send_message_person: boolean;
    timeinterval_sms: number | null;
    is_need_confirm_email: boolean;
    is_need_confirm_phone: boolean;
    max_size_scan_mb: number;
    group_name_upload_scans_progress: string;
}
