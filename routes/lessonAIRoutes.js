const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.post("/generate", protect, async (req, res) => {
  try {
    const { topic, subject } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a quiz generator. Generate exactly 1 MCQ question. Respond ONLY in this exact JSON format with no extra text: {\"question\": \"question here\", \"options\": [\"option1\", \"option2\", \"option3\", \"option4\"], \"answer\": 0} where answer is the index (0-3) of the correct option."
          },
          {
            role: "user",
            content: `Generate 1 MCQ question about ${topic} for ${subject}`
          }
        ]
      })
    });

    const data = await response.json();

    if (data.choices) {
      const text = data.choices[0].message.content.trim();
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      res.json(parsed);
    } else {
      console.error("Groq error:", data);
      res.status(500).json({ message: "AI did not respond" });
    }

  } catch (error) {
    console.error("LESSON AI ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;