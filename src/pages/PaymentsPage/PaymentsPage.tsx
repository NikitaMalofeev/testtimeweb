// DocumentsPage.tsx

import React, { useState, useEffect } from "react";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { SupportChat } from "features/SupportChat/SupportChat";
import { getAllTariffsThunk } from "entities/Payments/slice/paymentsSlice";


const PaymentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(getAllTariffsThunk())
    }, [])

    // return loading ? (
    //     <Loader />
    // ) : (
    //     <div className={styles.page}>
    //     </div>
    // );
    return (
        <div className={styles.page}>

        </div>
    );
};

export default PaymentsPage;
