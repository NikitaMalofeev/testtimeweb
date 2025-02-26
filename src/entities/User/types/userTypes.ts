export interface userType {
    phone: string;
    email: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    is_agreement: boolean;
}

export interface userAllData {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    gender?: string;
}

export type RiskProfilingRecommendedProfiles = {
    risk_prof_balanced: string;
    risk_prof_conservative: string;
    [key: string]: string;
};

export type AllUserInfo = {
    address_residential_apartment: string;
    address_residential_city: string;
    address_residential_house: string;
    address_residential_region: string;
    address_residential_street: string;
    age_parameters: string;
    apartment: string;
    birth_date: string;
    citizenship: string;
    city: string;
    currency_investment: string;
    current_loans: string;
    education: string;
    first_name: string;
    gender: string;
    house: string;
    income_investments_intended: string;
    invest_target: string;
    investment_experience: string;
    investment_period: string;
    is_live_this_address: boolean;
    is_qualified_investor_status: boolean;
    is_receive_mail_this_address: boolean;
    last_name: string;
    monthly_expense: string;
    monthly_income: string;
    obligations_invest_horizon: string;
    patronymic: string;
    phone: string;
    planned_future_income: string;
    practical_investment_experience: string;
    profit_expect: string;
    question_assets_losing_value: string;
    region: string;
    residence_permit: string | null;
    risk_more_amount_expected_replenishment: string;
    risk_more_portfolio_balance: number;
    risk_more_portfolio_parameters: string;
    risk_more_possible_loss: number;
    risk_more_potential_income: number;
    risk_more_potential_income_percent: string;
    risk_more_possible_loss_percent: string;
    risk_profiling_recommended_profiles: RiskProfilingRecommendedProfiles;
    risk_profiling_summ: number;
    risk_profiling_text: string;
    savings_level: string;
    street: string;
    trusted_person_fio: string;
    trusted_person_other_contact: string;
    trusted_person_phone: string;
};
