import { PlanProvider } from "@/lib/contexts/plan-context";
import { auth } from "@clerk/nextjs/server";
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const { has } = await auth();
  const hasProPlan = has({ plan: "pro" });
  const hasEnterprisePlan = has({ plan: "enterprise" });

  return (
    <PlanProvider hasProPlan={hasProPlan} hasEnterprisePlan={hasEnterprisePlan}>
      {children}
    </PlanProvider>
  );
};

export default DashboardLayout;
