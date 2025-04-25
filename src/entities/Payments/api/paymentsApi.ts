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
    token: string
) => {
    const { data } = await axios.post(
        `${apiPaymentsUrl}set_tariff/`,
        { tariff_key: tariff_key },
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
