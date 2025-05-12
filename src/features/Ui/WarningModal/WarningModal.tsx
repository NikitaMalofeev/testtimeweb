import React, { memo, ReactElement, useEffect, useRef, useState } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Icon } from "shared/ui/Icon/Icon";
import WarningIcon from 'shared/assets/svg/warningIcon.svg';
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";

interface WarningModalProps {
    onClose: () => void;
    title?: string;
    description?: ReactElement;
    action: () => void;
    actionText?: string;
    customSuccessModal?: boolean;
}

export const WarningModal = memo(({
    onClose,
    title,
    description,
    action,
    actionText
}: WarningModalProps) => {
    const modalState = useSelector((state: RootState) =>
        selectModalState(state, ModalType.WARNING)
    );
    const recommendedRiskProfile = useSelector((state: RootState) =>
        state.riskProfile.secondRiskProfileData?.recommended_risk_profiles
    );
    const entries = recommendedRiskProfile ? Object.entries(recommendedRiskProfile) : [];
    const recommendedLabel = entries.length > 0 ? entries[entries.length - 1][1] : "";

    const [isScrolled, setIsScrolled] = useState(false);
    const [isBottom, setIsBottom] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = contentRef.current;
        // если модалка не открыта или div ещё не подвязан — пропускаем
        if (!modalState?.isOpen || !el) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            setIsScrolled(scrollTop > 0);
            setIsBottom(scrollTop + clientHeight >= scrollHeight - 1);
        };

        el.addEventListener("scroll", handleScroll);
        handleScroll(); // инициализация при открытии
        return () => {
            el.removeEventListener("scroll", handleScroll);
        };
    }, [modalState?.isOpen]);



    return (
        <Modal
            isOpen={modalState?.isOpen}
            onClose={onClose}
            size={modalState?.size}
            animation={modalState?.animation}
            withCloseIcon
            withTitle={<Icon width={36} height={36} Svg={WarningIcon} />}
            type={ModalType.INFO}
        >
            <div className={styles.modalContent}>
                <div
                    ref={contentRef}
                    style={{ overflow: "auto" }}
                    className={`
            ${styles.content}
            ${isScrolled ? styles.modalContent__shadow_top : ""}
            ${!isBottom ? styles.modalContent__shadow_bottom : ""}
          `}
                >
                    <span className={styles.description}>
                        Рекомендуемый риск-профиль "{recommendedLabel}"
                    </span>
                    <p className={styles.text}>
                        Если Вы выбираете риск-профиль, отличный от результатов анкетирования, мы настоятельно рекомендуем Вам внимательно оценить все возможные риски и последствия, связанные с этим выбором.
                    </p>
                    <p className={styles.text}>
                        Пожалуйста, имейте в виду, что более высокий риск может привести как к значительной прибыли, так и к потенциальным убыткам.
                    </p>
                    <p className={styles.text}>
                        Вы подтверждаете, что понимаете все риски и последствия, связанные с данным выбором, и берете на себя полную ответственность за свои инвестиционные решения.
                    </p>
                </div>
                <div className={styles.buttons}>
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        onClick={action}
                        className={styles.submitButton}
                    >
                        {actionText}
                    </Button>
                    <Button
                        theme={ButtonTheme.BLUE}
                        onClick={onClose}
                        className={styles.submitButton}
                    >
                        Закрыть
                    </Button>
                </div>
            </div>
        </Modal>
    );
});