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
import { ConfirmAllDocsPayload } from "entities/Documents/types/documentsTypes";

interface Props {
    docs: { id: string; title: string }[];
    onClose: () => void;
}

const DOC_TO_FLAG: Record<string, string> = {
    type_doc_EDS_agreement: 'is_agree_type_doc_eds_agreement',
    type_doc_RP_questionnairy: 'is_agree_type_doc_rp_questionnairy',
    type_doc_agreement_investment_advisor: 'is_agree_type_doc_agreement_investment_advisor',
    type_doc_risk_declarations: 'is_agree_type_doc_risk_declarations',
    type_doc_agreement_personal_data_policy: 'is_agree_type_doc_agreement_personal_data_policy',
    type_doc_investment_profile_certificate: 'is_agree_type_doc_investment_profile_certificate',
    type_doc_agreement_account_maintenance: 'is_agree_type_doc_agreement_account_maintenance',
};

export const BulkSignModal: React.FC<Props> = ({ docs, onClose }) => {
    const dispatch = useAppDispatch();
    const [channel, setChannel] = useState<"SMS" | "EMAIL" | "WHATSAPP">("EMAIL");
    const [agreeAll, setAgreeAll] = useState(false);
    const brokerIds = useSelector((s: RootState) => s.documents.brokerIds)

    const buildFlags = (selected: { id: string }[]) =>
        selected.reduce<Record<string, boolean>>((acc, d) => {
            const flag = DOC_TO_FLAG[d.id];
            if (flag) acc[flag] = true;      // добавляем только то, что действительно выбрано
            return acc;
        }, {});

    const buildPayload = (
        selected: { id: string }[],
        channel: 'SMS' | 'EMAIL' | 'WHATSAPP',
        brokerId: string,
    ): ConfirmAllDocsPayload => {
        // 1. создаём объект‑заготовку со всеми false
        const baseFlags = Object.values(DOC_TO_FLAG).reduce<Record<string, boolean>>(
            (acc, flag) => {
                acc[flag] = false;
                return acc;
            },
            {},
        );

        // 2. включаем true для реально выбранных
        selected.forEach(d => {
            const flag = DOC_TO_FLAG[d.id];
            if (flag) baseFlags[flag] = true;
        });

        // 3. собираем итоговый payload
        return {
            type_message: channel,
            broker_id: brokerId,
            ...baseFlags,
        } as ConfirmAllDocsPayload;
    };


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
        if (!agreeAll || !docs.length) return;

        const payload = buildPayload(docs, channel, brokerIds[0]);

        dispatch(
            confirmAllDocsRequestThunk({
                data: payload,
                onSuccess: () => {
                    dispatch(openModal({
                        type: ModalType.CONFIRM_ALL_DOCS_ONE_CODE,
                        size: ModalSize.MIDDLE,
                        animation: ModalAnimation.LEFT,
                    }));
                    dispatch(getUserDocumentsNotSignedThunk());
                    dispatch(getUserDocumentsStateThunk());
                    onClose();
                },
            }),
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
