import React, { memo } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { AdditionalMenu } from "shared/ui/AdditionalMenu/AdditionalMenu";
import withStepContent from "shared/lib/hoc/withStepComponent";
import { StateSchema } from "app/providers/store/config/StateSchema";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";

interface RiskProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdditionalMenuWithContent = withStepContent(AdditionalMenu);

export const RiskProfileModal = memo(({ isOpen, onClose }: RiskProfileModalProps) => {
    const modalState = useSelector((state: RootState) => state.modal);
    return (
        <Modal isOpen={isOpen} onClose={onClose} animation={modalState.identificationModal.animation} size={modalState.identificationModal.size}>
            <div className={styles.modalContent}>
                <AdditionalMenuWithContent onClose={onClose} />
            </div>
        </Modal>
    );
});
