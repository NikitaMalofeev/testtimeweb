import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import BackIcon from "shared/assets/svg/ArrowBack.svg";
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'shared/ui/Tooltip/Tooltip';
import { RecomendationsCard } from 'features/Recomendations/RecomendationsCard/RecomendationsCard';
import { DocumentPreviewModal } from 'features/Documents/DocumentsPreviewModal/DocumentPreviewModal';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { closeModal, openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { PreviewModal } from 'features/RiskProfile/PreviewModal/PreviewModal';
import { InfoModal } from 'features/RiskProfile/InfoModal/InfoModal';


export const Recomendations = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [selectedRecomendationId, setSelectedRecomendationId] = useState<string | undefined>();
    const { isOpen: isPreviewModalOpen } = useSelector((s: RootState) => s.modal.documentsPreview)
    const { isOpen: isInfoModalOpen } = useSelector((s: RootState) => s.modal.info)

    const handleClosePreview = () => {
        setTimeout(() => {
            dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED));
        }, 0);
    };

    const handleOpenPreview = () => {
        setSelectedRecomendationId('1');
        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW,
                animation: ModalAnimation.LEFT,
                size: ModalSize.FULL,
                docId: selectedRecomendationId
            })
        );
    }

    const handleOpenDiscardRecomendations = () => {
        dispatch(openModal({
            type: ModalType.INFO,
            animation: ModalAnimation.LEFT,
            size: ModalSize.MC,
        }));
    }

    return (
        <div className={styles.recomendations}>
            <div className={styles.recomendations__title}>
                <Icon className={styles.recomendations__title__icon} Svg={BackIcon} width={24} height={24} onClick={() => navigate(-1)} />
                <h2 className={styles.recomendations__title__title}>Индивидуальные инвестиционные рекомендации</h2>
                <Tooltip
                    positionBox={{ top: "68px", left: "-224px" }}
                    squerePosition={{ top: "-4px", left: "228px" }}
                    boxWidth={{ width: '280px' }}
                    topForCenteringIcons="24px"
                    className={styles.recomendations__tooltip}
                    description="Если ИИР не отклонено в течение суток,
                то считается исполненным"
                />
            </div>
            <div className={styles.recomendations__content}>
                <RecomendationsCard onPreviewClick={handleOpenPreview} onRejectClick={handleOpenDiscardRecomendations} />
            </div>

            <DocumentPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={handleClosePreview}
                isSignedDoc={false}
                docId={selectedRecomendationId}
                // title={
                //     (documentsPreview.docId || documentsPreviewSigned.docId)
                //         ? ''
                //         : 'Документ'
                // }
                title={
                    'Документ'
                }
            />

            <InfoModal
                isOpen={isInfoModalOpen}
                title='Хотите отклонить ИИР?'
                onClose={() => {
                    dispatch(closeModal(ModalType.INFO));
                }}
                infoComponent={<>Люблю машулю</>}
            />

        </div>
    );
};