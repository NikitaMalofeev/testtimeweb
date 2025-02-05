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
}

export interface ConfirmationCodeData {
    user_id: string;
    code: string;
    type: "phone" | "type_doc_EDS_agreement";
}

export interface NeedHelpData {
    user_id: string;
    screen: string;
    email: string;
    phone: string;
    description: string;
}
