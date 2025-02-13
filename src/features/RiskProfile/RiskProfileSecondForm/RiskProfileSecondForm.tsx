import React from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { nextStep, prevStep } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";

export interface RiskProfileSecondFormProps {

}

interface RiskProfileSecondFormData {
    amount_expected_replenishment: number,
    portfolio_parameters: string,
}

export const RiskProfileSecondForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    const goNext = () => {
        dispatch(nextStep())
    }

    const goBack = () => {
        dispatch(prevStep())
    }

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            amount_expected_replenishment: 0,
            portfolio_parameters: "",
        },
        onSubmit: async (values) => {
            alert("Данные отправлены");
        },
    });

    return (
        <div className={styles.form}>
            <form onSubmit={formik.handleSubmit} className={styles.form__form}>
                <div className={styles.form__container}>
                    <div>
                        <span className={styles.balans}>Баланс портфеля</span> <Tooltip positionBox={{ top: '8px', left: '34px' }} squerePosition={{ top: '15px', left: '-5px' }} topForCenteringIcons='8px' description='Средства на счете' />
                    </div>
                    <span>0 ₽</span>
                </div>

                <div
                    className={`${styles.buttons} ${isBottom ? "" : styles.shadow
                        }`}
                >
                    <Button
                        type="button"
                        theme={ButtonTheme.EMPTYBLUE}
                        onClick={goBack}
                        className={styles.button_back}
                    >
                        Вернуться
                    </Button>

                    <Button
                        type="button"
                        theme={ButtonTheme.BLUE}
                        onClick={goNext}
                        className={styles.button}
                        disabled={false}
                    >
                        Продолжить
                    </Button>
                </div>
            </form>
        </div>
    );
};
