import React, { memo } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { AdditionalMenu } from "shared/ui/AdditionalMenu/AdditionalMenu";
import withStepContent from "shared/lib/hoc/withStepComponent";

interface RiskProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdditionalMenuWithContent = withStepContent(AdditionalMenu);

export const RiskProfileModal = memo(({ isOpen, onClose }: RiskProfileModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className={styles.modalContent}>
                <AdditionalMenuWithContent onClose={onClose} />
            </div>
        </Modal>
    );
});
