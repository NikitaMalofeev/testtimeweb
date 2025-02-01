import { AppDispatch } from "app/providers/store/config/store";
import { useDispatch } from "react-redux";


export const useAppDispatch: () => AppDispatch = useDispatch;