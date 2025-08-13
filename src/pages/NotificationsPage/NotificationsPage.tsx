
import { Notifications } from 'features/Notifications/Notifications/Notifications';
import styles from './styles.module.scss';

const NotificationsPage = () => {
    return (
        <div className={styles.page}>
            <Notifications />
        </div>
    );
};

export default NotificationsPage