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
    method: 'phone' | 'email' | 'whatsapp'  // Как в вашем modalSlice
    onSuccess?: (data?: any) => void;
    onError?: (data?: any) => void;
    onClose?: () => void;
}

export interface SecondRiskProfilePayload {
    amount_expected_replenishment: number | undefined,
    portfolio_parameters: string,
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
