import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styles from './styles.module.scss'
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setError } from "entities/Error/slice/errorSlice";
import { Button, ButtonTheme } from "../Button/Button";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../Icon/Icon";
import CloseIcon from "shared/assets/svg/close.svg";
import { closeAllModals, openModal } from "entities/ui/Modal/slice/modalSlice";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";



export const ErrorPopup = () => {
    const [visible, setVisible] = useState(false);
    const { error, purpose } = useSelector((state: RootState) => state.error)
    const successPopupIsOpen = useSelector((state: RootState) => state.ui.isTooltipActive.active)
    const dispatch = useAppDispatch()
    const navigate = useNavigate();
    const location = useLocation()

    useEffect(() => {
        if (error || purpose) {
            setVisible(true);

            const hideTimer = setTimeout(() => setVisible(false), 10000);
            const clearErrorTimer = setTimeout(() => {
                dispatch(setError('', ''))
            }, 10500);

            return () => {
                clearTimeout(hideTimer);
                clearTimeout(clearErrorTimer);
            };
        }

        if (successPopupIsOpen) {
            setVisible(false);
        }
    }, [error]);

    const handleClose = () => {
        setVisible(false)
    }



    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={visible ? { y: 24, opacity: 1 } : { y: -124, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.errorModal}
        >
            <div className={styles.errorModal__content}>
                <Icon Svg={CloseIcon} width={20} height={20} className={styles.closeIcon} onClick={handleClose} pointer/>
                {error}
                {purpose === 'pasportScan' && (
                    <div className={styles.purpose}>
                        <span>Ошибка загрузки сканов, пожалуйста повторите попытку загрузки</span>
                        <Button theme={ButtonTheme.UNDERLINE} children='Перейти' padding='7px 14px' onClick={() => {
                            dispatch(setStepAdditionalMenuUI(2))
                            dispatch(
                                openModal({
                                    type: ModalType.IDENTIFICATION,
                                    size: ModalSize.FULL,
                                    animation: ModalAnimation.LEFT,
                                })
                            );
                        }} className={styles.button__purpose} />
                    </div>
                )}

                {location.pathname !== '/' && (
                    <>
                        <span className={styles.errorModal__sub}>Возникли проблемы? Обратитесь в чат поддержки</span>

                        <Button theme={ButtonTheme.UNDERLINE} children='Перейти в чат' padding='7px 14px' onClick={() => {
                            navigate('/support')
                            dispatch(closeAllModals())
                        }} className={styles.button} />
                    </>
                )}

            </div>
        </motion.div>
    );
}
