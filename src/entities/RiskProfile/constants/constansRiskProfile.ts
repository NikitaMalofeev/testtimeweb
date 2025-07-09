import { LegalFormData } from "../model/types";


export const EMPTY_LEGAL_FORM: LegalFormData = {
    /* вариант #1 */
    organization_name: "",
    general_director: "",
    inn: "",
    kpp: "",
    ogrn: "",
    bank_name: "",
    checking_account: "",
    correspondent_account: "",
    bik: "",
    work_email: "",
    work_phone: "",

    /* вариант #2 (company-block) */
    company_name: "",
    first_name: "",
    last_name: "",
    patronymic: "",
    type_message: "SMS",

    company_inn: "",
    company_kpp: "",
    company_ogrn: "",

    company_payment_account: "",
    company_bank_payment_account: "",
    company_bank_bik: "",
    company_bank_correspondent_account: "",

    phone: "",
    email: "",

    /* юридический адрес */
    legal_region: "",
    legal_city: "",
    legal_street: "",
    legal_house: "",
    legal_apartment: "",

    company_region: "",
    company_city: "",
    company_street: "",
    company_house: "",
    company_apartment: "",

    is_receive_mail_this_address: false,

    /* почтовый адрес */
    postal_region: "",
    postal_city: "",
    postal_street: "",
    postal_house: "",
    postal_apartment: "",

    company_mailing_region: "",
    company_mailing_city: "",
    company_mailing_street: "",
    company_mailing_house: "",
    company_mailing_apartment: "",

    g_recaptcha: ""
};