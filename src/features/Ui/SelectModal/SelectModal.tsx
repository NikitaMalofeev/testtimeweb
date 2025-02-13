import React, { useState, useRef, useEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss"; // Подключаем ваши стили
import { ModalAnimation, ModalType } from "entities/ui/Modal/model/modalTypes";
import { Input } from "shared/ui/Input/Input";

interface SelectItem {
    value: string;
    label: string;
}

const countries: SelectItem[] = [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "gb", label: "United Kingdom" },
    { value: "de", label: "Germany" },
    { value: "fr", label: "France" },
    { value: "it", label: "Italy" },
    { value: "es", label: "Spain" },
    { value: "au", label: "Australia" },
    { value: "jp", label: "Japan" },
    { value: "cn", label: "China" },
    { value: "br", label: "Brazil" },
    { value: "in", label: "India" },
    { value: "mx", label: "Mexico" },
    { value: "ru", label: "Russia" },
    { value: "za", label: "South Africa" },
    { value: "kr", label: "South Korea" },
    { value: "ar", label: "Argentina" },
    { value: "nl", label: "Netherlands" },
    { value: "se", label: "Sweden" },
    { value: "ch", label: "Switzerland" }
];

interface SelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    withCloseIcon: boolean;
    items: SelectItem[];
    onChoose: (value: string) => void;
}

export const SelectModal: React.FC<SelectModalProps> = ({
    isOpen,
    title,
    withCloseIcon,
    items,
    onClose,
    onChoose,
}) => {
    const [search, setSearch] = useState("");
    const [localSelectedValue, setLocalSelectedValue] = useState<string>("");
    const [isBottom, setIsBottom] = useState(false);

    // Реф на прокручиваемый контейнер, чтобы отслеживать scroll
    const scrollableRef = useRef<HTMLDivElement | null>(null);

    // Фильтрация списка по полю search
    const filteredOptions = countries.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    // При выборе опции — запоминаем значение
    const handleSelectOption = (optionValue: string) => {
        setLocalSelectedValue(optionValue);
    };

    // Нажатие на «Выбрать»
    const handleChoose = () => {
        onChoose(localSelectedValue);
        onClose();
    };

    // Нажатие на «Назад»
    const handleBack = () => {
        onClose();
    };

    // Функция определения, достигли ли низа контейнера
    const handleScroll = () => {
        if (!scrollableRef.current) {
            return;
        }
        const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
        const atBottom = scrollTop + clientHeight >= scrollHeight;
        setIsBottom(atBottom);
    };

    // Вешаем и снимаем обработчик скролла
    useEffect(() => {
        const scrollEl = scrollableRef.current;
        if (scrollEl) {
            scrollEl.addEventListener("scroll", handleScroll);
        }
        return () => {
            if (scrollEl) {
                scrollEl.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);

    return (
        <Modal
            type={ModalType.SELECT}
            animation={ModalAnimation.LEFT}
            isOpen={isOpen}
            withTitle='Выбор страны'
            onClose={onClose}
            withCloseIcon
        >
            <div className={styles.modalContent} >
                <Input
                    type="search"
                    placeholder="Поиск"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />

                {/* Прокручиваемая зона */}
                <div

                    className={styles.scrollContainer}
                >
                    <ul className={styles.list}>
                        {filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                className={`${styles.listItem} ${localSelectedValue === option.value
                                    ? styles.activeItem
                                    : ""
                                    }`}
                                onClick={() => handleSelectOption(option.value)}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Блок кнопок. Если не дошли до низа — добавляем тень. */}

            </div>
            <div
                className={`${styles.buttons} ${!isBottom ? styles.shadow : ""
                    }`}
            >
                <Button className={styles.button} theme={ButtonTheme.EMPTYBLUE} onClick={handleBack}>Вернуться</Button>
                <Button
                    className={styles.button}
                    onClick={handleChoose}
                    disabled={!localSelectedValue}
                >
                    Продолжить
                </Button>
            </div>
        </Modal>
    );
};
