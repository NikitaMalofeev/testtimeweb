export interface IdentificationProfileData {
    phone: string;
    email: string;
    first_name: string;
    middle_name: string;
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