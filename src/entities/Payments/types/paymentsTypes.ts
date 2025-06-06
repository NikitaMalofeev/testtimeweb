export interface PaymentsCreateOrderPayload {
    tariff_id: string
    payment_system: string
    payment_type: string
    currency: string
}

export interface PaymentData {
    /** Уникальный идентификатор платежа */
    uuid: string;
    /** Описание платежа (например, сумма как строка) */
    description: string;
    /** Платёжная система */
    payment_system: 'ROBOKASSA' | string;
    /** Сумма платежа */
    amount: number;
    /** Валюта */
    currency: string;
    /** Статус оплаты */
    paid: boolean;
    /** Ссылка для оплаты */
    payment_url: string;
}

export type PaymentStatus = 'success' | 'loading' | 'failed';

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

export interface Tariff {
    id: string; // “каталоговый” id тарифа
    key: string;  // ← user-tariff key, отдаёт setTariff
    is_active: boolean;
    title: string;
    title_additional: string;
    name_icon: string | null;
    description: {
        help: string,
        description: string
    }[];
    days_service_validity: number;
    commission_deposit: number | null;
    commission_asset: number | null;
    commission_asset_days: number | null;
    created: string;
    updated: string;
    description_detailed: {
        help: string,
        description: string
    }[] | string;
}

export interface OrderStatusResponse {
    id: number;
    paid: boolean;
    status: string;
}

export interface RobokassaResultResponse {
    OutSum: string;
    InvId: string;
    EMail: string;
    SignatureValue: string;
    IsTest?: string;
}

export interface UserCheck {
    fn: string;
    fd: string;
    fpd_or_fp: string;
    date_time_check: string; // ISO
    url_check: string;
    check_html: string;
}