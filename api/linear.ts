import type { VercelRequest, VercelResponse } from "@vercel/node";

const LINEAR_API_URL = "https://api.linear.app/graphql";

const TEAMS_QUERY = `query { teams { nodes { id name } } }`;

const CREATE_ISSUE_MUTATION = `
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { id identifier title url }
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "LINEAR_API_KEY not configured" });
  }

  const { action, payload } = req.body as {
    action: string;
    payload?: Record<string, unknown>;
  };

  let query: string;
  let variables: Record<string, unknown> = {};

  if (action === "teams") {
    query = TEAMS_QUERY;
  } else if (action === "createIssue") {
    if (!payload?.title || !payload?.teamId) {
      return res.status(400).json({ error: "title and teamId are required" });
    }
    query = CREATE_ISSUE_MUTATION;
    variables = { input: payload };
  } else {
    return res.status(400).json({ error: "Unknown action" });
  }

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  if (!response.ok || data.errors) {
    const message =
      data.errors?.[0]?.message ?? `Linear API error: ${response.status}`;
    return res
      .status(response.ok ? 400 : response.status)
      .json({ error: message });
  }

  return res.status(200).json(data.data);
}
