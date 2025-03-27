import React from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import footerSocialDzen from 'shared/assets/svg/footerSocialDzen.svg'
import footerSocialRnks from 'shared/assets/svg/footerSocialRnks.svg'
import footerSocialTelegram from 'shared/assets/svg/footerSocialTelegram.svg'
import footerSocialVK from 'shared/assets/svg/footerSocialVK.svg'
import footerSocialYT from 'shared/assets/svg/footerSocialYT.svg'
import footerEagle from 'shared/assets/svg/FooterEagle.svg'
import footerDocument from 'shared/assets/svg/footerDocument.svg'

export const Footer = () => {

    const socialLinks = {
        rnks: "https://ranks.pro/",
        telegram: "https://t.me/RanksInvest",
        vk: "https://vk.com/rankspro",
        youtube: "https://www.youtube.com/@ranksanalytics",
    };

    const handleSocialClick = (url: string) => {
        window.open(url, "_blank");
    };

    return (
        <div className={styles.footer}>
            <div className={styles.footer__contacts}>
                <div className={styles.footer__header}>
                    <h2 className={styles.footer__name}>RANKS</h2>
                    <p className={styles.footer__legal}>ООО «Ранкс»</p>
                </div>
                <div className={styles.footer__details}>
                    <p className={styles.footer__details__text}>ИНН: 1659217663</p>
                    <p className={styles.footer__details__text}>ОГРН: 1211600064829</p>
                    <p className={styles.footer__details__text}>г. Казань ул. Роторная 27Б – 153</p>
                </div>
                <div className={styles.footer__contact}>
                    <p className={styles.footer__email}>Почта</p>
                    <a className={styles.footer__email__link} href="mailto:INFO@RANKS.PRO">INFO@RANKS.PRO</a>

                </div>
                <div className={styles.footer__contact}>
                    <p className={styles.footer__email}>Контакты</p>
                    <a href="tel:+79625559433" className={styles.footer__email__link}>+7(962) 555-94-33</a>
                    <a href="tel:+79036845175" className={styles.footer__email__link}>+7(903) 684-51-75</a>
                </div>



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
                <div className={styles.footer__docs}>
                    <Icon width={24} height={24} Svg={footerDocument} className={styles.footer__docIcon} />
                    <p className={styles.footer__docsText}>Документы/Раскрытие информации</p>
                </div>
            </div>

            <div className={styles.footer__description}>
                <div className={styles.footer__registry}>
                    <Icon width={34} height={34} Svg={footerEagle} className={styles.footer__docIcon} />
                    <p>В реестре инвестиционных советников ЦБ РФ <br></br> под номером 249</p>
                </div>
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

            <div className={styles.footer__footer}>
                <span className={styles.footer__footer__text}>Оферта</span>
                <span className={styles.footer__footer__text}>Политика конфиденциальности</span>
                <span className={styles.footer__footer__text}>Согласие на обработку персональных данных</span>
                <span className={styles.footer__footer__text}>Ограничение ответственности</span>
                <span className={styles.footer__footer__text}>© «RANKS» 2025. Все права защищены</span>
            </div>
        </div>
    );
};
