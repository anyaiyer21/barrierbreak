import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";

import { cities, setActiveCity, type CityId } from "@/lib/scenarioEngine";

const STORAGE_KEY = "bb-city";

interface CityValue {
  city: CityId;
  setCity: (id: CityId) => void;
}

const CityContext = createContext<CityValue | null>(null);

/** Holds the chosen demo city and remounts the app when it changes. */
export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<CityId>("sammamish");

  const setCity = (id: CityId) => {
    setActiveCity(id);
    window.localStorage.setItem(STORAGE_KEY, id);
    setCityState(id);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as CityId | null;
    if (stored && stored !== "sammamish" && cities.some((c) => c.id === stored)) {
      setActiveCity(stored);
      setCityState(stored);
    }
  }, []);

  return (
    <CityContext.Provider value={{ city, setCity }}>
      <Fragment key={city}>{children}</Fragment>
    </CityContext.Provider>
  );
}

export function useCity() {
  const value = useContext(CityContext);
  if (!value) throw new Error("useCity must be used inside CityProvider");
  return value;
}
