// entities/SupportChat/model/chatModel.ts
export interface ChatMessage {
    id?: number;               // ID сообщения для загрузки файлов через API
    created?: string;
    file_url?: string | string[] | null;  // Может быть строка, массив строк или null
    is_answer?: boolean;
    is_edit?: boolean;
    modified?: string;
    text?: string;
    text_for_files?: string;   // описание файлов с сервера
    optimistic?: boolean;      // сделал опциональным
    user_id?: number;
}
