import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss"; // Подключаем ваши стили
import { ModalAnimation, ModalType } from "entities/ui/Modal/model/modalTypes";
import { Input } from "shared/ui/Input/Input";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setModalScrolled } from "entities/ui/Modal/slice/modalSlice";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import { Icon } from "shared/ui/Icon/Icon";
import CloseIcon from 'shared/assets/svg/close.svg'

interface SelectItem {
    value: string;
    label: string;
}

interface SelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    withCloseIcon: boolean;
    items: SelectItem[];
    onChoose: (value: string) => void;
}

export const SelectWidget: React.FC<SelectModalProps> = ({
    isOpen,
    title,
    withCloseIcon,
    items,
    onClose,
    onChoose,
}) => {
    const [search, setSearch] = useState("");
    const [localSelectedValue, setLocalSelectedValue] = useState<string>("");
    const isScrolled = useSelector((state: RootState) =>
        selectModalState(state, ModalType.SELECT)?.isScrolled
    );
    const [isBottom, setIsBottom] = useState(false);
    const dispatch = useAppDispatch();
    const contentRef = useRef<HTMLDivElement>(null);
    // Реф на прокручиваемый контейнер, чтобы отслеживать scroll
    const scrollableRef = useRef<HTMLDivElement | null>(null);

    // Добавляем опцию по умолчанию, если её нет в начале массива
    const modifiedItems = items[0]?.value === '' ? items : [{ value: '', label: 'Не выбрано' }, ...items];

    // Фильтрация списка по полю search
    const filteredOptions = modifiedItems.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const atBottom = Math.abs(scrollTop + clientHeight - scrollHeight) < 1;

                setIsBottom(atBottom); // Обновляем состояние
                dispatch(
                    setModalScrolled({
                        type: ModalType.SELECT,
                        isScrolled: scrollTop > 0,
                    })
                );
            }
        };

        const content = contentRef.current;
        if (content) {
            content.addEventListener("scroll", handleScroll);
            handleScroll(); // Проверяем сразу после открытия модалки
        }

        return () => {
            if (content) {
                content.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);

    // При выборе опции — запоминаем значение
    const handleSelectOption = (optionValue: string) => {
        setLocalSelectedValue(optionValue);
        onChoose(optionValue);
        onClose();
    };

    // Нажатие на «Назад»
    const handleBack = () => {
        onClose();
    };

    if (!isOpen) {
        return null
    }

    return (
        <div className={styles.container}>
            <div
                className={`
          ${styles.widgetContent} 
          ${isScrolled && styles.widgetContent__shadow_top} 
            `}
                ref={contentRef}
                style={{ overflow: "auto" }}>
                <div className={styles.header}>
                    <Icon Svg={CloseIcon} width={20} height={20} className={styles.header__close} onClick={onClose} />
                    <h2 className={styles.title}>{title}</h2>
                    <Input
                        type="search"
                        placeholder="Поиск"
                        autoComplete="new-password"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Прокручиваемая зона */}
                <div className={styles.scrollContainer}>
                    <ul className={styles.list}>
                        {filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                className={`${styles.list__item} ${localSelectedValue === option.value
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
                <Button className={styles.button} theme={ButtonTheme.EMPTYBLUE} onClick={handleBack}>Отмена</Button>
                <Button
                    className={styles.button}
                    // onClick={handleChoose}
                    disabled={!localSelectedValue}
                    padding="18px 23px"
                >
                    Выбрать
                </Button>
            </div>
        </div>
    );
};
