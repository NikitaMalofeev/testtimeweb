import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PersonalAccountItem } from "../types/personalAccountTypes";

interface PersonalAccountState {
    currentTab: string;
    menuItems: PersonalAccountItem[];
}

const initialState: PersonalAccountState = {
    currentTab: "",
    menuItems: []
};

export const personalAccountSlice = createSlice({
    name: "personalAccount",
    initialState,
    reducers: {
        setCurrentTab: (state, action: PayloadAction<string>) => {
            state.currentTab = action.payload;
        },
        setMenuItems: (state, action: PayloadAction<PersonalAccountItem[]>) => {
            state.menuItems = action.payload;
        },
    }
});

export const {
    setCurrentTab,
    setMenuItems
} = personalAccountSlice.actions;

export default personalAccountSlice.reducer;
