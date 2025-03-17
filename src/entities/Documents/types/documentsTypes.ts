export interface ConfirmDocsPayload {
    type_message: string;
    is_agree: boolean;
    type_document: string;
}

export interface FilledRiskProfileChapters {
    is_risk_profile_complete: boolean;
    is_risk_profile_complete_final: boolean;
    is_complete_passport: boolean;
    is_exist_scan_passport: boolean;
}