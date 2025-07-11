// features/RiskProfile/ConfirmContactsModal/ConfirmContactsModal.tsx
import React, {
    memo,
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
} from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "../ConfirmDocsModal/styles.module.scss";      // те же стили
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import {
    closeModal,
    openModal,
    setModalScrolled,
} from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from
    "entities/ui/Modal/model/modalTypes";
import { selectModalState } from
    "entities/ui/Modal/selectors/selectorsModals";
import {
    resendConfirmationCode,
    sendPhoneConfirmationCode,
    sendEmailConfirmationCode,
} from "entities/RiskProfile/slice/riskProfileSlice";
import { Button, ButtonTheme } from "shared/ui/Button/Button";

const CODE_LEN = 4;

export const ConfirmContactsModal = memo(() => {
    const dispatch = useAppDispatch();

    /* ───────── Redux state ───────── */
    const { isOpen, size, animation } = useSelector(
        (s: RootState) => s.modal.confirmContacts
    );
    const { legalConfirmData, legalFormData } = useSelector(
        (s: RootState) => s.riskProfile
    );
    const userId = useSelector((s: RootState) => s.user.userId)

    const needPhone = legalConfirmData?.is_need_confirm_phone;
    const needEmail = legalConfirmData?.is_need_confirm_email;

    /* ───────── локальные коды ───────── */
    const [phoneCode, setPhoneCode] = useState<string[]>(Array(CODE_LEN).fill(""));
    const [emailCode, setEmailCode] = useState<string[]>(Array(CODE_LEN).fill(""));
    const phoneRefs = useRef<(HTMLInputElement | null)[]>([]);
    const emailRefs = useRef<(HTMLInputElement | null)[]>([]);

    /* ───────── таймеры повторной отправки ───────── */
    const [phoneLeft, setPhoneLeft] = useState(60);
    const [emailLeft, setEmailLeft] = useState(60);
    const [phoneTimer, setPhoneTimer] = useState(false);
    const [emailTimer, setEmailTimer] = useState(false);

    /* ───────── при открытии модалки ───────── */
    useEffect(() => {
        if (!isOpen) return;

        // if (needPhone) {
        //     dispatch(
        //         resendConfirmationCode({
        //             user_id: localStorage.getItem("user_id")!,
        //             method: "phone",
        //         })
        //     );
        //     setPhoneLeft(60);
        //     setPhoneTimer(true);
        // }

        // if (needEmail) {
        //     dispatch(
        //         resendConfirmationCode({
        //             user_id: localStorage.getItem("user_id")!,
        //             method: "email",
        //         })
        //     );
        //     setEmailLeft(60);
        //     setEmailTimer(true);
        // }

        // сбрасываем предыдущие коды
        setPhoneCode(Array(CODE_LEN).fill(""));
        setEmailCode(Array(CODE_LEN).fill(""));
    }, [isOpen]);

    /* ───────── tick таймеров ───────── */
    useEffect(() => {
        const id = setInterval(() => {
            setPhoneLeft((prev) => (phoneTimer && prev > 0 ? prev - 1 : prev));
            setEmailLeft((prev) => (emailTimer && prev > 0 ? prev - 1 : prev));
        }, 1000);
        return () => clearInterval(id);
    }, [phoneTimer, emailTimer]);

    /* ───────── scroll-shadow ───────── */
    const contentRef = useRef<HTMLDivElement>(null);
    const isScrolled = useSelector((st: RootState) =>
        selectModalState(st, ModalType.CONFIRM_CONTACTS)?.isScrolled
    );
    useLayoutEffect(() => {
        const handler = () => {
            if (contentRef.current) {
                dispatch(
                    setModalScrolled({
                        type: ModalType.CONFIRM_CONTACTS,
                        isScrolled: contentRef.current.scrollTop > 0,
                    })
                );
            }
        };
        const el = contentRef.current;
        el?.addEventListener("scroll", handler);
        handler();
        return () => el?.removeEventListener("scroll", handler);
    }, []);

    /* ───────── helpers для ввода ───────── */
    const updateDigit = (
        arrSetter: React.Dispatch<React.SetStateAction<string[]>>,
        idx: number,
        value: string,
        refs: typeof phoneRefs
    ) => {
        const v = value.replace(/\D/g, "").slice(0, 1);
        arrSetter((prev) => {
            const next = [...prev];
            next[idx] = v;
            return next;
        });
        if (v && idx < CODE_LEN - 1) refs.current[idx + 1]?.focus();
    };

    const handleBackspace =
        (
            arrGetter: () => string[],
            arrSetter: React.Dispatch<React.SetStateAction<string[]>>,
            idx: number,
            refs: typeof phoneRefs
        ) =>
            (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Backspace" && !arrGetter()[idx] && idx > 0) {
                    arrSetter((prev) => {
                        const next = [...prev];
                        next[idx - 1] = "";
                        return next;
                    });
                    refs.current[idx - 1]?.focus();
                }
            };

    /* ───────── авто-отправка кодов ───────── */
    const [sentPhone, setSentPhone] = useState(false);
    const [sentEmail, setSentEmail] = useState(false);

    /* phone */
    useEffect(() => {
        if (needPhone && phoneCode.join("").length === CODE_LEN && !sentPhone) {
            dispatch(sendPhoneConfirmationCode({
                user_id: userId || '',
                method: phoneCode ? 'phone' : 'email',
                codeFirst: phoneCode.join(""),
                purposeNewContacts: true,
                onSuccess: () => setSentPhone(true),
            }));
        }
    }, [needPhone, phoneCode, sentPhone]);

    /* email */
    useEffect(() => {
        if (!needEmail) return;
        const code = emailCode.join("");
        if (code.length === CODE_LEN && !sentEmail) {
            dispatch(
                sendEmailConfirmationCode({
                    user_id: localStorage.getItem("user_id")!,
                    codeSecond: code,
                    purposeNewContacts: true,
                    onSuccess: () => setSentEmail(true),
                })
            );
        }
    }, [emailCode, needEmail, sentEmail]);

    useEffect(() => {
        if (sentPhone && sentEmail) {
            dispatch(closeModal(ModalType.CONFIRM_CONTACTS));
            dispatch(
                openModal({
                    type: ModalType.CONFIRM_DOCS,
                    size: ModalSize.MIDDLE,
                    animation: ModalAnimation.LEFT,
                })
            );
        }
    }, [sentPhone, sentEmail]);

    /* ───────── рендер ───────── */
    const resendBtn = (
        timer: number,
        active: boolean,
        handler: () => void
    ) => (
        <div
            className={styles.modalContent__problems}
            onClick={() => {
                if (!active) handler();
            }}
        >
            <div className={styles.timer} style={!active ? { color: "#045FDD" } : {}}>
                {active
                    ? `Отправить код снова через: 0${Math.floor(timer / 60)}:${String(
                        timer % 60
                    ).padStart(2, "0")}`
                    : "Отправить код снова"}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => dispatch(closeModal(ModalType.CONFIRM_CONTACTS))}
            type={ModalType.CONFIRM_CONTACTS}
            size={size}
            animation={animation}
            withCloseIcon
            withTitle={<span>Подтверждение новых контактов</span>}
        >
            <div
                ref={contentRef}
                className={`${styles.modalContent} ${isScrolled && styles.modalContent__shadow_top
                    }`}
                style={{ overflow: "auto" }}
            >
                {needPhone && (
                    <div className={styles.modalContent__head}>
                        <span className={styles.modalContent__description}>
                            Код отправлен на&nbsp;<b>{legalFormData.phone}</b>
                        </span>

                        <div className={styles.codeInput__container}>
                            {phoneCode.map((d, i) => (
                                <input
                                    key={`p-${i}`}
                                    ref={(el) => (phoneRefs.current[i] = el)}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={d}
                                    className={styles.codeInput__box}
                                    onChange={(e) =>
                                        updateDigit(setPhoneCode, i, e.target.value, phoneRefs)
                                    }
                                    onKeyDown={handleBackspace(
                                        () => phoneCode,
                                        setPhoneCode,
                                        i,
                                        phoneRefs
                                    )}
                                />
                            ))}
                        </div>

                        {resendBtn(phoneLeft, phoneTimer, () => {
                            dispatch(
                                resendConfirmationCode({
                                    user_id: localStorage.getItem("user_id")!,
                                    method: "phone",
                                })
                            );
                            setPhoneLeft(60);
                            setPhoneTimer(true);
                        })}
                    </div>
                )}

                {needEmail && (
                    <div className={styles.modalContent__head}>
                        <span className={styles.modalContent__description}>
                            Код отправлен на&nbsp;<b>{legalFormData.email}</b>
                        </span>

                        <div className={styles.codeInput__container}>
                            {emailCode.map((d, i) => (
                                <input
                                    key={`e-${i}`}
                                    ref={(el) => (emailRefs.current[i] = el)}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={d}
                                    className={styles.codeInput__box}
                                    onChange={(e) =>
                                        updateDigit(setEmailCode, i, e.target.value, emailRefs)
                                    }
                                    onKeyDown={handleBackspace(
                                        () => emailCode,
                                        setEmailCode,
                                        i,
                                        emailRefs
                                    )}
                                />
                            ))}
                        </div>

                        {resendBtn(emailLeft, emailTimer, () => {
                            dispatch(
                                resendConfirmationCode({
                                    user_id: localStorage.getItem("user_id")!,
                                    method: "email",
                                })
                            );
                            setEmailLeft(60);
                            setEmailTimer(true);
                        })}
                    </div>
                )}

                {/* кнопка теперь не нужна, но оставим ссылку-заглушку для проблем */}
                <div className={styles.buttonGroup}>
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        disabled
                        style={{ opacity: 0 }}
                    >
                        &nbsp;
                    </Button>
                </div>
            </div>
        </Modal>
    );
});
