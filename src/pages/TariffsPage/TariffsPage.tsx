// TariffsPage.tsx

import React, { useState } from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import BaseTariffIcon from "shared/assets/images/paymentsBase.png";
import { Input } from "shared/ui/Input/Input";

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

    /** 0.5 % от прибыли в 20 % от суммы = 0.1 % от депозита */
    const commission = deposit * 0.02;

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>Тарифы</h2>

            {/* блок карточек */}
            <div className={styles.page__container_row}>
                {/* описание тарифа */}
                <div className={styles.card} style={{ gap: '16px' }}>
                    <div className={styles.card__content}>
                        <div className={styles.card__title}>
                            <span className={styles.card__title__subtitle}>
                                для начинающих инвесторов
                            </span>
                            <span className={styles.card__title__title}>Базовый тариф</span>
                        </div>
                        <Icon Svg={BaseTariffIcon} width={65} height={47} />
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
                    </div>
                </div>

                {/* калькулятор */}
                <div className={styles.card} style={{ gap: '24px' }}>
                    <span className={styles.card__calc_title}>
                        Калькулятор расчёта комиссии
                    </span>

                    <div className={styles.card__calc_table}>
                        <div className={styles.card__calc_column}>
                            <span className={styles.card__calc_subtitle}>Депозит, ₽ <br /> (от 1 000 000)</span>
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

            {/* правила возврата */}
            <div className={styles.page__container_column}>
                <span>Правила возврата товаров на нашем сайте</span>
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
    );
};

export default TariffsPage;
