import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getAllCountryCodesThunk, clearCountryCodes, setCountryCodes, setCountryCodesLoading } from 'entities/User/slice/userSlice';
import { usePhoneFormat } from 'shared/hooks/usePhoneFormat';
import { Input } from 'shared/ui/Input/Input';
import { CountryCode } from 'entities/User/types/userTypes';
import styles from './PhoneInput.module.scss';
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { Icon } from "shared/ui/Icon/Icon";
import SearchIcon from "shared/assets/svg/searchIcon.svg";

interface PhoneInputProps {
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    placeholder?: string;
    onFocus?: () => void;
    withoutCloudyLabel?: boolean;
    needValue?: boolean;
    error?: string | false;
    disabled?: boolean;
    inputMode?: "numeric" | "tel";
    type?: string;
    maxLength?: number;
    className?: string;
    autoInitializeWithCountryCode?: boolean; // Новый проп для контроля автоинициализации
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    name,
    value,
    onChange,
    onBlur,
    placeholder,
    onFocus,
    withoutCloudyLabel,
    needValue,
    error,
    disabled,
    inputMode = "tel",
    type = "text",
    className,
    autoInitializeWithCountryCode = true, // По умолчанию включена автоинициализация
    ...props
}) => {
    const dispatch = useAppDispatch();
    const { countryCodes, countryCodesLoading } = useSelector((state: RootState) => state.user);

    console.log("PhoneInput render - countryCodes:", countryCodes);
    console.log("PhoneInput render - countryCodesLoading:", countryCodesLoading);
    console.log("PhoneInput render - countryCodes length:", countryCodes?.length);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+7');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const { handlePhoneChange, getPhoneValidationRegex } = usePhoneFormat();

    // Получаем значение без кода страны
    const getPhoneWithoutCountryCode = (phoneValue: string, countryCode: string) => {
        if (phoneValue.startsWith(countryCode)) {
            return phoneValue.slice(countryCode.length).trim();
        }
        return phoneValue;
    };

    // Добавляем код страны к номеру
    const addCountryCodeToPhone = (phoneNumber: string, countryCode: string) => {
        if (!phoneNumber) return countryCode;
        if (phoneNumber.startsWith(countryCode)) return phoneNumber;
        return `${countryCode} ${phoneNumber}`;
    };

    // Загружаем коды стран при монтировании компонента
    useEffect(() => {
        console.log("useEffect trigger - countryCodes:", countryCodes);
        if (!Array.isArray(countryCodes) || countryCodes.length === 0) {
            console.log("Dispatching getAllCountryCodesThunk...");
            dispatch(getAllCountryCodesThunk());
        }
    }, []);

    // Инициализируем значение с кодом страны, если поле пустое (только если включена автоинициализация)
    useEffect(() => {
        if (autoInitializeWithCountryCode && (!value || value.trim() === '')) {
            onChange(selectedCountryCode);
        }
    }, [selectedCountryCode, autoInitializeWithCountryCode]);

    // Очищаем данные при размонтировании
    useEffect(() => {
        return () => {
            dispatch(clearCountryCodes());
        };
    }, [dispatch]);


    // Обработчик изменения кода страны
    const handleCountryCodeChange = (code: string) => {
        setSelectedCountryCode(code);
        setIsDropdownOpen(false);
        setSearchQuery(''); // Очищаем поиск при выборе страны
        
        if (autoInitializeWithCountryCode || value.trim() !== '') {
            // Сохраняем существующий номер без кода и добавляем новый код
            const phoneWithoutCode = getPhoneWithoutCountryCode(value, selectedCountryCode);
            const newPhoneValue = addCountryCodeToPhone(phoneWithoutCode, code);
            onChange(newPhoneValue);
        }
        // Если автоинициализация отключена и поле пустое, не добавляем код
    };

    // Обработчик переключения выпадающего списка
    const handleDropdownToggle = () => {
        if (isDropdownOpen) {
            setSearchQuery(''); // Очищаем поиск при закрытии
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Обработчик изменения номера телефона с автоподстановкой кода
    const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const inputValue = e.target.value;
        
        // Разрешаем только цифры, плюс и пробелы
        const cleanValue = inputValue.replace(/[^\d+ ]/g, "");
        
        if (autoInitializeWithCountryCode) {
            // Режим с автоинициализацией - защищаем код страны
            if (!cleanValue.startsWith(selectedCountryCode)) {
                // Если код страны удален, восстанавливаем его
                const phoneWithoutCode = cleanValue.replace(/^\+?\d+\s?/, ''); // удаляем любой оставшийся код
                const finalValue = addCountryCodeToPhone(phoneWithoutCode, selectedCountryCode);
                onChange(finalValue);
            } else {
                // Код страны на месте, просто обновляем значение
                onChange(cleanValue);
            }
        } else {
            // Режим без автоинициализации - разрешаем любое значение
            // Если пользователь начинает вводить с цифры, автоматически добавляем код
            if (cleanValue.length > 0 && !cleanValue.startsWith('+')) {
                const finalValue = addCountryCodeToPhone(cleanValue, selectedCountryCode);
                onChange(finalValue);
            } else {
                onChange(cleanValue);
            }
        }
    };

    // Фильтрация стран по поисковому запросу
    const filteredCountries = Array.isArray(countryCodes)
        ? countryCodes.filter(country =>
            country.code.includes(searchQuery) ||
            country.code_iso.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    // Найти выбранную страну для отображения флага
    const selectedCountry = Array.isArray(countryCodes)
        ? countryCodes.find(country => country.code === selectedCountryCode)
        : null;

    return (
        <div className={`${styles.phoneInput} ${className || ''}`}>
            <div className={styles.phoneInput__container}>
                {/* Селектор кода страны */}
                <div className={styles.phoneInput__countrySelector}>
                    <button
                        type="button"
                        className={styles.phoneInput__countrySelectorButton}
                        onClick={handleDropdownToggle}
                        disabled={disabled || countryCodesLoading}
                    >

                        <span className={styles.phoneInput__countryCode}>
                            {selectedCountryCode}
                        </span>
                        <span className={styles.phoneInput__arrow}>▼</span>
                    </button>

                    {/* Выпадающий список */}
                    {isDropdownOpen && (
                        <div className={styles.phoneInput__dropdown}>
                            {/* Поле поиска */}
                            <div className={styles.phoneInput__searchContainer}>
                                <div className={styles.phoneInput__searchInputWrapper}>
                                    <Icon 
                                        Svg={SearchIcon} 
                                        className={styles.phoneInput__searchIcon}
                                        width={16}
                                        height={16}
                                    />
                                    <input
                                        type="text"
                                        className={styles.phoneInput__search}
                                        placeholder=""
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>

                            {countryCodesLoading ? (
                                <div className={styles.phoneInput__loading}><Loader /></div>
                            ) : filteredCountries.length === 0 ? (
                                <div className={styles.phoneInput__loading}>Ничего не найдено</div>
                            ) : (
                                filteredCountries.map((country: CountryCode) => (
                                    <button
                                        key={country.code_iso}
                                        type="button"
                                        className={`${styles.phoneInput__dropdownItem} ${country.code === selectedCountryCode
                                            ? styles.phoneInput__dropdownItem_selected
                                            : ''
                                            }`}
                                        onClick={() => handleCountryCodeChange(country.code)}
                                    >
                                        <span className={styles.phoneInput__countryCode}>
                                            {country.code}
                                        </span>
                                        <span className={styles.phoneInput__countryName}>
                                            {country.code_iso}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Поле ввода номера */}
                <div className={styles.phoneInput__inputContainer}>
                    <Input
                        name={name}
                        value={value}
                        onChange={handlePhoneInputChange}

                        placeholder="Номер телефона"
                        onFocus={onFocus}
                        withoutCloudyLabel={withoutCloudyLabel}
                        needValue={needValue}
                        error={error}
                        disabled={disabled}
                        inputMode={inputMode}

                        {...props}
                    />
                </div>
            </div>
        </div>
    );
};