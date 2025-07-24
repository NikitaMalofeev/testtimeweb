
import { LegalDataFormRequest, LegalFormData } from "entities/RiskProfile/model/types";
import omitBy from "lodash/omitBy";

/** отбрасываем "", null, undefined; остаётся Partial<LegalFormData> */
export const toLegalDataRequest = (
    src: LegalDataFormRequest,
): LegalDataFormRequest =>
    omitBy(src, v => v === "" || v == null) as LegalDataFormRequest;
