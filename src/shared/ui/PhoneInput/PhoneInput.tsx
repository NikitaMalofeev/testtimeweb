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

    // Загружаем коды стран при монтировании компонента
    useEffect(() => {
        console.log("useEffect trigger - countryCodes:", countryCodes);
        if (!Array.isArray(countryCodes) || countryCodes.length === 0) {
            console.log("Dispatching getAllCountryCodesThunk...");
            dispatch(getAllCountryCodesThunk());
        }
    }, []);

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

        // Переформатируем текущий номер с новым кодом страны
        if (value) {
            const digitsOnly = value.replace(/\D/g, "");
            const newFormattedValue = code + digitsOnly.slice(digitsOnly.indexOf(selectedCountryCode.slice(1)) === 0 ? selectedCountryCode.slice(1).length : 0);
            onChange(newFormattedValue);
        }
    };

    // Обработчик переключения выпадающего списка
    const handleDropdownToggle = () => {
        if (isDropdownOpen) {
            setSearchQuery(''); // Очищаем поиск при закрытии
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Обработчик изменения номера телефона
    const handlePhoneInputChange = handlePhoneChange(onChange, selectedCountryCode);

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

                        placeholder={placeholder}
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