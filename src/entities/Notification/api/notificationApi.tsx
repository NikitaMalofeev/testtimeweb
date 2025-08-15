import axios from "axios";

const envEnviroment = import.meta.env.VITE_ENVIROMENT;

let apiUrl: string;

switch (envEnviroment) {
    case "PROD":
        apiUrl = import.meta.env.VITE_RANKS_PROD_API_URL;
        break;

    case "LOCAL":
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL_LOCAL;
        break;

    case "TEST":
    default:
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;
        break;
}


export const getAllNotifications = async (
    token: string
) => {
    const { data } = await axios.post(`${apiUrl}user_lk/get_all_notifications/`, {}, {
        headers: {
            "Accept-Language": "ru",
            Authorization: `Token ${token}`,
        },
    });
    return data;
};

export const updateAllNotifications = async (
    payload: Record<string, any>
) => {
    const { data } = await axios.post(
        `${apiUrl}robokassa-result/`,
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

