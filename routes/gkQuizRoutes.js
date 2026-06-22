const express = require("express");
const router  = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const GKQuiz  = require("../models/GKQuiz");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── generate today's quiz (called by cron or manually) ───────────────────
async function generateTodaysQuiz() {
  const today = new Date().toDateString();

  const existing = await GKQuiz.findOne({ date: today });
  if (existing) return existing;

  // 1. Fetch real headlines from NewsAPI
  let rawHeadlines = [];
  try {
    const newsRes = await fetch(
      `https://newsapi.org/v2/top-headlines?country=in&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`
    );
    const newsData = await newsRes.json();
    rawHeadlines = (newsData.articles || [])
      .slice(0, 10)
      .map(a => a.title)
      .filter(Boolean);
  } catch (e) {
    console.error("NewsAPI error:", e.message);
    rawHeadlines = [
      "Scientists discover new marine species in the Indian Ocean",
      "Government launches new digital education initiative",
      "Space agency plans lunar mission for 2027",
      "Record rainfall hits several states this monsoon",
      "Tech companies invest in AI research centers",
      "New species of butterfly found in Western Ghats",
      "Solar energy capacity reaches new high",
      "World chess championship begins this week",
      "Archaeologists uncover ancient temple ruins",
      "Youth athletes win medals at Asian games"
    ];
  }

  // 2. Ask Groq to rewrite them in a fun way + generate 5 quiz questions
  const prompt = `
You are a fun, energetic news anchor for a student learning app. 
Students are aged 10-16. Make news exciting, not boring.

Here are today's real headlines:
${rawHeadlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Return ONLY valid JSON, no markdown, no backticks:
{
  "headlines": [
    {
      "title": "Short punchy rewritten headline keep the context same don't use asterrisk (max 20 words)",
      "brief": "2-3 sentence fun summary a 12-year-old would enjoy reading",
      "emoji": "relevant emoji"
    }
  ],
  "questions": [
    {
      "question": "Question based on the headlines above",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Short explanation why this is correct"
    }
  ]
}

Generate 10 headlines and exactly 5 questions. Keep language simple and fun.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000
  });

let raw = completion.choices[0].message.content.trim();

raw = raw
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

const json = JSON.parse(raw);
  const quiz = await GKQuiz.create({
    date: today,
    headlines: json.headlines,
    questions: json.questions
  });

  return quiz;
}

// ── GET today's quiz (students) ───────────────────────────────────────────
router.get("/today", protect, async (req, res) => {
  try {
    const quiz = await generateTodaysQuiz();
    res.json(quiz);
  } catch (error) {
    console.error("GK Quiz error:", error.message);
    res.status(500).json({ message: "Could not generate quiz: " + error.message });
  }
});

// ── POST quiz result + award XP ───────────────────────────────────────────
router.post("/submit", protect, requireRole("student"), async (req, res) => {
  try {
    const { answers, date } = req.body; // answers: [0,2,1,3,0]
    const quiz = await GKQuiz.findOne({ date: date || new Date().toDateString() });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let correct = 0;
    const results = quiz.questions.map((q, i) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) correct++;
      return {
        question:    q.question,
        yourAnswer:  answers[i],
        correct:     q.answer,
        isCorrect,
        explanation: q.explanation
      };
    });

    // XP: 20 per correct answer
    const earnedXP = correct * 20;
    if (earnedXP > 0) {
      const User = require("../models/User");
      const user = await User.findById(req.user._id);
      user.xp     += earnedXP;
      user.bounty += earnedXP;
      await user.save();
    }

    res.json({ correct, total: quiz.questions.length, earnedXP, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
console.log("GK routes loaded");
module.exports = router;