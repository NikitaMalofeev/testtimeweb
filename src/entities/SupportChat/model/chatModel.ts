// entities/SupportChat/model/chatModel.ts
export interface ChatMessage {
    id?: number;               // <— добавил, чтобы обновлять по нужному id
    created?: string;
    file_url?: string | null;
    is_answer?: boolean;
    is_edit?: boolean;
    modified?: string;
    text?: string;
    text_for_files?: string;   // описание файлов с сервера
    optimistic: boolean;
    user_id?: number;
}
