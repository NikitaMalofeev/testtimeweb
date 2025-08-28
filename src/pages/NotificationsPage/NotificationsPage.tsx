
import { Notifications } from 'features/Notifications/Notifications/Notifications';
import styles from './styles.module.scss';

const NotificationsPage = () => {
    return (
        <div className={styles.page}>
            <div className={styles.page__container}>
                <Notifications />
            </div>

        </div>
    );
};

export default NotificationsPage