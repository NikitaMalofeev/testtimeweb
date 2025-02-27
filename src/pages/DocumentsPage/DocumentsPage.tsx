import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { docTypes, getUserDocumentsStateThunk, setCurrentConfirmableDoc } from "entities/Documents/slice/documentsSlice";
import styles from './styles.module.scss';
import { Icon } from "shared/ui/Icon/Icon";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import BackIcon from 'shared/assets/svg/ArrowBack.svg'
import SuccessBlueIcon from 'shared/assets/svg/SuccessBlueIcon.svg'
import { useNavigate } from "react-router-dom";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import DownloadIcon from 'shared/assets/svg/DownloadDocument.svg'
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { Loader } from "shared/ui/Loader/Loader";

const docTypeLabels: Record<string, string> = {
    type_doc_RP_questionnairy: "1. Анкета РП",
    type_doc_passport: "2. Паспортные данные",
    type_doc_EDS_agreement: "3. Соглашение об ЭДО",
    type_doc_agreement_investment_advisor: "4. Договор ИС",
    type_doc_risk_declarations: "5. Декларация о рисках",
    type_doc_agreement_personal_data_policy: "6. Политика перс. данных",
    type_doc_investment_profile_certificate: "7. Справка ИП",
};

const docOrder = [
    'type_doc_RP_questionnairy',
    'type_doc_passport',
    'type_doc_EDS_agreement',
    'type_doc_agreement_investment_advisor',
    'type_doc_risk_declarations',
    'type_doc_agreement_personal_data_policy',
    'type_doc_investment_profile_certificate',
];

const DocumentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate()

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk({}));
    }, [dispatch]);

    const { notConfirmedDocuments, loading } = useSelector((state: RootState) => state.documents);

    const handleSignDocument = (docId: string) => {
        switch (docId) {
            case 'type_doc_RP_questionnairy':
                dispatch(setStepAdditionalMenuUI(1))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            case 'type_doc_passport':
                dispatch(setStepAdditionalMenuUI(3))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            case 'type_doc_EDS_agreement':
                dispatch(setCurrentConfirmableDoc(docId))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            case 'type_doc_agreement_investment_advisor':
                dispatch(setCurrentConfirmableDoc(docId))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            case 'type_doc_risk_declarations':
                dispatch(setCurrentConfirmableDoc(docId))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            case 'type_doc_agreement_personal_data_policy':
                dispatch(setCurrentConfirmableDoc(docId))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            case 'type_doc_investment_profile_certificate':
                dispatch(setCurrentConfirmableDoc(docId))
                dispatch(openModal({ type: ModalType.IDENTIFICATION, size: ModalSize.FULL, animation: ModalAnimation.LEFT }))
                break;
            default:
                console.log("Неподдерживаемый тип документа");
        }
    };

    const documents = docOrder.map((type) => {
        return {
            id: type,
            title: docTypeLabels[type],
            date: "07.03.2025",
            status: notConfirmedDocuments.includes(type) ? "signable" : "signed",
        };
    });

    const firstNotConfirmed = docOrder.find(type => notConfirmedDocuments.includes(type));

    const renderedDocuments = documents.map((doc) => {
        let colorClass = styles.button__green; // по умолчанию 1ый неподписанный
        if (notConfirmedDocuments.includes(doc.id)) {
            colorClass = styles.button__red; // если в списке неподтвержденных
        }
        if (doc.id === firstNotConfirmed) {
            colorClass = styles.button__gray; // первый неподтвержденный
        }

        return {
            ...doc,
            colorClass,
        };
    });

    return loading ? <Loader /> : (
        <div className={styles.page}>
            <div className={styles.page__container}>
                <div className={styles.page__title}>
                    <Icon Svg={BackIcon} width={24} height={24} onClick={() => {
                        navigate('/lk')
                    }} /> <h2 className={styles.page__title}>Список документов</h2>
                </div>
                <div className={styles.documents__list}>
                    {renderedDocuments.map((doc) => (
                        <div key={doc.id} className={styles.document__item}>
                            <div className={styles.document__info}>
                                <span className={styles.document__info__title}>{doc.title}</span>
                                <div className={styles.document__info__flex}>
                                    <Button className={styles.document__preview} theme={ButtonTheme.UNDERLINE} children='Просмотр' />
                                    <Icon Svg={DownloadIcon} width={33} height={33} />
                                </div>
                            </div>


                            <div className={styles.document__status}>
                                <span className={styles.document__date}>{doc.date}</span>
                                {doc.status == "signed" ? <div className={styles.document__button_success}>
                                    <Icon Svg={SuccessBlueIcon} width={24} height={24} /> <span>Подписано</span>
                                </div> :
                                    <Button onClick={() => handleSignDocument(doc.id)} disabled={doc.status === "not_signable"} className={doc.colorClass} theme={ButtonTheme.BLUE} >
                                        Подписать
                                    </Button>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default DocumentsPage;