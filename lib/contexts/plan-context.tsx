"use client"
import { createContext, useContext } from "react";

interface PlanContextType {
  hasProPlan: boolean;
  hasEnterprisePlan: boolean;
  isFreeUser: boolean;
}
const PlanContext = createContext<PlanContextType | undefined>(undefined);
interface PlanProviderProps {
  children: React.ReactNode;
  hasProPlan: boolean;
  hasEnterprisePlan: boolean;
}
export function PlanProvider({
  children,
  hasEnterprisePlan,
  hasProPlan,
}: PlanProviderProps) {
  return (
    <PlanContext.Provider
      value={{
        hasProPlan,
        hasEnterprisePlan,
        isFreeUser: !hasProPlan && !hasEnterprisePlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}


export const usePlan = () =>{
    const context = useContext(PlanContext); 
    if(context === undefined){
        throw new Error("It must be inside a provider."); 
    }
    return context;
}