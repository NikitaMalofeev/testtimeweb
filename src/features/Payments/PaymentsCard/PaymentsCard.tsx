import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import styles from './styles.module.scss';

export interface PaymentsCardProps {
    title: string;
    titleDesc: string;
    upfront: string;
    fee: string;
    capital: string;
    status: string;
    imageUrl: string;
}

export const PaymentsCard = ({ ...props }: PaymentsCardProps) => {

    const { title, titleDesc, upfront, fee, capital, status, imageUrl } = props

    return (
        <div className={styles.card}>
            <div>
                <div>
                    <div>
                        <span>{titleDesc}</span>
                        <span>{title}</span>
                    </div>
                    <div>
                        <span> <span>{upfront}</span></span>
                        <span> <span>{fee}</span></span>
                        <span> <span>{capital}</span></span>
                    </div>
                </div>
                <div>
                    <div>{status}</div>
                    <img src={imageUrl} alt="" />
                </div>
            </div>
            <Button theme={ButtonTheme.UNDERLINE} children='Подробнее о тарифе' />
        </div>
    );
};