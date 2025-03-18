// Определяем тип для сообщения чата
export interface ChatMessage {
    created: string;
    file_url: string | null;
    is_answer: boolean;
    is_edit: boolean;
    modified: string;
    text: string;
    user_id: number;
}