// Accordion.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ExpandIcon from 'shared/assets/svg/expandIcon.svg';
import { Icon } from '../Icon/Icon';
import styles from './styles.module.scss';

export interface AccordionItem {
    id: string;
    title: string;
    content: React.ReactNode; // Можно передавать как строку, так и JSX
}

export interface AccordionProps {
    items: AccordionItem[];
    /** Разрешает открывать несколько секций одновременно. По умолчанию false. */
    allowMultipleOpen?: boolean;
    /** Начальные (принудительно открытые) элементы */
    defaultOpenItems?: string[];
}

const Accordion: React.FC<AccordionProps> = ({ items, allowMultipleOpen = false, defaultOpenItems = [] }) => {
    // Изначально открыты элементы переданные через defaultOpenItems
    const [openItems, setOpenItems] = useState<string[]>(defaultOpenItems);

    // При изменении пропа defaultOpenItems обновляем состояние открытых элементов
    useEffect(() => {
        setOpenItems(defaultOpenItems);
    }, [defaultOpenItems]);

    const toggleItem = (id: string) => {
        if (openItems.includes(id)) {
            setOpenItems(openItems.filter(itemId => itemId !== id));
        } else {
            // Если multiple не допускается, закрываем остальные
            setOpenItems(allowMultipleOpen ? [...openItems, id] : [id]);
        }
    };

    // Варианты анимации для открытого/закрытого состояния.
    // height: 'auto' позволяет не ограничивать высоту контента.
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
                                key="content"
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
