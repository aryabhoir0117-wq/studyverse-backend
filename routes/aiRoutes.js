const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;

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
            content: "You are a helpful study assistant called Poneglyph on a gamified learning platform called StudyVerse. Help students and teachers with study related questions. Keep responses concise and friendly.You can answer anything and can be helpful for both Students and Teachers. Think as if you are a study assistant , u can also provide them time tables if asked. and also youtube video links as per there studies prompt."
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
      console.error("Groq error:", data);
      res.status(500).json({ message: "AI did not respond" });
    }

  } catch (error) {
    console.error("AI ROUTE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
