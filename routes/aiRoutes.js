const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful study assistant called Poneglyph on a gamified learning platform called StudyVerse. Help students and teachers with study related questions, explanations, and learning tips. Keep responses concise and friendly."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (data.choices) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ message: "AI did not respond" });
    }

  } catch (error) {
    console.error("AI ROUTE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;