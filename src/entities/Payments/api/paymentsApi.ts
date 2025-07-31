import axios from "axios";
import { PaymentsCreateOrderPayload } from "../types/paymentsTypes";

const envEnviroment = import.meta.env.VITE_ENVIROMENT;

let apiPaymentsUrl: string;

switch (envEnviroment) {
    case "PROD":
        apiPaymentsUrl = import.meta.env.VITE_RANKS_PROD_API_PAY_URL;
        break;

    case "LOCAL":
        apiPaymentsUrl = import.meta.env.VITE_RANKS_TEST_API_PAY_URL_LOCAL;
        break;

    case "TEST":
    default:
        apiPaymentsUrl = import.meta.env.VITE_RANKS_TEST_API_PAY_URL;
        break;
}

export const createOrder = async (
    payload: PaymentsCreateOrderPayload,
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}create_order/`,
        payload,
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};

export const getAllTariffs = async (token: string) => {
    const { data } = await axios.get(`${apiPaymentsUrl}get_all_tarrifs/`, {
        headers: {
            "Accept-Language": "ru",
            Authorization: `Token ${token}`,
        },
    });
    return data;
};

export const getChecksUser = async (token: string) => {
    const { data } = await axios.get(`${apiPaymentsUrl}get_checks_user/`, {
        headers: {
            "Accept-Language": "ru",
            Authorization: `Token ${token}`,
        },
    });
    return data;
};


export const getAllActiveTariffs = async (token: string) => {
    const { data } = await axios.post(`${apiPaymentsUrl}get_tariffs_user/`, {}, {
        headers: {
            "Accept-Language": "ru",
            Authorization: `Token ${token}`,
        },
    });
    return data;
};

export const getOrderStatus = async (
    orderId: string,
    token: string
) => {
    const { data } = await axios.get(`${apiPaymentsUrl}order-status/`, {
        params: { order_id: orderId },
        headers: {
            "Accept-Language": "ru",
            Authorization: `Token ${token}`,
        },
    });
    return data;
};

export const robokassaResult = async (
    payload: Record<string, any>
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}robokassa-result/`,
        payload,
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );
    return data;
};

export const paymentsSetTariff = async (
    tariff_key: string,
    broker_id: string,
    type_message: string,
    is_agree: boolean,
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}set_tariff/`,
        { tariff_key, broker_id, type_message, is_agree },
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};

export const checkConfirmationCodeTariff = async (
    tariff_id: string,
    code: string,
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}check_confirmation_code_tariff/`,
        { tariff_id, code },
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};

export const getSignedTariffDoc = async (
    tariff_id: string,
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}get_signed_tariff_document/`,
        { tariff_id },
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};


export const getNotSignedTariffDoc = async (
    tariff_id: string,
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}get_user_not_signed_tariff_html/`,
        { tariff_id },
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};

export const getAllUserTariffs = async (
    order__currency: 'RUB',
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}get_orders_payments_info_user/`,
        { order__currency },
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};


export const signingTariff = async (
    tariff_id: string,
    type_message: string,
    is_agree: boolean,
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}signing_tariff/`,
        { tariff_id, type_message, is_agree },
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Token ${token}`,
            },
        }
    );
    return data;
};