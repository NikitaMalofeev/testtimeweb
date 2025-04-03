import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import NotFoundPageIcon from 'shared/assets/svg/NotFoundPage.svg'
import { Button, ButtonTheme } from 'shared/ui/Button/Button';


export const NotFoundPage = () => {
    return (
        <div className={styles.page}>
            <div className={styles.page__container}>
                <div className={styles.page__message}>
                    <Icon width={40} height={40} Svg={NotFoundPageIcon} className={styles.page__icon} />
                    <h1 className={styles.page__title}>Ошибка 404</h1>
                    <p className={styles.page__description}>
                        Такая страница не найдена
                    </p>

                </div>
                <Button
                    theme={ButtonTheme.UNDERLINE}
                    onClick={() => {
                        window.location.href = "/lk";
                    }}
                    padding="19px 26px"
                    children="Перейти в личный кабинет"
                />
            </div>
        </div>
    );
};