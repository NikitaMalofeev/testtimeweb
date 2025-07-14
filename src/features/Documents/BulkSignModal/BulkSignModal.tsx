import React, { useEffect, useState } from "react";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Modal } from "shared/ui/Modal/Modal";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import {
    getUserDocumentsNotSignedThunk,
    getUserDocumentsSignedThunk,
    confirmAllDocsRequestThunk,
    getUserDocumentsStateThunk,
} from "entities/Documents/slice/documentsSlice";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";

interface Props {
    docs: { id: string; title: string }[];
    onClose: () => void;
}

export const BulkSignModal: React.FC<Props> = ({ docs, onClose }) => {
    const dispatch = useAppDispatch();
    const [channel, setChannel] = useState<"SMS" | "EMAIL" | "WHATSAPP">("EMAIL");
    const [agreeAll, setAgreeAll] = useState(false);
    const brokerIds = useSelector((s: RootState) => s.documents.brokerIds)

    const handlePreview = (id: string) => {
        dispatch(getUserDocumentsNotSignedThunk());
        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW,
                size: ModalSize.FULL,
                animation: ModalAnimation.LEFT,
                docId: id,
            })
        );
    };

    const handleSign = () => {
        if (!agreeAll) return;

        dispatch(
            confirmAllDocsRequestThunk({
                data: {
                    type_message: channel,
                    is_agree_type_doc_eds_agreement: true,
                    is_agree_type_doc_rp_questionnairy: true,
                    is_agree_type_doc_agreement_investment_advisor: true,
                    is_agree_type_doc_risk_declarations: true,
                    is_agree_type_doc_agreement_personal_data_policy: true,
                    is_agree_type_doc_investment_profile_certificate: true,
                    is_agree_type_doc_agreement_account_maintenance: true,

                    broker_id: brokerIds[0]
                },
                onSuccess: () => {
                    dispatch(openModal({ type: ModalType.CONFIRM_ALL_DOCS_ONE_CODE, size: ModalSize.MIDDLE, animation: ModalAnimation.LEFT }))
                    dispatch(getUserDocumentsNotSignedThunk());
                    dispatch(getUserDocumentsStateThunk())
                    onClose();
                },
            })
        );
    };

    return (
        <Modal
            isOpen={true}
            type={ModalType.CONFIRM_ALL_DOCS}
            size={ModalSize.MIDDLE}
            animation={ModalAnimation.LEFT}
            onClose={onClose}
        >
            <div className={styles.modal}>
                <h3 className={styles.title}>Документы к подписанию</h3>

                <ul className={styles.list}>
                    {docs.map((d) => (
                        <li key={d.id} className={styles.list__item}>
                            <span>{d.title}</span>
                            <Button
                                theme={ButtonTheme.UNDERLINE}
                                className={styles.preview}
                                onClick={() => handlePreview(d.id)}
                                padding="10px"
                            >
                                Просмотр
                            </Button>
                        </li>
                    ))}
                </ul>

                <div className={styles.channel}>
                    <span className={styles.label}>Куда отправить код</span>
                    <CheckboxGroup
                        name="type_message"
                        greedOrFlex="flex"
                        direction="row"
                        options={[
                            { label: "Email", value: "EMAIL" },
                            { label: "SMS", value: "SMS" },
                            { label: "Whatsapp", value: "WHATSAPP" },
                        ]}
                        value={channel}
                        onChange={(_, v) => setChannel(v as any)}
                    />
                </div>

                <div className={styles.agreeAll}>
                    <Checkbox
                        name="agreeAll"
                        value={agreeAll}
                        onChange={(e) => setAgreeAll(e.target.checked)}
                        label={<span>Согласен подписать все документы</span>}
                    />
                </div>

                <Button
                    theme={ButtonTheme.BLUE}
                    className={styles.sign}
                    onClick={handleSign}
                    padding="10px"
                    disabled={!agreeAll}
                >
                    Подписать
                </Button>
            </div>
        </Modal>
    );
};
