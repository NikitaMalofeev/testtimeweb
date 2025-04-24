import React, { useState, useEffect } from "react";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { SupportChat } from "features/SupportChat/SupportChat";
import { getAllTariffsThunk } from "entities/Payments/slice/paymentsSlice";
import { Icon } from "shared/ui/Icon/Icon";
import BackIcon from "shared/assets/svg/ArrowBack.svg";
import { PaymentsCardList } from "features/Payments/PaymentsCardList/PaymentsCardList";


const PaymentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // return loading ? (
    //     <Loader />
    // ) : (
    //     <div className={styles.page}>
    //     </div>
    // );
    return (
        <div className={styles.page}>
            <div className={styles.page__title}>
                <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate("/lk")} />
                <h2 className={styles.page__title}>Тарифы</h2>
            </div>
            <div>
                <PaymentsCardList />
            </div>

        </div>
    );
};

export default PaymentsPage;
