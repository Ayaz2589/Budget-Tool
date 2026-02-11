import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
  highlights: string[];
};

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Ortho",
    body: "Ortho is built to give you one place to run your household finances without handing control of your data to a third-party backend.",
    highlights: [
      "Track expenses, income, debt, mortgage, and presets in one flow.",
      "Keep your records locally and decide when to sync or export.",
      "Use one consistent system across desktop and mobile.",
    ],
  },
  {
    title: "Google Sheets Sync",
    body: "Connect Google Sheets when you want spreadsheet visibility and backup-style copy of your data.",
    highlights: [
      "Sync writes your current app data to your chosen spreadsheet.",
      "Restore can pull your spreadsheet data back into the app.",
      "Auto-sync helps keep edits aligned with minimal manual work.",
    ],
  },
  {
    title: "Export Your Data",
    body: "You can move your data in and out of Ortho whenever needed.",
    highlights: [
      "Export and import with export string, PDF, and JSON.",
      "Portable formats let you migrate, archive, or inspect your data.",
      "No lock-in: you can always leave with your own records.",
    ],
  },
  {
    title: "Dashboard Overview",
    body: "The dashboard is your quick health check for the selected period.",
    highlights: [
      "See net cash flow, income, spending, and debt context at a glance.",
      "Use charts and owner views to spot trends quickly.",
      "Check insights and activity without digging through tables.",
    ],
  },
  {
    title: "Transactions and Income",
    body: "Use these pages for day-to-day entries and corrections.",
    highlights: [
      "Transactions: expenses, owner transfers, filters, and totals.",
      "Income: grouped history and fast add/edit workflows.",
      "Presets reduce repetitive entry work for common rows.",
    ],
  },
  {
    title: "Debt, Mortgage, and Settings",
    body: "Use these pages to manage obligations and app-level controls.",
    highlights: [
      "Debt and Mortgage track balances, payments, and history.",
      "Settings controls categories, owners, sync, formatting, and tour replay.",
      "Data page handles imports and exports.",
    ],
  },
  {
    title: "Language and Currency",
    body: "Ortho supports multi-language and multi-currency display so the app can match your preferences.",
    highlights: [
      "Switch app language from Settings at any time.",
      "Switch display currency and see values converted in the UI.",
      "Canonical storage remains consistent for reliable sync/export.",
    ],
  },
  {
    title: "Ready to Start",
    body: "Sign in with Google to begin using Ortho.",
    highlights: [
      "Sign in to unlock Google Sheets sync.",
      "You can replay this tour later from Settings.",
    ],
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const isReplay = searchParams.get("replay") === "1";

  const lastIndex = TOUR_STEPS.length - 1;
  const isLast = stepIndex === lastIndex;
  const baseStep = TOUR_STEPS[stepIndex]!;
  const step =
    isLast && isSignedIn
      ? {
          ...baseStep,
          body: "Your account is already connected. You can finish this walkthrough and continue to your dashboard.",
          highlights: [
            "Google Sheets sync is available in Settings.",
            "You can replay this tour later from Settings.",
          ],
        }
      : baseStep;
  const progressLabel = useMemo(
    () => `${stepIndex + 1} / ${TOUR_STEPS.length}`,
    [stepIndex],
  );

  if (isSignedIn && !isReplay) {
    return <Navigate to="/dashboard" replace />;
  }

  const goBack = () => setStepIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setStepIndex((prev) => Math.min(lastIndex, prev + 1));

  const handleFinishSignIn = () => {
    setTourCompleted();
    signIn();
  };

  const handleFinishReplay = () => {
    setTourCompleted();
    navigate("/dashboard");
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
          <ul className="space-y-2 text-sm text-muted-foreground">
            {step.highlights.map((item) => (
              <li key={item} className="leading-relaxed">
                - {item}
              </li>
            ))}
          </ul>
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
            ) : isSignedIn ? (
              <Button type="button" onClick={handleFinishReplay}>
                Finish tour
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
