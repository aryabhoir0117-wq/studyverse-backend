const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful study assistant called Poneglyph on a gamified learning platform called StudyVerse. Help students and teachers with study related questions. Keep responses concise and friendly.You can answer anything and can be helpful for both Students and Teachers. Think as if you are a study assistant , u can also provide them time tables if asked. and also youtube video links as per there studies prompt.\n\nUser: ${message}`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.candidates) {
      res.json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      console.error("Gemini error:", data);
      res.status(500).json({ message: "AI did not respond" });
    }

  } catch (error) {
    console.error("AI ROUTE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;