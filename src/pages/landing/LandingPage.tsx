import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Landmark, Upload, ListOrdered, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center px-6 py-16 sm:py-20 md:py-24 text-center">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Landmark className="size-7 text-primary" />
          </div>
          <span className="font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
            {t("landing.heroTitle")}
          </span>
        </div>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mb-8">
          {t("landing.heroTagline")}
        </p>
        <Button asChild size="lg" className="h-12 px-8 text-base">
          <Link to="/auth">{t("landing.heroCta")}</Link>
        </Button>
      </header>

      {/* Value prop */}
      <section className="px-6 py-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          {t("landing.valueProp")}
        </p>
      </section>

      {/* Feature cards */}
      <section className="px-6 py-8 pb-12 flex-1">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={cn("border bg-card")}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Upload className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {t("landing.featureImport")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.featureImportDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("border bg-card")}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ListOrdered className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {t("landing.featureRules")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.featureRulesDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("border bg-card")}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {t("landing.featureSheets")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.featureSheetsDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("border bg-card")}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {t("landing.featurePdf")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("landing.featurePdfDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="px-6 py-8 border-t bg-muted/30">
        <div className="max-w-xl mx-auto text-center">
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link to="/auth">{t("landing.footerCta")}</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
