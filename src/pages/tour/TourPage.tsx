import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RETURNING_USER_KEY,
  TOUR_COMPLETED_KEY,
  useGoogleAuth,
} from "@/context/GoogleAuthContext";

type TourStep = {
  title: string;
  body: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Ortho",
    body: "Ortho helps you track spending, income, debt, mortgage, and presets in one place. Your data is stored locally, and you stay in control with export and sync tools.",
  },
  {
    title: "Google Sheets Sync",
    body: "You can connect Google Sheets and sync your data, so your spreadsheet stays aligned with app updates.",
  },
  {
    title: "Export Your Data",
    body: "You can export and re-import your data as export string, PDF, and JSON. This gives you portability and full control of your records.",
  },
  {
    title: "Know the Main Pages",
    body: "Dashboard gives a quick summary. Transactions tracks expenses and transfers. Income tracks inflows. Debt and Mortgage track obligations. Settings controls sync, categories, owners, language, and currency.",
  },
  {
    title: "Language and Currency",
    body: "You can switch languages and display currency at any time. Amounts are shown in your selected currency, while core records stay consistent for reliable sync and export.",
  },
  {
    title: "Ready to Start",
    body: "Sign in with Google to begin using Ortho.",
  },
];

function setTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, "1");
    localStorage.setItem(RETURNING_USER_KEY, "1");
  } catch {
    // ignore
  }
}

export function TourPage() {
  const { isSignedIn, signIn } = useGoogleAuth();
  const [stepIndex, setStepIndex] = useState(0);

  const lastIndex = TOUR_STEPS.length - 1;
  const isLast = stepIndex === lastIndex;
  const step = TOUR_STEPS[stepIndex]!;
  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${TOUR_STEPS.length}`,
    [stepIndex],
  );

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const goBack = () => setStepIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setStepIndex((prev) => Math.min(lastIndex, prev + 1));

  const handleFinishSignIn = () => {
    setTourCompleted();
    signIn();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <div className="text-sm text-muted-foreground">{progressLabel}</div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-base text-muted-foreground leading-relaxed">
            {step.body}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            {!isLast ? (
              <Button type="button" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleFinishSignIn}>
                Sign in with Google
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

