// RecomendationsRejectModal.tsx
import React, { useRef, RefObject, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'shared/ui/Icon/Icon';
import SupportIcon from 'shared/assets/svg/supportChatBlue.svg';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import styles from './styles.module.scss';
import { useScrollShadow } from 'shared/hooks/useScrollShadow';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { rejectIirDocumentThunk } from 'entities/Recomendations/slice/recomendationsSlice';


interface RecomendationsRejectModalProps {
    uuid: string;
    onCancel: () => void;
    onReject: (uuid: string) => void;
}

export const RecomendationsRejectModal: React.FC<RecomendationsRejectModalProps> = ({
    onReject,
    uuid,
    onCancel,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch()
    const { isScrolled, isBottom } = useScrollShadow(modalRef, true);


    const handleRejectRecomendation = () => {
        onReject(uuid);
    };

    return (
        <>
            <div
                ref={modalRef}
                className={
                    `${styles.modal}` +
                    (isScrolled ? ` ${styles.shadow_top}` : '') +
                    (!isBottom ? ` ${styles.shadow_bottom}` : '')
                }
            >
                <div className={styles.modal__container}>
                    <p className={styles.modal__description}>
                        Уважаемый клиент, благодарим вас за использование наших услуг. Обращаем ваше
                        внимание, что Индивидуальная Инвестиционная рекомендация (далее ИИР) составлена в
                        соответствии с вашим риск–профилем, и при отклонении ИИР вы принимаете на себя
                        все связанные с этим риски. Мы настоятельно рекомендуем тщательно оценить
                        возможные последствия данного решения и учитывать, что результаты могут
                        отличаться от ожидаемых.
                    </p>

                    <p className={styles.modal__question}>
                        Если у вас возникнут дополнительные вопросы или потребуется консультация,
                        пожалуйста, обращайтесь в наш чат поддержки.
                    </p>

                    <button
                        className={styles.modal__support}
                        onClick={() => navigate('/support')}
                        type="button"
                    >
                        <Icon Svg={SupportIcon} width={28} height={28} />
                        <span>Перейти в чат поддержки</span>
                    </button>

                    <div className={styles.modal__line} />

                    <p className={styles.modal__confirm}>
                        Для отклонения «Индивидуальной инвестиционной рекомендации (ИИР) #13» будет
                        необходимо подтверждение через СМС.
                    </p>
                </div>
            </div>

            <div className={styles.actions}>
                <Button
                    theme={ButtonTheme.UNDERLINE}
                    type="button"
                    onClick={onCancel}
                    className={styles.button}
                    padding="19px 23px"
                >
                    Отмена
                </Button>
                <Button
                    theme={ButtonTheme.BLUE}
                    type="button"
                    onClick={handleRejectRecomendation}
                    className={styles.button}
                    padding="19px 23px"
                >
                    Подтвердить
                </Button>
            </div>
        </>
    );
};