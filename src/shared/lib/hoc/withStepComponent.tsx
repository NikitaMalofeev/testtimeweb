// withStepContent.tsx
import React, { ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';



import styles from './styles.module.scss';
import { RiskProfileFirstForm } from 'features/RiskProfile/RiskProfileFirstForm/RiskProfileFirstForm';
import { RiskProfileSecondForm } from 'features/RiskProfile/RiskProfileSecondForm/RiskProfileSecondForm';
import { LegalDataForm } from 'features/RiskProfile/LegalDataForm/LegalDataForm';
import { PasportDataForm } from 'features/RiskProfile/PasportDataFrom/PasportDataForm';
import { PasportScanForm } from 'features/RiskProfile/PassportScanForm/PassportScanForm';
import { ConfirmAllDocs } from 'features/RiskProfile/ConfirmationAllDocs/ConfirmationAllDocs';
import { BrokerConnectionForm } from 'features/RiskProfile/BrokerConnectionForm/BrokerConnectionForm';
import { IEIINForm } from 'features/RiskProfile/IEIINForm/IEIINForm';
import { Loader, LoaderSize } from 'shared/ui/Loader/Loader';

interface WithStepContentProps {
    onClose: () => void;
}
interface StepLayoutProps {
    onClose: () => void;
    title: string;
    content: ReactElement;
    description: string | ReactElement | boolean;
}

const withStepContent = (StepLayout: React.FC<StepLayoutProps>) =>
    ({ onClose }: WithStepContentProps) => {
        /* ───── селекторы ───── */
        const user = useSelector(
            (s: RootState) => s.user.userPersonalAccountInfo,
        );
        const currentStep = useSelector(
            (s: RootState) => s.ui.additionalMenu.currentStep,
        );

        /* ───── ждём данные ───── */
        const isIE = user?.is_individual_entrepreneur === true;
        const dataReady = user && user.is_individual_entrepreneur !== undefined;
        if (!dataReady) return <Loader size={LoaderSize.LARGE} />;

        /* ───── заголовок + контент ───── */
        const { title, content } = useMemo(() => {
            const titles = [
                'Риск-профилирование',
                'Уточнение риск-профиля',
                isIE ? 'Данные об ИП' : 'Паспортные данные',
                'Отправка документов',
                'Подписание документов',
                'Настройка подключения к брокеру',
                'Отправка документов',
            ];

            const steps = [
                <RiskProfileFirstForm key="step-1" />,
                <RiskProfileSecondForm key="step-2" />,
                isIE ? (
                    <LegalDataForm key="step-3-ie" />
                ) : (
                    <PasportDataForm key="step-3-pass" />
                ),
                isIE ? (
                    <IEIINForm key="step-4-ie" />
                ) : (
                    <PasportScanForm key="step-4-pass" />
                ),
                <ConfirmAllDocs key="step-5" />,
                <BrokerConnectionForm key="step-6" />,
            ];

            return {
                title: titles[currentStep] ?? '',
                content: steps[currentStep] ?? <></>,
            };
        }, [isIE, currentStep]);

        /* ───── описание шага ───── */
        const maxRisk = useSelector((s: RootState) => {
            const p = s.riskProfile.secondRiskProfileData?.recommended_risk_profiles;
            return p ? Object.values(p).at(-1) ?? null : null;
        });

        const description = useMemo(() => {
            const list: Array<string | ReactElement> = [
                'Пройдите анкетирование для определения вашего инвестиционного профиля',
                (
                    <div className={styles.description}>
                        <span className={styles.description__title}>
                            Максимально допустимый риск-профиль: {maxRisk}
                        </span>
                    </div>
                ),
                'Данные вводимые в форму должны совпадать с паспортом и ИНН',
                'Данные вводимые в форму должны совпадать с паспортом и ИНН',
                'Подписание документов по «ЭДО»',
            ];
            return list[currentStep];
        }, [currentStep, maxRisk]);

        /* ───── рендер ───── */
        return (
            <StepLayout
                key={`${isIE}-${currentStep}`} // гарантированный ремоунт при смене типа
                onClose={onClose}
                title={title}
                content={content}
                description={description}
            />
        );
    };

export default withStepContent;
