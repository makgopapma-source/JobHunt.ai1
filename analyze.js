// api/analyze.js
// Scores a job against the candidate's CV — Anthropic key stays hidden on the server

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { cvText, cvBase64, job } = req.body;
  if (!job) return res.status(400).json({ error: "Missing job data" });

  const jobText = `${job.title} at ${job.company?.display_name || "Unknown Company"}\n\n${job.description}`;

  const userContent = cvBase64
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: cvBase64 } },
        { type: "text", text: `You are a career coach. The PDF is the candidate's CV. Score this job against it.\n\nJOB:\n${jobText}\n\nRespond ONLY with valid JSON (no markdown):\n{"score":<0-100>,"verdict":"<Strong Match|Good Match|Partial Match|Weak Match>","strengths":["...","...","..."],"gaps":["...","..."],"talkingPoints":["...","...","..."],"summary":"..."}` }
      ]
    : `You are a career coach. Score this job against the candidate profile.\n\nPROFILE:\n${cvText}\n\nJOB:\n${jobText}\n\nRespond ONLY with valid JSON (no markdown):\n{"score":<0-100>,"verdict":"<Strong Match|Good Match|Partial Match|Weak Match>","strengths":["...","...","..."],"gaps":["...","..."],"talkingPoints":["...","...","..."],"summary":"..."}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || "").join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
}
