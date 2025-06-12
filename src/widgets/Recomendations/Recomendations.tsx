import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'shared/ui/Tooltip/Tooltip';
import { DocumentPreviewModal } from 'features/Documents/DocumentsPreviewModal/DocumentPreviewModal';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { closeModal, openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { InfoModal } from 'features/RiskProfile/InfoModal/InfoModal';
import {
    getSignedIirDocumentThunk,
    getUserIirsThunk,
    getUserNotSignedIirHtmlThunk,
    rejectIirDocumentThunk,
} from 'entities/Recomendations/slice/recomendationsSlice';
import { RecomendationsCard } from 'features/Recomendations/RecomendationsCard/RecomendationsCard';
import { RecomendationsRejectModal } from 'features/Recomendations/RecomendationsRejectModal/RecomendationsRejectModal';

export const Recomendations = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    /** выбранный документ для предпросмотра */
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const { isOpen: isPreviewModalOpen } = useSelector((s: RootState) => s.modal.documentsPreview);
    const { isOpen: isInfoModalOpen } = useSelector((s: RootState) => s.modal.info);

    /** список IIR из стора */
    const iirList = useSelector((s: RootState) => s.recomendations.list);

    /* ----------------- side-effects ----------------- */

    useEffect(() => {
        dispatch(getUserIirsThunk({}));
    }, [dispatch]);

    /* ----------------- handlers ----------------- */

    const handlePreview = async (uuid: string, status: string) => {
        await setSelectedId(uuid);

        if (status === 'IIR_SIGNED' || 'IIR_AUTO_AGREED') {
            dispatch(getSignedIirDocumentThunk({ payload: { uuid } }))
        } else {
            dispatch(getUserNotSignedIirHtmlThunk({ uuid }));
        }


        // dispatch(getSignedIirDocumentThunk({ payload: { uuid } }));

        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW,
                animation: ModalAnimation.LEFT,
                size: ModalSize.FULL,
                docId: uuid,
            }),
        );
    };

    const handleReject = (uuid: string) => {
        setSelectedId(uuid);
        dispatch(
            openModal({
                type: ModalType.INFO,
                animation: ModalAnimation.LEFT,
                size: ModalSize.MC,
            }),
        );
    };

    const handleClosePreview = () => {
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));
    };

    /* ----------------- render ----------------- */

    return (
        <div className={styles.recomendations}>
            <div className={styles.recomendations__title}>
                <Icon
                    className={styles.recomendations__title__icon}
                    Svg={BackIcon}
                    width={24}
                    height={24}
                    onClick={() => navigate(-1)}
                />
                <h2 className={styles.recomendations__title__title}>
                    Индивидуальные инвестиционные рекомендации
                </h2>
                <Tooltip
                    positionBox={{ top: '68px', left: '-224px' }}
                    squerePosition={{ top: '-4px', left: '228px' }}
                    boxWidth={{ width: '280px' }}
                    topForCenteringIcons="24px"
                    className={styles.recomendations__tooltip}
                    description="Если ИИР не отклонено в течение суток,
                то считается исполненным"
                />
            </div>

            <div className={styles.recomendations__content}>
                {iirList.map((item, idx) => (
                    <RecomendationsCard
                        key={item.uuid}
                        uuid={item.uuid}
                        title={`Индивидуальная инвестиционная рекомендация (ИИР) # ${idx + 1}`}
                        created={item.created}
                        status={item.status}
                        onPreviewClick={handlePreview}
                        onRejectClick={handleReject}
                    />
                ))}
            </div>

            {/* ---------- модалки ---------- */}
            <DocumentPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={handleClosePreview}
                isSignedDoc={false}
                docId={`iir_${selectedId}`}
                title="Индивидуальная инвестиционная рекомендация"
            />

            <InfoModal
                isOpen={isInfoModalOpen}
                title='Хотите отклонить ИИР?'
                onClose={() => {
                    dispatch(closeModal(ModalType.INFO));
                }}
                infoComponent={<RecomendationsRejectModal onReject={(uuid) => {
                    // здесь ваш диспатч отклонения
                    dispatch(
                        rejectIirDocumentThunk({
                            payload: { uuid },
                            onSuccess: () => {
                                dispatch(closeModal(ModalType.INFO));
                                dispatch(getUserIirsThunk({}));
                            },
                        }),
                    );
                }} uuid={selectedId!} onCancel={() => dispatch(closeModal(ModalType.INFO))} />}
            />
        </div>
    );
};
