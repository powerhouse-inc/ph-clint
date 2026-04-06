import { createContext, useContext } from "react";

const PresentContext = createContext(false);

export const PresentProvider = PresentContext.Provider;

export function useIsPresenting() {
  return useContext(PresentContext);
}
