import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import BackIcon from "shared/assets/svg/ArrowBack.svg";
import CloseIcon from "shared/assets/svg/close.svg";
import { Payments } from "features/Payments/Payments/Payments";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { useDevice } from "shared/hooks/useDevice";
import { resetTariffSelection } from "entities/Payments/slice/paymentsSlice";
import { Button, ButtonTheme } from "shared/ui/Button/Button";


const PaymentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const documentPreview = useSelector((state: RootState) => state.modal.documentsPreview)
    const device = useDevice()
    const [isPaid, setIsPaid] = useState<boolean>(false)
    const paymentStatus = useSelector((state: RootState) => state.payments.currentOrderStatus)
    const currentPaidTariffs = useSelector((s: RootState) => s.payments.paidTariffKeys)
    const paidTariffs = useSelector((s: RootState) => s.payments.paidTariffKeys)
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs)
    const currentOrderId = useSelector((s: RootState) => s.payments.currentOrderId)
    const isConfirming = useSelector((s: RootState) => s.payments.isConfirming);
    const normalize = (id: string) => id.replace(/-/g, '');
    const activePaidTariffs = useMemo(
        () => activeTariffs.filter(t => normalize(t.id) === normalize(currentOrderId)),
        [activeTariffs, currentOrderId]
    );

    const hasTariffAttempt = activePaidTariffs.length > 0


    const { pathname } = useLocation();
    const handleOpenPayment = () => {
        if (activeTariffs.length > 0) {
            navigate('/payments/loading');
        }
    }

    // ===== НОВАЯ ЛОГИКА: Редирект на success если есть активный тариф
    useEffect(() => {
        // Проверяем есть ли активные тарифы с is_active: true
        const hasActiveTariff = activeTariffs.some(tariff => tariff.is_active === true);

        if (hasActiveTariff && !paymentStatus && !pathname.endsWith('/success')) {
            // Если есть активный тариф и нет текущего статуса, редирект на success
            navigate('/payments/success', { replace: true });
        }
    }, [activeTariffs, paymentStatus, pathname, navigate]);

    // useEffect(() => {
    //     if (currentPaidTsfdfariffs !== null) {
    //         navigate('payments/loading')
    //     }
    // }, [currentPaidTariffs])
    // return loading ? (
    //     <Loader />
    // ) : (
    //     <div className={styles.page}>
    //     </div>
    // );
    return (
        <div className={styles.page}>
            {device === 'mobile' && !isPaid && !paymentStatus && (
                <div className={styles.page__title}>
                    {currentOrderId && (
                        <Icon
                            Svg={currentOrderId ? BackIcon : BackIcon}
                            width={24}
                            height={24}
                            onClick={() => currentOrderId ? dispatch(resetTariffSelection()) : navigate("/lk")}
                            pointer
                        />
                    )}
                    <h2 className={styles.page__title}>Тарифы</h2>
                    <Icon
                        Svg={CloseIcon}
                        width={24}
                        height={24}
                        className={styles.close}
                        onClick={() => navigate("/lk")}
                        pointer
                    />
                </div>
            )}
            <div>
                {device !== 'mobile' && !isPaid && !paymentStatus && (
                    <div className={styles.page__title}>
                        {currentOrderId && (
                            <Icon
                                Svg={currentOrderId ? BackIcon : BackIcon}
                                width={24}
                                height={24}
                                onClick={() => currentOrderId ? dispatch(resetTariffSelection()) : navigate("/lk")}
                                pointer
                            />
                        )}

                        <h2 className={styles.page__title}>Тарифы</h2>
                        <Icon
                            Svg={CloseIcon}
                            width={24}
                            height={24}
                            className={styles.close}
                            onClick={() => navigate("/lk")}
                            pointer
                        />
                    </div>
                )}
                <Payments isPaid={(value) => setIsPaid(value)} />
                {/* {hasTariffAttempt && !paymentStatus && (
                    <Button
                        className={styles.payment}
                        theme={ButtonTheme.BLUE}
                        onClick={handleOpenPayment}
                    >
                        Оплатить тариф
                    </Button>
                )} */}
            </div>
            <DocumentPreviewModal
                isOpen={documentPreview.isOpen}
                onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW))}
                isSignedDoc={documentPreview.isOpen}
                docId={documentPreview.docId}
                title='Договор ИС: Приложение 1'
            />
        </div>
    );
};

export default PaymentsPage;
