import { RefObject, useEffect, useState } from "react";

/**
 * Отслеживает, был ли скролл сверху, и достигнут ли низ
 * @param ref   – ref на скроллируемый элемент
 * @param active – true → хук активен (например, модалка открыта)
 */
export const useScrollShadow = (
    ref: RefObject<HTMLElement>,
    active: boolean = true
) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBottom, setIsBottom] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!active || !el) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            setIsScrolled(scrollTop > 0);
            setIsBottom(scrollTop + clientHeight >= scrollHeight - 1);
        };

        // первичная инициализация
        handleScroll();
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [ref, active]);

    return { isScrolled, isBottom };
};
