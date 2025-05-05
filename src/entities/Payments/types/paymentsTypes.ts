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
    id: string;
    is_active: boolean;
    title: string;
    name_icon: string | null;
    description: string;
    days_service_validity: number;
    commission_deposit: number | null;
    commission_asset: number | null;
    commission_asset_days: number | null;
    created: string;
    updated: string;
    descriptionDetail: string;
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