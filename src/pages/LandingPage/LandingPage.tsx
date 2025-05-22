// TariffsPage.tsx

import React, { useState } from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import BaseTariffIcon from "shared/assets/images/paymentsBase.png";
import { Input } from "shared/ui/Input/Input";
import Bacground from 'shared/assets/landing/original.jpg'
import Eagle from 'shared/assets/svg/FooterEagle.svg';
import InvestmentManager from 'shared/assets/svg/invesment-manager.svg';
import { LandingStart } from "widgets/LandingStart/LandingStart";
import LandingPlanet from 'shared/assets/svg/landingPlanet.svg'
import { Button } from "shared/ui/Button/Button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import ArrowIcon from 'shared/assets/svg/arrowTop-right.svg';
import Certificate1 from 'shared/assets/landing/certificates/certificates_1.png'
import Certificate2 from 'shared/assets/landing/certificates/certificates_2.png'
import Certificate3 from 'shared/assets/landing/certificates/certificates_3.png'
import Certificate4 from 'shared/assets/landing/certificates/certificates_4.png'
import Certificate5 from 'shared/assets/landing/certificates/certificates_5.png'
import Certificate6 from 'shared/assets/landing/certificates/certificates_6.png'
import Certificate7 from 'shared/assets/landing/certificates/certificates_7.png'
import Certificate8 from 'shared/assets/landing/certificates/certificates_8.png'
import Certificate9 from 'shared/assets/landing/certificates/certificates_9.png'
import Certificate10 from 'shared/assets/landing/certificates/certificates_10.png'
import Certificate11 from 'shared/assets/landing/certificates/certificates_11.png'

const MIN_DEPOSIT = 1_000_000;      // минимальный депозит
const MAX_DEPOSIT = 100_000_000;    // максимальный депозит
const STEP_DEPOSIT = 100_000;       // шаг ползунка

/** Формат «1 000 000 ₽» */
const formatMoney = (num: number) =>
    String(num).replace(/\B(?=(\d{3})+(?!\d))/g, " ").concat(" ₽");

/** Парсинг «1 000 000 ₽» → 1000000 */
const parseMoney = (str: string) => {
    const raw = str.replace(/\s/g, "").replace("₽", "").trim();
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
};

