import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { setError } from 'entities/Error/slice/errorSlice';
import {
    getUserIirs,
    getUserNotSignedIirHtml,
    rejectIirDocument,
    getSignedIirDocument,
} from 'entities/Recomendations/api/recomendationsApi';
import {
    GetIirsUserResponse,
    GetIirHtmlPayload,
    RejectIirPayload,
    GetSignedIirPayload,
    IirItem,
    GetIirHtmlResponse,
} from '../model/recomendationsTypes';
import {
    setCurrentSignedDocuments,
    setNotSignedDocumentsHtmls,
} from 'entities/Documents/slice/documentsSlice';
import { RootState } from 'app/providers/store/config/store';

/* ------------------------------------------------------------------ */
/* STATE */
/* ------------------------------------------------------------------ */

interface IirState {
    list: IirItem[];
    notSignedHtmls: Record<string, string>;
    signedDocs: Record<string, Uint8Array>;
    currentUuid: string;
    loading: boolean;
    error: string | null;
}

const initialState: IirState = {
    list: [],
    notSignedHtmls: {},
    signedDocs: {},
    currentUuid: '',
    loading: false,
    error: null,
};

/* ------------------------------------------------------------------ */
/* THUNKS */
/* ------------------------------------------------------------------ */

// 1. Получить список IIR
export const getUserIirsThunk = createAsyncThunk<
    GetIirsUserResponse,
    { onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>('iir/getUserIirsThunk', async ({ onSuccess }, { getState, dispatch, rejectWithValue }) => {
    try {
        const token = getState().user.token;
        const data = await getUserIirs(token);
        onSuccess?.();
        return data;
    } catch (err: any) {
        const msg = err.response?.data?.errorText || err.message;
        dispatch(setError(msg));
        return rejectWithValue(msg);
    }
});

// 2. Получить HTML неподписанного IIR
export const getUserNotSignedIirHtmlThunk = createAsyncThunk<
    { uuid: string; not_signed_document_html: string },
    GetIirHtmlPayload,
    { rejectValue: string; state: RootState }
>(
    'iir/getUserNotSignedIirHtmlThunk',
    async (payload, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const { not_signed_document_html } = await getUserNotSignedIirHtml(payload, token);
            return {
                uuid: payload.uuid,
                not_signed_document_html,
            };
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    },
);


// 3. Отклонить документ
export const rejectIirDocumentThunk = createAsyncThunk<
    void,
    { payload: RejectIirPayload; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>('iir/rejectIirDocumentThunk', async ({ payload, onSuccess }, { getState, dispatch, rejectWithValue }) => {
    try {
        const token = getState().user.token;
        await rejectIirDocument(payload, token);
        onSuccess?.();
    } catch (err: any) {
        const msg = err.response?.data?.errorText || err.message;
        dispatch(setError(msg));
        return rejectWithValue(msg);
    }
});

// 4. Получить подписанный PDF
// 4. Получить подписанный PDF
export const getSignedIirDocumentThunk = createAsyncThunk<
    { uuid: string; document: Uint8Array },      // 👉 возвращаем объект
    { payload: GetSignedIirPayload; purpose?: 'download' | 'preview'; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    'iir/getSignedIirDocumentThunk',
    async ({ payload, purpose = 'preview', onSuccess }, { getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const arrayBuf = await getSignedIirDocument(payload, token);
            const pdfBytes = new Uint8Array(arrayBuf);

            if (purpose === 'download') onSuccess?.();
            return { uuid: payload.uuid, document: pdfBytes };   // 👉 возвращаем и uuid, и pdf
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.errorText || err.message);
        }
    },
);


/* ------------------------------------------------------------------ */
/* SLICE */
/* ------------------------------------------------------------------ */

export const recomendationsSlice = createSlice({
    name: 'recomendations',
    initialState,
    reducers: {
        clearIirError: (state) => {
            state.error = null;
        },
        setCurrentIirUuid: (state, action: PayloadAction<string>) => {
            state.currentUuid = action.payload;
        },
        resetIirState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUserIirsThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUserIirsThunk.fulfilled, (state, action) => {
                state.list = action.payload as any;
                state.loading = false;
            })
            .addCase(getUserIirsThunk.rejected, (state, action) => {
                state.error = action.payload || 'Ошибка получения IIR';
                state.loading = false;
            })
            .addCase(getUserNotSignedIirHtmlThunk.fulfilled, (state, action) => {
                const requestUuid = action.meta.arg.uuid;
                const html = action.payload.not_signed_document_html;
                state.notSignedHtmls[`iir_${requestUuid}`] = html;
            })
            .addCase(getSignedIirDocumentThunk.fulfilled, (state, action) => {
                const { uuid, document } = action.payload;
                state.signedDocs[`iir_${uuid}`] = document;          // 👉 
            });
    },
});

/* ------------------------------------------------------------------ */
/* EXPORTS */
/* ------------------------------------------------------------------ */

export const { clearIirError, setCurrentIirUuid, resetIirState } = recomendationsSlice.actions;
export default recomendationsSlice.reducer;
