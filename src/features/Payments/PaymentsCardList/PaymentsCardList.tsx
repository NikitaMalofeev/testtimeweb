import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { getAllTariffsThunk } from 'entities/Payments/slice/paymentsSlice';
import styles from './styles.module.scss';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Loader } from 'shared/ui/Loader/Loader';
import PaymentsBase from 'shared/assets/images/paymentsBase.png';
import PaymentsActive from 'shared/assets/images/paymentsActive.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import { PaymentsCard } from '../PaymentsCard/PaymentsCard';

export const PaymentsCardList: React.FC = () => {
    const dispatch = useAppDispatch();
    const tariffs = useSelector((state: RootState) => state.payments.tariffs);
    const isFetching = useSelector((state: RootState) => state.payments.isFetchingTariffs);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(getAllTariffsThunk());
    }, [dispatch]);

    if (isFetching) return <Loader />;

    // Если выбрана карточка, показываем только её
    const displayedTariffs = selectedId
        ? tariffs.filter(t => t.id === selectedId)
        : tariffs;

    return (
        <div className={styles.list}>
            <AnimatePresence mode="popLayout">
                {displayedTariffs.map((t, index) => (
                    <motion.div
                        key={t.id}
                        layout="position"          // можно явно указать, но и просто layout достаточно
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PaymentsCard
                            index={index}
                            isSelected={t.id === selectedId}
                            status={t.is_active ? 'Active' : 'Inactive'}
                            title={t.title}
                            titleDesc={t.description}
                            descriptionDetail={'Длинное описание деталей Длинное описание деталей Длинное описание деталей Длинное описание деталей'}
                            upfront={t.commission_deposit != null ? `${t.commission_deposit}%` : ''}
                            fee={t.commission_asset != null ? `${t.commission_asset}%` : ''}
                            capital={`${t.days_service_validity} days`}
                            imageUrl={t.title === 'Долгосрочный инвестор' ? PaymentsBase : PaymentsActive}
                            onMore={() => setSelectedId(t.id)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>


            {/* Блок с кнопками при выборе */}
            <AnimatePresence>
                {selectedId && (
                    <motion.div
                        className={styles.detailed__actions}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 300 }}
                    >
                        <Button theme={ButtonTheme.UNDERLINE} padding='10px 25px' onClick={() => setSelectedId('')}>Вернуться к выбору тарифов</Button>
                        <Button theme={ButtonTheme.BLUE} padding='10px 25px'>Подключить</Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};