const TariffsPage: React.FC = () => {
    const [deposit, setDeposit] = useState<number>(MIN_DEPOSIT);
    const navigate = useNavigate()
    const user = useSelector((s: RootState) => s.user.token)

    /** 0.5 % от прибыли в 20 % от суммы = 0.1 % от депозита */
    const commission = deposit * 0.02;

    return (
        <div className={styles.page}>
            <div className={styles.page__wrapper}>
                <LandingStart />
                <div className={styles.planet}>
                    <img src={LandingPlanet} alt="" className={styles.planet__img} />
                    <div className={styles.planet__content}>
                        <h2 className={styles.planet__title}>Мы не играем по правилам рынка</h2>
                        <span className={styles.planet__description}>Наши технологии - это прорыв в инвестициях, позволяющий нам видеть потенциал там, где другие ничего не замечают.</span>
                        <span className={styles.planet__offer}>Мы создаем индивидуальные инвестиционные портфели,
                            точно соответствующие финансовым целям и риск-профилю каждого клиента</span>
                    </div>
                </div>
                {/* блок карточек */}
                <div className={styles.tariffs}>
                    {/* описание тарифа */}
                    <div className={styles.tariffs__wrapper}>
                        <div className={styles.card} style={{ gap: '16px' }}>
                            <div className={styles.card__content}>
                                <Icon Svg={BaseTariffIcon} width={65} height={47} />
                                <div className={styles.card__title}>
                                    <span className={styles.card__title__subtitle}>
                                        для начинающих инвесторов
                                    </span>
                                    <span className={styles.card__title__title}>Базовый тариф</span>
                                </div>
                            </div>
                            <div className={styles.card__description}>
                                <span>
                                    Управление активами клиента Инвестиционным Советником ООО «Ранкс» в
                                    соответствии с выбранным риск-профилем.
                                </span>
                                <span>
                                    <b>2 %</b> — рассчитывается от суммы депозита и оплачивается при
                                    старте.
                                </span>
                                <span>Введите сумму, которую планируете инвестировать, и наш калькулятор рассчитает стоимость услуги. Минимальная стоимость услуги от 20 000 ₽</span>
                            </div>
                        </div>

                        {/* калькулятор */}
                        <div className={styles.tariffs__card}>
                            <span className={styles.card__calc_title}>
                                Калькулятор <br />расчёта комиссии
                            </span>

                            <div className={styles.card__calc_table}>
                                <div className={styles.card__calc__table__content}>
                                    <div className={styles.card__calc_column}>
                                        <span className={styles.card__calc_subtitle}>Депозит, ₽ (от 1 000 000)</span>
                                        <span>{formatMoney(deposit)}</span>
                                    </div>
                                    <div className={styles.card__calc_separator}></div>
                                    <div className={styles.card__calc_column}>
                                        <span className={styles.card__calc_subtitle}>Комиссия, ₽</span>
                                        <span>{formatMoney(Math.round(commission))}</span>
                                    </div>
                                </div>
                                <div>
                                    <Input
                                        type="swiper"
                                        name="deposit"
                                        min={MIN_DEPOSIT}
                                        max={MAX_DEPOSIT}
                                        step={STEP_DEPOSIT}
                                        theme='default'
                                        value={formatMoney(deposit)}
                                        onChange={(e) => {
                                            const parsed = parseMoney(e.target.value);
                                            setDeposit(parsed);
                                        }}
                                    />
                                </div>
                            </div>


                        </div>
                        <div className={styles.tariffs__choose}>

                            <Button
                                className={styles.tariffs__choose__button}
                                onClick={() => navigate(user ? '/lk' : '/auth')}
                            >
                                <h3 className={styles.tariffs__choose__button__text}>
                                    Выбрать тариф
                                </h3>
                                <div className={styles.tariffs__choose__button__icon}>
                                    <Icon Svg={ArrowIcon} width={16} height={16} />
                                </div>
                            </Button>
                            <span className={styles.tariffs__choose__text}>
                                После регистрации и выбора тарифа Вы попадёте на страницу регистрации для подбора риск-профиля, в соответствии с которым будет проходить управление Вашими активами.
                            </span>
                        </div>
                    </div>

                    <div className={styles.tariffs__rules}>
                        <span className={styles.tariffs__rules__title}>Правила возврата товаров на нашем сайте</span>
                        <p>
                            1. По закону&nbsp;
                            <a style={{ color: '#0666EB' }} href="https://www.consultant.ru/document/cons_doc_LAW_305/758e2cfdf136a621c8f66dcb3372b772c7b5e6e8/" target="_blank">«О защите прав потребителей»</a> вы можете расторгнуть
                            договор об оказании услуги в любое время. Уже оказанные услуги нужно
                            оплатить.
                        </p>
                        <p>2. Если не нравится качество обслуживания, мы бесплатно исправим недостатки.</p>
                        <p>3. О недостатках оказанной услуги можно сообщить в течение срока договора.</p>
                    </div>
                </div>
                <div className={styles.certificates}>
                    <h2 className={styles.certificates__title}>Сертификаты и лицензии</h2>
                    <span className={styles.certificates__description}>Система RANKS обладает уникальными запатентованными технологиямии имеет все необходимые лицензии для ведения профессиональной деятельности.</span>
                    <div className={styles.certificates__grid}>
                        <img src={Certificate1} alt="" />
                        <img src={Certificate10} alt="" />
                        <img src={Certificate11} alt="" />
                        <img src={Certificate2} alt="" />
                        <img src={Certificate3} alt="" />
                        <img src={Certificate4} alt="" />
                        <img src={Certificate5} alt="" />
                        <img src={Certificate6} alt="" />
                        <img src={Certificate7} alt="" />
                        <img src={Certificate8} alt="" />
                        <img src={Certificate9} alt="" />

                    </div>
                </div>

                {/* правила возврата */}

            </div>
        </div >
    );
};

export default TariffsPage;
