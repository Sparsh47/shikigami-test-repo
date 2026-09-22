const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Readiness/liveness probes should hit this. Keep it dependency-free
// so it stays fast and reliable even under load.
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("Shikigami test agent is alive 🎉");
});

// The actual "agent" behavior: takes a message, optionally calls an LLM
// if a key is configured, otherwise returns a mock reply. This lets you
// test the full deploy pipeline even before wiring up secret injection.
app.post("/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.json({
      reply: `[mock reply, no GROQ_API_KEY set] You said: ${message}`,
    });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "No response from model";
    res.json({ reply });
  } catch (err) {
    console.error("LLM call failed:", err);
    res.status(500).json({ error: "Failed to reach the model provider" });
  }
});

app.listen(PORT, () => {
  console.log(`Agent listening on port ${PORT}`);
});
