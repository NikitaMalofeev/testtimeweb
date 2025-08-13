import React, { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import footerSocialRnks from 'shared/assets/svg/footerSocialRnks.svg';
import footerSocialTelegram from 'shared/assets/svg/footerSocialTelegram.svg';
import footerSocialVK from 'shared/assets/svg/footerSocialVK.svg';
import footerSocialYT from 'shared/assets/svg/footerSocialYT.svg';
import footerEagle from 'shared/assets/svg/FooterEagle.svg';
import footerDocument from 'shared/assets/svg/footerDocument.svg';
import faqWhite from 'shared/assets/svg/faqWhite.svg';
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import limitationDoc from 'shared/assets/documents/limitationOfliabil.pdf'
import offerDoc from 'shared/assets/documents/Offer.pdf'
import personalDataAgreementDoc from 'shared/assets/documents/personalDataAgreement.pdf'
import personalPolicyDoc from 'shared/assets/documents/personalPolicyDoc.pdf'
import { DocumentsPreviewPdfModal } from "features/Documents/DocumentsPreviewPdfModal/DocumentsPreviewPdfModal";


export const Footer: React.FC = () => {
    const socialLinks = {
        rnks: "https://ranks.pro/",
        telegram: "https://t.me/RanksInvest",
        vk: "https://vk.com/rankspro",
        youtube: "https://www.youtube.com/@ranksanalytics",
    };
    const footerLinks = [
        { title: "Оферта", doc: offerDoc },
        { title: "Политика конфиденциальности", doc: personalPolicyDoc },
        { title: "Согласие на обработку персональных данных", doc: personalDataAgreementDoc },
        { title: "Ограничение ответственности", doc: limitationDoc },
    ];
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const modalState = useSelector((state: RootState) => state.modal);

    // Храним путь или ID документа для предпросмотра
    const [currentDocForPreview, setCurrentDocForPreview] = useState<string>("");
    const [localModalIsOpen, setLocalModalIsOpen] = useState(false)

    // Как только выбрали документ, открываем модалку
    useEffect(() => {
        if (currentDocForPreview) {
            dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW_PDF, animation: ModalAnimation.LEFT, size: ModalSize.FULL }));
            // console.log(currentDocForPreview + 'current')
        }
    }, [currentDocForPreview, dispatch]);

    const handleSocialClick = (url: string) => {
        window.open(url, "_blank");
    };

    // Устанавливаем документ для превью и дальше useEffect откроет модалку
    const handleOpenDocPreview = (docId: string) => {
        setCurrentDocForPreview(docId);
        setLocalModalIsOpen(true)
    };

    const handleClosePreview = () => {
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_PDF));
        setCurrentDocForPreview("");
        setLocalModalIsOpen(false)
    };

    return (
        <>
            <div className={styles.footer}>
                <div className={styles.footer__contacts}>
                    <div className={styles.footer__header}>
                        <h2 className={styles.footer__name}>RANKS</h2>
                        <p className={styles.footer__legal}>Общество с ограниченной ответственностью «Ранкс»</p>
                    </div>

                    <div className={styles.footer__details}>
                        <p className={styles.footer__email}>Регистрация</p>
                        <p className={styles.footer__details__text}>ИНН: 1659217663</p>
                        <p className={styles.footer__details__text}>ОГРН: 1211600064829</p>
                        <p className={styles.footer__details__text}>г. Казань ул. Роторная 27Б – 153</p>
                    </div>

                    <div className={styles.footer__contact}>
                        <p className={styles.footer__email}>Контакт</p>
                        <a className={styles.footer__email__link} href="mailto:INFO@RANKS.PRO">INFO@RANKS.PRO</a>
                    </div>

                    <div className={styles.footer__contact}>
                        <p className={styles.footer__email}>Отдел продаж</p>
                        <a className={styles.footer__email__link} href="mailto:SALES@RANKS.PRO">SALES@RANKS.PRO</a>
                    </div>

                    <div className={styles.footer__contact}>
                        <p className={styles.footer__email}>Телефон</p>
                        <a href="tel:+79625559433" className={styles.footer__email__link}>+7(962) 555-94-33</a>
                        <a href="tel:+79036845175" className={styles.footer__email__link}>+7(903) 684-51-75</a>
                    </div>



                    <div>
                        <p className={styles.footer__email}>Соцсети</p>
                        <div className={styles.footer__socials}>
                            <Icon
                                onClick={() => handleSocialClick(socialLinks.rnks)}
                                width={32}
                                height={32}
                                Svg={footerSocialRnks}
                                className={styles.footer__social}
                            />
                            <Icon
                                onClick={() => handleSocialClick(socialLinks.telegram)}
                                width={32}
                                height={32}
                                Svg={footerSocialTelegram}
                                className={styles.footer__social}
                            />
                            <Icon
                                onClick={() => handleSocialClick(socialLinks.vk)}
                                width={32}
                                height={32}
                                Svg={footerSocialVK}
                                className={styles.footer__social}
                            />
                            <Icon
                                onClick={() => handleSocialClick(socialLinks.youtube)}
                                width={32}
                                height={32}
                                Svg={footerSocialYT}
                                className={styles.footer__social}
                            />
                        </div>
                    </div>
                    <div className={styles.footer__docs}>
                        <Icon width={24} height={24} Svg={footerDocument} className={styles.footer__docIcon} />
                        <p className={styles.footer__docsText} onClick={() => navigate('/information')}>Документы/Раскрытие информации</p>
                    </div>
                    <div className={styles.footer__faq}>
                        <Icon width={24} height={24} Svg={faqWhite} className={styles.footer__docIcon} />
                        <p className={styles.footer__docsText} onClick={() => navigate('/faq')}>FAQ</p>
                    </div>
                </div>

                <div className={styles.footer__description}>
                    <div className={styles.footer__end}>
                        <Icon width={34} height={34} Svg={footerEagle} className={styles.footer__docIcon} />
                        <p>В реестре инвестиционных советников ЦБ РФ <br></br> под номером 249</p>
                    </div>
                    <div className={styles.footer__registry}>
                        <p className={styles.footer__description__text}>Информация на сайте ООО «Ранкс» предназначена для информационных целей,
                            не гарантирует доход, на который рассчитывает инвестор, при условии использования
                            предоставленной информации для принятия инвестиционных решений. Представленная информация
                            не является индивидуальной инвестиционной рекомендацией. Во всех случаях решение о выборе
                            финансового инструмента либо совершении операции принимается инвестором самостоятельно.
                            ООО «Ранкс» не несёт ответственности за возможные убытки инвестора в случае совершения
                            операций либо инвестирования в финансовые инструменты, упомянутые в представленной информации.
                        </p>
                        <p className={styles.footer__description__text}>Продолжая использовать наш веб-сайт, вы соглашаетесь на обработку своих персональных данных в соответствии
                            с «Политикой конфиденциальности» в отношении обработки персональных данных на сайте, а также с реализуемыми
                            ООО «Ранкс» требованиями к защите персональных данных обрабатываемых на нашем сайте.
                        </p>
                        <p className={styles.footer__description__text}>Прежде чем воспользоваться какой-либо услугой, предоставляемой ООО  «Ранкс», клиент должен самостоятельно
                            оценить экономические риски и выгоды от услуги, налоговые, юридические, бухгалтерские последствия заключения
                            сделки при пользовании конкретной услугой, свою готовность и возможность принять такие риски.
                        </p>
                        <p className={styles.footer__description__text}>Несанкционированное копирование, распространение, а также публикация материалов сайта в любых целях запрещены.
                            ООО «Ранкс» ИНН 1659217663 ОГРН 1211600064829
                        </p>
                    </div>
                </div>

                <div className={styles.footer__footer}>
                    {footerLinks.map(({ title, doc }) => (
                        <span
                            key={title}
                            className={styles.footer__footer__text}
                            onClick={() => handleOpenDocPreview(doc)}
                        >
                            {title}
                        </span>
                    ))}
                    <span className={styles.footer__footer__text}>© «RANKS» 2025. Все права защищены</span>
                </div>
            </div>

            <DocumentsPreviewPdfModal
                pdfUrl={currentDocForPreview}
                isOpen={modalState.documentsPreviewPdf.isOpen && localModalIsOpen}
                onClose={handleClosePreview}
            />
        </>
    );
};
