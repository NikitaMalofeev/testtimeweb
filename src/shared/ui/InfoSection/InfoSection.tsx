import styles from './styles.module.scss'

export interface InfoRow {
    id: string;
    caption: string;
    value?: React.ReactNode;
    link?: string;
    links?: { label: string; url: string }[];
    subCaption?: string;
}

export const InfoSection: React.FC<{ rows: InfoRow[] }> = ({ rows }) => (
    <div className={styles.section}>
        {rows.map(r => (
            <div key={r.id} className={styles.row}>
                {r.caption && <p className={styles.caption}>{r.caption}</p>}

                {r.link && (
                    <a
                        className={styles.value}
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {r.value ?? r.link}
                    </a>
                )}

                {r.links && (
                    <div className={styles.links}>
                        {r.links.map(l => (
                            <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                                {l.label}
                            </a>
                        ))}
                    </div>
                )}

                {!r.link && !r.links && (
                    <p className={styles.value}>{r.value}</p>
                )}

                {r.subCaption && (
                    <p className={styles.sub}>{r.subCaption}</p>
                )}
            </div>
        ))}
    </div>
);