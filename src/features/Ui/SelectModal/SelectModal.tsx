import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal, setSelectedCountry } from "entities/ui/Modal/slice/modalSlice";
import { RootState } from "app/providers/store/config/store";
import { Modal } from "shared/ui/Modal/Modal";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import styles from "./styles.module.scss";

const countries = [
    "Китай", "Российская Федерация", "США", "Япония", "Индия",
    "Великобритания", "Тайвань", "Канада", "Южная Корея", "Австралия"
];

export const SelectModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state: RootState) => state.modal[ModalType.SELECT].isOpen);

    const [search, setSearch] = useState("");
    const filteredOptions = countries.filter(country => country.toLowerCase().includes(search.toLowerCase()));

    const handleSelect = (country: string) => {
        dispatch(setSelectedCountry(country));
        dispatch(closeModal(ModalType.SELECT));
    };

    return (
        <Modal isOpen={isOpen} onClose={() => dispatch(closeModal(ModalType.SELECT))} type={ModalType.SELECT}>
            <div className={styles.modalContent}>
                <h2 className="text-lg font-semibold mb-4">Выбор страны</h2>
                <input
                    type="text"
                    placeholder="Поиск"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2 border rounded-md mb-4"
                />
                <ul className="border rounded-md">
                    {filteredOptions.map((option) => (
                        <li
                            key={option}
                            className="p-3 border-b last:border-none cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
};
