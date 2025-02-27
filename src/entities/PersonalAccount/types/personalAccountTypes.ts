import { FC, SVGProps } from "react";

export interface PersonalAccountItem {
    /** Иконка (может быть компонентом React, URL-строкой, любым подходящим типом) */
    icon: string | FC<SVGProps<SVGSVGElement>> | undefined;
    /** Заголовок пункта меню */
    title: string;
    /** Обработчик клика (или dispatch в этот пункт) */
    route?: string;
    action?: () => void;
    /** Опциональное количество уведомлений */
    notificationsCount?: number;
    iconWidth: number;
    iconHeight: number;
}
