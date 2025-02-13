import { SelectModal } from "features/Ui/SelectModal/SelectModal";
import React, { useState } from "react";
import styles from "./styles.module.scss";
import { Icon } from "../Icon/Icon";
import ErrorIcon from 'shared/assets/svg/errorCircle.svg';
import SelectArrow from 'shared/assets/svg/selectArrow.svg'

interface SelectItem {
    value: string;
    label: string;
}

interface CustomSelectProps {
    label: string;
    value: string;
    title: string;
    needValue: boolean;
    items: SelectItem[];
    onChange: (val: string) => void;
    error?: string | boolean;
}

export const Select: React.FC<CustomSelectProps> = ({
    label,
    value,
    title,
    needValue,
    items,
    onChange,
    error
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setIsFocused(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsFocused(!!value);
    };

    const handleChooseItem = (chosenValue: string) => {
        onChange(chosenValue);
        setIsFocused(true);
    };

    const currentLabel = items.find((i) => i.value === value)?.label ?? "";

    return (
        <div className={`${styles.inputWrapper} ${isFocused ? styles.active : ""}`}>
            <label className={`${styles.label} ${isFocused || value ? styles.active : ""}`}>{label} {needValue && <span style={{ color: '#FF3C53' }}>*</span>}</label>
            <div
                className={`${styles.inputContainer} ${styles.selectContainer} ${error ? styles.error : ""}`}
                onClick={handleOpenModal}
            >
                <div className={`${styles.input} ${styles.select}`}>
                    {currentLabel}
                </div>
            </div>
            <button
                type="button"
                className={`${styles.toggleButton} ${isModalOpen ? styles.rotated : ""}`}
                onClick={handleOpenModal}
            >
                <Icon Svg={SelectArrow} />
            </button>

            {error && (
                <div className={styles.input__error}>
                    <Icon Svg={ErrorIcon} className={styles.input__error__icon} width={16} height={16} />
                    <span>{error}</span>
                </div>
            )}
            <SelectModal
                title={title}
                withCloseIcon
                items={items}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onChoose={handleChooseItem}
            />
        </div>
    );
};
