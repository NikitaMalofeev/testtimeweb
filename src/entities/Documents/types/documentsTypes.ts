export interface ConfirmDocsPayload {
    type_message: string;
    is_agree: boolean;
    type_document?: string;
    broker_id?: string;
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