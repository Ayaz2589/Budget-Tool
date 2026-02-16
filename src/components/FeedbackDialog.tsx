import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Bug,
  Lightbulb,
  MessageCircle,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchLinearTeams,
  createLinearIssue,
  type LinearTeam,
  type FeedbackCategory,
  type LinearIssue,
} from "@/lib/linear";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: {
  value: FeedbackCategory;
  labelKey: string;
  icon: typeof Bug;
}[] = [
  { value: "bug", labelKey: "feedback.categoryBug", icon: Bug },
  { value: "feature", labelKey: "feedback.categoryFeature", icon: Lightbulb },
  {
    value: "feedback",
    labelKey: "feedback.categoryFeedback",
    icon: MessageCircle,
  },
];

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [teamId, setTeamId] = useState("");

  const [teams, setTeams] = useState<LinearTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<LinearIssue | null>(null);

  useEffect(() => {
    if (!open) return;
    setTeamsLoading(true);
    fetchLinearTeams()
      .then((fetched) => {
        setTeams(fetched);
        if (fetched.length === 1) setTeamId(fetched[0].id);
      })
      .catch(() => setError(t("feedback.teamsLoadError")))
      .finally(() => setTeamsLoading(false));
  }, [open, t]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setCategory("bug");
    setError(null);
    setCreatedIssue(null);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !teamId) return;
    setSubmitting(true);
    setError(null);
    try {
      const issue = await createLinearIssue({
        title: title.trim(),
        description,
        category,
        teamId,
      });
      setCreatedIssue(issue);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("feedback.submitError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const canSubmit = title.trim().length > 0 && teamId && !submitting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-1rem)] gap-4 p-5 sm:max-w-md">
        {createdIssue ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">
                {t("feedback.successTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("feedback.successDesc", {
                  identifier: createdIssue.identifier,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href={createdIssue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="size-4" />
                  {t("feedback.viewOnLinear")}
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
              >
                {t("feedback.submitAnother")}
              </Button>
            </div>
            <Button
              className="w-full h-11"
              onClick={() => handleClose(false)}
            >
              {t("feedback.close")}
            </Button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <DialogHeader>
              <DialogTitle>{t("feedback.title")}</DialogTitle>
              <DialogDescription>{t("feedback.subtitle")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Category pills */}
              <div className="space-y-1.5">
                <Label>{t("feedback.categoryLabel")}</Label>
                <div className="flex gap-2">
                  {CATEGORIES.map(({ value, labelKey, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        category === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-title">
                  {t("feedback.titleLabel")}
                </Label>
                <Input
                  id="feedback-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("feedback.titlePlaceholder")}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="feedback-description">
                  {t("feedback.descriptionLabel")}
                </Label>
                <Textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("feedback.descriptionPlaceholder")}
                  rows={4}
                />
              </div>

              {/* Team selector (only if multiple teams) */}
              {teamsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading teams...
                </div>
              ) : teams.length > 1 ? (
                <div className="space-y-1.5">
                  <Label>{t("feedback.teamLabel")}</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("feedback.teamPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {/* Submit */}
              <Button
                className="w-full h-11"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {t("feedback.submitting")}
                  </>
                ) : (
                  t("feedback.submit")
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
