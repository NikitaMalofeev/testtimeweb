import React, { memo, useState } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Input } from "shared/ui/Input/Input";
import { ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { ProblemsRequestData } from "shared/api/userApi/userApi";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";
import { useNavigate } from "react-router-dom";
import { closeAllModals } from "entities/ui/Modal/slice/modalSlice";

interface ProblemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    problemScreen: string;
}

export const ProblemsModal = memo(({ isOpen, onClose, title, problemScreen }: ProblemsModalProps) => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal);
    const token = useSelector((state: RootState) => state.user.token);
    const navigate = useNavigate()
    const [description, setDescription] = useState("");

    const handleSubmit = () => {
        // if (!token) {
        //     console.error("User ID отсутствует");
        //     return;
        // }

        // const requestData: ProblemsRequestData = {
        //     screen: problemScreen,
        //     description,
        // };

        // dispatch(sendProblems(requestData));
        // dispatch(setTooltipActive({ active: false, message: 'Уже спешим помочь вам, ожидайте ответа команды Ranks' }));
        // onClose();
        navigate('/support')
        dispatch(closeAllModals())
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={ModalSize.XXS}
            animation={modalState.problem.animation}
            withCloseIcon
            titleWidth="250px"
            type={ModalType.PROBLEM}
            withTitle={<span>{title}</span>}
        >
            <div className={styles.modalContent}>
                {/* <div className={styles.content}>
                    <span className={styles.subtitle}>Опишите свою проблему</span>
                    <Input
                        type="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Опишите проблему"
                    />
                </div> */}
                <Button
                    theme={ButtonTheme.BLUE}
                    onClick={handleSubmit}
                    className={styles.submitButton}
                >
                    Перейти в чат поддержки
                </Button>
            </div>
        </Modal>
    );
});
