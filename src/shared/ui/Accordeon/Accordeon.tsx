// Accordion.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ExpandIcon from 'shared/assets/svg/expandIcon.svg';
import { Icon } from '../Icon/Icon';
import styles from './styles.module.scss';

export interface AccordionItem {
    id: string;
    title: React.ReactNode;
    content: React.ReactNode; // Можно передавать как строку, так и JSX
}

export interface AccordionProps {
    items: AccordionItem[];
    /** Разрешает открывать несколько секций одновременно. По умолчанию false. */
    allowMultipleOpen?: boolean;
    /** Начальные (принудительно открытые) элементы.
     * Если не передан, используется внутреннее состояние и toggleItem работает как обычно.
     * Если передан, при изменении значения родителя состояние синхронизируется с пропсом.
     */
    defaultOpenItems?: string[];
}

const Accordion: React.FC<AccordionProps> = ({ items, allowMultipleOpen = false, defaultOpenItems }) => {
    // Если defaultOpenItems передан, используем его, иначе пустой массив.
    const [openItems, setOpenItems] = useState<string[]>(defaultOpenItems ?? []);

    // Обновляем openItems, если defaultOpenItems передан и изменился.
    useEffect(() => {
        if (defaultOpenItems !== undefined) {
            setOpenItems(defaultOpenItems);
        }
    }, [defaultOpenItems]);

    const toggleItem = (id: string) => {
        if (openItems.includes(id)) {
            setOpenItems(openItems.filter(itemId => itemId !== id));
        } else {
            // Если множественное открытие не допускается, закрываем остальные
            setOpenItems(allowMultipleOpen ? [...openItems, id] : [id]);
        }
    };

    // Варианты анимации для открытого/закрытого состояния. 
    // Используем height: 'auto' для автоматического расчёта высоты содержимого.
    const variants = {
        collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
        expanded: { height: 'auto', opacity: 1, overflow: 'visible' },
    };

    return (
        <div className={styles.accordion}>
            {items.map(item => (
                <div key={item.id} className={styles.item}>
                    <button
                        onClick={() => toggleItem(item.id)}
                        className={styles.item__container}
                    >
                        <span className={styles.title}>{item.title}</span>
                        <motion.span
                            animate={{ rotate: openItems.includes(item.id) ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ marginLeft: 'auto', display: 'flex' }}
                        >
                            <Icon Svg={ExpandIcon} width={24} height={24} />
                        </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                        {openItems.includes(item.id) && (
                            <motion.div
                                key={`content-${item.id}`} // Уникальный ключ для каждой секции
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                                variants={variants}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <div className={styles.content}>
                                    {item.content}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
};

export default Accordion;
