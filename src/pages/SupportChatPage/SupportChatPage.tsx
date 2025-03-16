// DocumentsPage.tsx

import React, { useState, useEffect } from "react";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { SupportChat } from "features/SupportChat/SupportChat";


const SupportChatPage: React.FC = () => {
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
            <SupportChat />
        </div>
    );
};

export default SupportChatPage;
