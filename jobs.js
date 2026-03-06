// api/jobs.js
// Fetches jobs from Adzuna — your API keys stay hidden on the server

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { query, location } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const url = `https://api.adzuna.com/v1/api/jobs/za/search/1` +
    `?app_id=${process.env.ADZUNA_APP_ID}` +
    `&app_key=${process.env.ADZUNA_API_KEY}` +
    `&results_per_page=8` +
    `&what=${encodeURIComponent(query)}` +
    `&where=${encodeURIComponent(location || "South Africa")}` +
    `&content-type=application/json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Adzuna error");
    const data = await response.json();
    res.status(200).json(data.results || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
