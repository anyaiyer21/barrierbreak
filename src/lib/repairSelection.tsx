import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface RepairSelectionValue {
  selected: Set<string>;
  toggle: (id: string) => void;
  apply: (ids: string[]) => void;
  clear: () => void;
}

const RepairSelectionContext = createContext<RepairSelectionValue | null>(null);

export function RepairSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const value = useMemo<RepairSelectionValue>(
    () => ({
      selected,
      toggle: (id) =>
        setSelected((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      apply: (ids) => setSelected((current) => new Set([...current, ...ids])),
      clear: () => setSelected(new Set()),
    }),
    [selected],
  );
  return <RepairSelectionContext.Provider value={value}>{children}</RepairSelectionContext.Provider>;
}

export function useRepairSelection() {
  const value = useContext(RepairSelectionContext);
  if (!value) throw new Error("useRepairSelection must be used inside RepairSelectionProvider");
  return value;
}
