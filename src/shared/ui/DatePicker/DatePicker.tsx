import React, { memo, useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, getYear, getMonth, parse, isValid, subYears, startOfToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import ArrowRight from 'shared/assets/svg/CalendarArrowRight.svg';
import ArrowLeft from 'shared/assets/svg/CalendarArrowLeft.svg';
import { Icon } from '../Icon/Icon';
import { Button, ButtonTheme } from '../Button/Button';
import ErrorIcon from "shared/assets/svg/errorCircle.svg";
import 'react-datepicker/dist/react-datepicker.css';
import '../../../app/styles/index.scss'
import cls from './styles.module.scss';

interface DatepickerProps {
    className?: string;
    value?: Date | null;               // Можем сделать необязательным
    onChange: (date: Date | null) => void;
    placeholder?: string;
    maxDate?: Date;
    minDate?: Date;
    needValue?: boolean;
    error?: string | boolean;
    majority?: boolean;
}

export const Datepicker = memo((props: DatepickerProps) => {
    const {
        value = null,
        onChange,
        placeholder = 'Выберите дату',
        maxDate,
        minDate,
        needValue,
        error,
        majority,
    } = props;

    // Локальный стейт для выбранной даты и видимости календаря
    const [selectedDate, setSelectedDate] = useState<Date | null>(value);
    const [isOpen, setIsOpen] = useState(false);

    const eighteenYearsAgo = subYears(startOfToday(), 18);
    const computedMaxDate = majority ? eighteenYearsAgo : maxDate;

    // Текст, который отображается в самом инпуте внутри календаря
    const [inputValue, setInputValue] = useState(
        value ? format(value, 'yyyy.MM.dd') : '' // Можно поменять на 'yyyy.MM.dd', если нужно
    );

    const calendarRef = useRef<HTMLDivElement | null>(null);

    const handleCalendarChange = (date: Date | null) => {
        if (majority && date && date > eighteenYearsAgo) {
            return;
        }
        setSelectedDate(date);
        setInputValue(date ? format(date, 'yyyy.MM.dd') : '');
        onChange(date);
        setIsOpen(false);
    };

    // Клик вне календаря — закрывает календарь
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleBlur = () => {
        const parsedDate = parse(inputValue, 'yyyy.MM.dd', new Date());
        if (isValid(parsedDate) && (!majority || parsedDate <= eighteenYearsAgo)) {
            setSelectedDate(parsedDate);
            onChange(parsedDate);
        } else {
            setInputValue(selectedDate ? format(selectedDate, 'yyyy.MM.dd') : '');
        }
    };

    // Начальный текст на кнопке, если даты нет: «yyyy.MM.dd» (или любой другой)
    const buttonText = selectedDate
        ? format(selectedDate, 'yyyy.MM.dd') // формат для выбранной даты
        : ''; // если дата не выбрана

    return (
        <div className={cls.wrapper}>
            {/* Кнопка, открывающая календарь */}
            <div className={cls.datepickerInputWrapper}>
                {/* Сам label, который умеет "уползать" вверх при дате или фокусе */}
                <label
                    className={`${cls.label} ${(isOpen || selectedDate) ? cls.active : ''}`}
                >
                    {placeholder}  {needValue && !value && <span style={{ color: '#FF3C53', position: 'absolute', top: '0px', right: '-10px' }}>*</span>}
                </label>

                {/* Блок, который визуально выглядит как input, но по клику открывает календарь */}
                <div
                    onClick={() => setIsOpen(true)}
                    className={cls.button_date}
                >
                    {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : ''}

                </div>

                {error && (
                    <div className={cls.input__error}>
                        <Icon
                            Svg={ErrorIcon}
                            className={cls.input__error__icon}
                            width={16}
                            height={16}
                        />
                        <span>{error}</span>
                    </div>
                )}

            </div>

            {
                isOpen && (
                    <div className={cls.calendarWrapper} ref={calendarRef}>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleCalendarChange}
                            locale={ru}
                            inline
                            showWeekNumbers
                            minDate={minDate}
                            popperPlacement="bottom"
                            maxDate={computedMaxDate}
                            filterDate={(date) => !majority || date <= eighteenYearsAgo}
                            // Кастомный хедер
                            renderCustomHeader={({
                                date,
                                changeYear,
                                changeMonth,
                                decreaseMonth,
                                increaseMonth,
                                prevMonthButtonDisabled,
                                nextMonthButtonDisabled,
                            }) => {
                                const currentYear = getYear(date);
                                const lowerYear = 1900;
                                const upperYear = getYear(new Date());
                                const years = Array.from(
                                    { length: upperYear - lowerYear + 1 },
                                    (_, i) => lowerYear + i
                                );
                                const months = [
                                    'Январь',
                                    'Февраль',
                                    'Март',
                                    'Апрель',
                                    'Май',
                                    'Июнь',
                                    'Июль',
                                    'Август',
                                    'Сентябрь',
                                    'Октябрь',
                                    'Ноябрь',
                                    'Декабрь',
                                ];

                                return (
                                    <div className={cls.header}>
                                        {/* Блок года */}
                                        <div className={cls.header__year}>
                                            <button
                                                type="button"
                                                onClick={() => changeYear(currentYear - 1)}
                                                disabled={currentYear <= lowerYear}
                                                className={cls.button__arrow}
                                            >
                                                <Icon Svg={ArrowLeft} />
                                            </button>
                                            <select
                                                className={cls.select}
                                                value={currentYear}
                                                onChange={(e) =>
                                                    changeYear(parseInt(e.target.value, 10))
                                                }
                                            >
                                                {years.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => changeYear(currentYear + 1)}
                                                disabled={currentYear >= upperYear}
                                                className={cls.button__arrow}
                                            >
                                                <Icon Svg={ArrowRight} />
                                            </button>
                                        </div>

                                        {/* Блок месяца */}
                                        <div className={cls.header__month}>
                                            <button
                                                type="button"
                                                className={cls.button__arrow}
                                                onClick={decreaseMonth}
                                                disabled={prevMonthButtonDisabled}
                                            >
                                                <Icon Svg={ArrowLeft} />
                                            </button>
                                            <select
                                                className={cls.select}
                                                value={months[getMonth(date)]}
                                                onChange={(e) =>
                                                    changeMonth(
                                                        months.indexOf(e.target.value)
                                                    )
                                                }
                                            >
                                                {months.map((month) => (
                                                    <option key={month} value={month}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className={cls.button__arrow}
                                                onClick={increaseMonth}
                                                disabled={nextMonthButtonDisabled}
                                            >
                                                <Icon Svg={ArrowRight} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }}
                            // Кастомный контейнер календаря (с инпутом)
                            calendarContainer={({ children }) => (
                                <div className={cls.customCalendarContainer}>
                                    {/* <div className={cls.customInputs}>
                                    <input
                                        type="text"
                                        placeholder={placeholder}
                                        value={inputValue}
                                        className={cls.smallInput}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onBlur={handleBlur}
                                    />
                                </div> */}
                                    {children}
                                    {/* Убрали кнопку "Сохранить", теперь выбор даты автоматический */}
                                </div>
                            )}
                        />
                    </div>
                )
            }
        </div >
    );
});
