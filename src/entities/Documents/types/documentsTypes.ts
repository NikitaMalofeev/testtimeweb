export interface ConfirmDocsPayload {
    type_message: string;
    is_agree: boolean;
    type_document?: string;
    broker_id?: string;
}

export interface ConfirmAllDocsPayload {
    type_message: string;
    is_agree_type_doc_eds_agreement: boolean;
    /** Соглашение с анкетой РП */
    is_agree_type_doc_rp_questionnairy: boolean;
    /** Подпись договора с Инвестиционным Советником */
    is_agree_type_doc_agreement_investment_advisor: boolean;
    /** Соглашение с декларацией о рисках */
    is_agree_type_doc_risk_declarations: boolean;
    /** Соглашение с политикой персональных данных */
    is_agree_type_doc_agreement_personal_data_policy: boolean;
    /** Соглашение со справкой об инвестиционном профиле */
    is_agree_type_doc_investment_profile_certificate: boolean;
    /** Соглашение на обслуживание счета */
    is_agree_type_doc_agreement_account_maintenance: boolean;
}

export interface ConfirmCustomDocsPayload {
    type_message: string;
    is_agree: boolean;
    type_document?: string;
    id_sign?: string;
}
export interface FilledRiskProfileChapters {
    is_risk_profile_complete: boolean;
    is_risk_profile_complete_final: boolean;
    is_complete_passport: boolean;
    is_exist_scan_passport: boolean;
}

export interface PostBrokerApiTokenResponse {
    broker_id: string;
    not_signed_doc_broker: string;
}

type HtmlMap = Record<string, string>
export interface SetHtmlsPayload {
    htmlMap: HtmlMap
    customKey?: string
}

export interface AvailabilityPersonalAccountMenuItems {
    broker: boolean;
    documents: boolean;
    risk_profile: boolean;
    tariffs: boolean;
}