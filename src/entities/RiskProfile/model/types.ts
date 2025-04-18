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



export interface BrokerSetTokenPayload {
    market?: string;
    broker: string;
    token: string;
}