import React, { useState } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import { Button } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { ModalAnimation, ModalType } from "entities/ui/Modal/model/modalTypes";

interface SelectItem {
    value: string;
    label: string;
}

interface SelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: SelectItem[];
    /**
     * Колбэк, через который мы отдаём выбранный value
     * (ключ страны) в родительский компонент.
     */
    onChoose: (value: string) => void;
}

export const SelectModal: React.FC<SelectModalProps> = ({
    isOpen,
    title,
    items,
    onClose,
    onChoose,
}) => {
    const [search, setSearch] = useState("");
    const [localSelectedValue, setLocalSelectedValue] = useState<string>("");

    // Фильтруем по поиску по label
    const filteredOptions = items.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    // Когда кликнули по конкретной опции — запоминаем её value
    const handleSelectOption = (optionValue: string) => {
        setLocalSelectedValue(optionValue);
    };

    // Нажатие на "Выбрать"
    const handleChoose = () => {
        // Отдаём выбранную value родителю
        onChoose(localSelectedValue);
        // Закрываем модалку
        onClose();
    };

    // Нажатие на "Назад"
    const handleBack = () => {
        onClose();
    };

    return (
        <Modal type={ModalType.SELECT} animation={ModalAnimation.LEFT} isOpen={isOpen} onClose={onClose}>
            <div className={styles.modalContent}>
                <h2 className="text-lg font-semibold mb-4">{title}</h2>

                <input
                    type="text"
                    placeholder="Поиск"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 border rounded-md mb-4"
                />

                <ul className="border rounded-md max-h-60 overflow-y-auto">
                    {filteredOptions.map((option) => (
                        <li
                            key={option.value}
                            className={`p-3 border-b last:border-none cursor-pointer hover:bg-gray-100
                                ${localSelectedValue === option.value
                                    ? "bg-blue-100"
                                    : ""
                                }
                            `}
                            onClick={() => handleSelectOption(option.value)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>

                <div className="flex justify-end gap-3 mt-4">
                    <Button onClick={handleBack}>Назад</Button>
                    <Button onClick={handleChoose} disabled={!localSelectedValue}>
                        Выбрать
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
