import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { RootState } from "app/providers/store/config/store";
import { ModalType, ModalSize, ModalAnimation } from "entities/ui/Modal/model/modalTypes";

interface CustomSelectProps {
    label: string;
}

export const Select: React.FC<CustomSelectProps> = ({ label }) => {
    const dispatch = useDispatch();
    const selectedCountry = useSelector((state: RootState) => state.modal.selectedCountry);

    const openSelectModal = () => {
        dispatch(openModal({ type: ModalType.SELECT, size: ModalSize.MIDDLE, animation: ModalAnimation.BOTTOM }));
    };

    return (
        <div className="p-4 border rounded-md cursor-pointer" onClick={openSelectModal}>
            <label className="text-sm text-gray-500">{label}</label>
            <div className="text-lg">{selectedCountry || "Выберите страну"}</div>
        </div>
    );
};
