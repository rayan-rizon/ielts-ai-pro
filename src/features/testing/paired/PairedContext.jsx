import { createContext, useContext } from 'react';
export const PairedContext = createContext(null);
export const usePairedTest = () => useContext(PairedContext);
