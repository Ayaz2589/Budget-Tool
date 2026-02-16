import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquarePlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DsSectionHeader } from "@/components/ds";
import { FeedbackDialog } from "@/components/FeedbackDialog";

export function AboutPage() {
  const { t } = useTranslation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="mb-3 px-4 md:px-0 pt-4 md:pt-0 shrink-0 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
        <DsSectionHeader
          title={t("about.title")}
          subtitle={t("about.subtitle")}
        />
      </div>

      <div className="space-y-4 sm:space-y-6 pb-24 md:pb-0 px-4 md:px-0">
        <Card className="md:border-0 md:shadow-none md:rounded-none md:bg-transparent md:py-0">
          <CardContent className="rounded-xl border border-border/70 bg-card/40 p-4 md:p-5 space-y-4">
            <section className="ortho-mission space-y-4" aria-labelledby="ortho-mission-title">
              <h2 id="ortho-mission-title" className="text-xl font-semibold">
                {t("about.missionTitle")}
              </h2>

              <p className="text-sm text-muted-foreground">
                <strong>
                  {t("about.missionStrong")}
                </strong>
              </p>

              <p className="text-sm text-muted-foreground">
                {t("about.missionBody")}
              </p>

              <p className="text-sm text-muted-foreground">
                <strong>{t("about.committedTitle")}</strong>
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>{t("about.committedItem1")}</li>
                <li>{t("about.committedItem2")}</li>
                <li>{t("about.committedItem3")}</li>
                <li>{t("about.committedItem4")}</li>
              </ul>

              <p className="text-sm text-muted-foreground">
                {t("about.noBackendBody")}
              </p>

              <p className="text-sm text-muted-foreground">
                {t("about.exportBody")}
              </p>

              <p className="text-sm text-muted-foreground">
                {t("about.futureBody")}
              </p>

              <p className="text-sm text-muted-foreground">
                <strong>{t("about.closingStrong")}</strong>
              </p>

              <div className="pt-6 mt-2 border-t border-border/60 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("about.supportBody")}
                </p>
                <Button
                  className="h-11 inline-flex items-center gap-2"
                  onClick={() => setFeedbackOpen(true)}
                >
                  <MessageSquarePlus className="size-4" />
                  <span>{t("feedback.title")}</span>
                </Button>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}
