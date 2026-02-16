/** Linear team summary. */
export interface LinearTeam {
  id: string;
  name: string;
}

/** Successful issue creation result. */
export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
}

export type FeedbackCategory = "bug" | "feature" | "feedback";

export interface CreateFeedbackInput {
  title: string;
  description: string;
  category: FeedbackCategory;
  teamId: string;
}

const API_ENDPOINT = "/api/linear";

async function linearRequest<T>(
  action: string,
  payload?: unknown,
): Promise<T> {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(
      (err as { error?: string }).error ?? `Linear API error: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

/** Fetch available Linear teams. */
export async function fetchLinearTeams(): Promise<LinearTeam[]> {
  const data = await linearRequest<{ teams: { nodes: LinearTeam[] } }>(
    "teams",
  );
  return data.teams.nodes;
}

/** Create a feedback issue on Linear. */
export async function createLinearIssue(
  input: CreateFeedbackInput,
): Promise<LinearIssue> {
  const categoryLabel: Record<FeedbackCategory, string> = {
    bug: "[Bug]",
    feature: "[Feature Request]",
    feedback: "[Feedback]",
  };

  const priorityMap: Record<FeedbackCategory, number> = {
    bug: 1,
    feature: 3,
    feedback: 4,
  };

  const payload = {
    title: `${categoryLabel[input.category]} ${input.title}`,
    description: input.description,
    teamId: input.teamId,
    priority: priorityMap[input.category],
  };

  const data = await linearRequest<{
    issueCreate: { success: boolean; issue: LinearIssue };
  }>("createIssue", payload);

  if (!data.issueCreate.success) {
    throw new Error("Failed to create issue");
  }

  return data.issueCreate.issue;
}
