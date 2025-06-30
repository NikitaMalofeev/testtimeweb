import React, { ReactElement, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./styles.module.scss";
import { setIsBottom } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useDevice } from "shared/hooks/useDevice";

const steps = ["Шаг 1 из 6", "Шаг 2 из 6", "Шаг 3 из 6", "Шаг 4 из 6", "Шаг 5 из 6", "Шаг 6 из 6"];

interface AdditionalMenuProps {
    onClose: () => void;
    title: string;
    content: ReactElement;
    description: string | boolean | ReactElement;
}

export const AdditionalMenu: React.FC<AdditionalMenuProps> = ({ onClose, title, content, description }) => {
    const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);
    const currentStepFirstForm = useSelector((state: RootState) => state.riskProfile.stepsFirstForm)
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);
    const dispatch = useAppDispatch()
    const currentTypeDoc = useSelector(
        (state: RootState) => state.documents.currentConfirmableDoc
    );
    const device = useDevice()

    useEffect(() => {
        let lastIsAtBottom: boolean | null = null;
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                setHasScrolled(scrollTop > 0);

                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                if (lastIsAtBottom !== isAtBottom) {
                    lastIsAtBottom = isAtBottom;
                    dispatch(setIsBottom(isAtBottom));
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, [dispatch]);


    // useEffect(() => {
    //     dispatch(setIsBottom(true));
    // }, [currentStepFirstForm])



    // useEffect(() => {
    //     // При монтировании проверяем, есть ли скролл чтобы накинуть на кнопки скролл эффект
    //     if (containerRef.current) {
    //         const { scrollHeight, clientHeight } = containerRef.current;


    //         if (scrollHeight > clientHeight) {
    //             dispatch(setIsBottom(false))
    //         }
    //     }
    // }, [currentStepFirstForm]);

    useEffect(() => {
        if (currentTypeDoc) {
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentTypeDoc, containerRef.current])

    return (
        <div className={styles.additionalMenu}>
            {device === 'mobile' && (
                <div className={styles.progressBar}>
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`${styles.progressStep} ${index <= currentStep ? styles.active : ""}`}
                        />
                    ))}
                </div>
            )}


            <div ref={containerRef} className={`${styles.additionalMenu__container} ${hasScrolled ? styles.additionalMenu__container_scrolled : ""}`}>
                {device !== 'mobile' && (
                    <div className={styles.progressBar}>
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`${styles.progressStep} ${index <= currentStep ? styles.active : ""}`}
                            />
                        ))}
                    </div>
                )}
                <div className={`${styles.header} ${hasScrolled ? styles.shadow : ""}`}>
                    <h2 className={styles.header__title}>{title}</h2>
                    {device === 'mobile' && description && <Tooltip positionBox={{ top: '26px', left: '-264px' }} bigContentSquerePosition={currentStep === 2 ? { top: '32px', left: '241px' } : { top: '15px', left: '241px' }} topForCenteringIcons='24px' description={description} className={`${styles.header__tooltip} ${hasScrolled ? styles.header__tooltip_scrolled : ""}`} />}
                    {device !== 'mobile' && description && <Tooltip positionBox={{ top: '40px', left: '30px' }} bigContentSquerePosition={currentStep === 2 ? { top: '10px', left: '-5px' } : { top: '12px', left: '-5px' }} topForCenteringIcons='24px' description={description} className={`${styles.header__tooltip} ${hasScrolled ? styles.header__tooltip_scrolled : ""}`} />}
                </div>

                {content}
            </div>
        </div>
    );
};
