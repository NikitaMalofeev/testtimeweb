/* ------------------------------------------------------------------ */
/* ENUMS */
/* ------------------------------------------------------------------ */

/** Возможные статусы документа IIR (дополним по мере появления новых) */
export type IirStatus =
    | 'IIR_WAITING'
    | 'IIR_SIGNED'
    | 'IIR_REJECTED'
    | 'IIR_AUTO_AGREED'
    | string;               // запасной вариант, пока бэк не стабилизирован

/* ------------------------------------------------------------------ */
/* ОСНОВНАЯ МОДЕЛЬ */
/* ------------------------------------------------------------------ */

/** Базовые поля, приходящие почти во всех ответах по IIR */
export interface IirBase {
    uuid: string;
    created: string;                       // ISO-строка
    modified: string;                      // ISO-строка
    max_validity_period_iir: number;       // срок действия в днях
    status: IirStatus;

    /* даты переходов статуса */
    date_agree: string | null;
    date_auto_agree: string | null;
    date_rejected: string | null;

    /* прочее */
    is_send_invitation_to_email: boolean;
}

/* ------------------------------------------------------------------ */
/* ОТВЕТЫ API */
/* ------------------------------------------------------------------ */

/** GET /get_iirs_user/ — массив IIR, без HTML/подписанного PDF */
export type GetIirsUserResponse = IirBase[];

/** POST /get_user_not_signed_iir_html/ — те же поля + HTML */
export interface GetIirHtmlResponse extends IirBase {
    not_signed_document_html: string;
}

/** POST /get_signed_iir_document/ — сырой PDF; просто ArrayBuffer */
export type GetSignedIirResponse = ArrayBuffer;

/* ------------------------------------------------------------------ */
/* PAYLOAD-ТИПЫ ТЕЛА ЗАПРОСА */
/* ------------------------------------------------------------------ */

export interface GetIirHtmlPayload {
    uuid: string;
}

export interface RejectIirPayload {
    uuid: string;
}

export interface GetSignedIirPayload {
    uuid: string;
}

/* ------------------------------------------------------------------ */
/* ЭЛЕМЕНТ СПИСКА ДЛЯ STORE (можно расширять по необходимости) */
/* ------------------------------------------------------------------ */

export type IirItem = IirBase;           // пока «как есть»
