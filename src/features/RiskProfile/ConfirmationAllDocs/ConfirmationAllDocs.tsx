import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import { postPasportInfo, updateFieldValue } from "entities/RiskProfile/slice/riskProfileSlice";
import { Input } from "shared/ui/Input/Input";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal, setCurrentConfirmModalType } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";

export const ConfirmAllDocs: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const modalState = useSelector((state: RootState) => state.modal);
    const currentTypeDoc = useSelector((state: RootState) => state.documents.currentConfirmableDoc);


    return (
        <>
            <div className={styles.page}>
                <div className={styles.page__container}>

                </div>
                <div className={styles.page__container}>
                    <span>{'заголовок шага'}</span> <Button onClick={() => { }} theme={ButtonTheme.BLUE} className={styles.button} disabled={false}>
                        Просмотр
                    </Button>
                </div>
                <Checkbox
                    name="is_agreement"
                    value={formik.values.is_agreement}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={
                        <span className={styles.checkbox__text}>
                            Вы соглашаетесь с{" "}
                            <a
                                className={styles.checkbox__link}
                                href="#"
                                onClick={(e) => e.preventDefault()}
                            >
                                Условиями использования и Политикой конфиденциальности
                            </a>
                        </span>
                    }
                    error={formik.touched.is_agreement && formik.errors.is_agreement}
                />
                {/* <div>
                    {'модалка подробностей'}
                    <p className={styles.page__description}>Электронный документооборот это такой способ организации работы с документами, когда они формируются в электронном виде (без использования бумажных носителей) и передаются по телекоммуникационным каналам связи. Процесс передачи документов можно сравнить с электронной почтой. Сервис гарантирует доставку документов, контроль формата пересылаемых документов их заверения электронной подписью, а также хранит архив документов. Присоединение к договору об
                        электронном документообороте (ЭДО) необходимо для подтверждения юридической значимости
                        подписываемых электронных документов. Под ЭДО для физических лиц подразумевается простая электронная подпись. Одно из главных преимуществ электронного документооборота - это значительное сокращение расходов на печать (траты на бумагу, оргтехнику и расходные материалы к принтерам), почтовую пересылку, хранение документов, а главное необходимость поездки в офис компании для подписания документов.
                    </p>
                </div> */}
                <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""
                    }`}>
                    <span>Документ 1 из 6</span>
                    <Button onClick={() => { }} theme={ButtonTheme.BLUE} className={styles.button} disabled={false}>
                        Подписать
                    </Button>
                </div>
            </div>
            <ConfirmDocsModal isOpen={modalState.confirmDocsModal.isOpen} onClose={() => { dispatch(closeModal(ModalType.CONFIRM_DOCS)) }} docsType={currentTypeDoc} />
        </>
    );
};
