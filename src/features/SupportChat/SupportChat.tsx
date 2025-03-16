import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import ArrowBack from 'shared/assets/svg/ArrowBack.svg'
import { useNavigate } from 'react-router-dom';
import ChatImportIcon from 'shared/assets/svg/ChatImportIcon.svg'
import ChatSendIcon from 'shared/assets/svg/ChatSendIcon.svg'
import { Input } from 'shared/ui/Input/Input';

export const UserMessage = () => {
    return (
        <div className={styles.message_user}>
            <span className={styles.message__date}>02.08.2025</span>
            <p className={styles.message__message_user}>Привет. У меня вопрос. Лишь базовые сценарии поведения пользователей?</p>
        </div>
    );
};

export const SupportMessage = () => {
    return (
        <div className={styles.message_support}>
            <span className={styles.message__date}>02.08.2025</span>
            <p className={styles.message__message_support}>Современная методология разработки первоочередных требований</p>
        </div>
    );
};


export const SupportChat = () => {
    const navigate = useNavigate()


    return (
        <div className={styles.chat}>
            <div className={styles.chat__header}>
                <div className={styles.chat__header__content}><Icon Svg={ArrowBack} width={24} height={24} onClick={() => navigate(-1)} /><h2 className={styles.chat__header__title}>Чат поддержки</h2></div>
                <div className={styles.chat__header__status}>онлайн</div>
                <div className={styles.chat__header__description}>
                    <span>Вы общаетесь с Дмитрием из службы поддержки RANKS autopilot, пожалуйста, опишите вашу проблему</span>
                </div>
            </div>
            <div className={styles.chat__chat__container} >
                <div className={styles.chat__chat} style={{ paddingBottom: '16px' }}>
                    <UserMessage />
                    <SupportMessage />
                </div>
                <div className={styles.chat__input}>
                    <Icon Svg={ChatImportIcon} width={24} height={24} />
                    <Input value='' placeholder='Написать сообщение...' onChange={() => { }} />
                    <Icon Svg={ChatSendIcon} width={24} height={24} />
                </div>
            </div>
        </div>
    );
};