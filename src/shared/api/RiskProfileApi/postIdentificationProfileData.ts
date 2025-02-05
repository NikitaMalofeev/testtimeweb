import axios from "axios";
import { IdentificationProfileData } from "entities/RiskProfile/model/types";

export const postIdentificationData = async (data: IdentificationProfileData) => {
    const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL
    const response = await axios.post(
        `${apiUrl}create_doc_user/first_primary_data/`,
        data,
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};
