import React, { useState, useEffect } from "react";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { SupportChat } from "features/SupportChat/SupportChat";
import { getAllTariffsThunk } from "entities/Payments/slice/paymentsSlice";
import { Icon } from "shared/ui/Icon/Icon";
import BackIcon from "shared/assets/svg/ArrowBack.svg";
import { Payments } from "features/Payments/Payments/Payments";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";


const PaymentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const documentPreview = useSelector((state: RootState) => state.modal.documentsPreview)
    const [isPaid, setIsPaid] = useState<boolean>(false)
    const paymentStatus = useSelector((state: RootState) => state.payments.currentOrderStatus)

    // return loading ? (
    //     <Loader />
    // ) : (
    //     <div className={styles.page}>
    //     </div>
    // );
    return (
        <div className={styles.page}>
            {!isPaid && !paymentStatus && (
                <div className={styles.page__title}>
                    <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate("/lk")} />
                    <h2 className={styles.page__title}>Тарифы</h2>
                </div>
            )}
            <div>
                <Payments isPaid={(value) => setIsPaid(value)} />
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
