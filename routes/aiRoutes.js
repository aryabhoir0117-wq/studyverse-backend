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
            content: "You are Poneglyph, a study assistant in the StudyVerse platform. Your role is to Help students understand concepts clearly,Answer study-related questions Assist teachers with explanations if needed. Guidelinesis to Keep answers short and simple ,Explain step-by-step when required ,Use examples for better understanding ,Stay strictly on study-related topics ,If the question is unclear, ask for clarificationTone,Ocassionally use theme word like voyage, mission, bounty, but keep it subtle Friendly and easy to understand."
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
