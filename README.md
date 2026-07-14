# 🏴‍☠️ StudyVerse

**A multi-tenant, pirate-themed LMS that turns boring lessons into a game.**

StudyVerse lets schools onboard teachers and students, run AI-generated lessons/quizzes, and gamify learning through a rank system (Cabin Boy → Pirate King). Core engine is theme-agnostic — pirates today, space/ninja/medieval tomorrow — same battle logic, different skin.

---

## 1. Roles & Hierarchy

- **Super Admin** (server-side, us): adds/removes schools, adds/removes school admins, handles escalated issues.
- **Admin** (per school): manages teachers, students, sections, resolves school-level issues.
- **Teacher**: owns sections/subjects, creates lessons + notes, grades bounties → marks, views analytics.
- **Student**: consumes lessons/notes, plays quiz battles, earns bounty → rank, checks leaderboard.

Registration is backend-only — no public signup. Admin registers teachers/students first; unregistered users trying to log in get a "contact your admin to register" prompt.

```mermaid
flowchart TD
    SA["🦅 Super Admin"] -->|creates/removes| SCH1["School A"]
    SA -->|creates/removes| SCH2["School B"]
    SA -->|assigns/removes| ADM1["Admin - School A"]
    SA -->|assigns/removes| ADM2["Admin - School B"]

    ADM1 -->|adds/removes| T1["Teacher"]
    ADM1 -->|adds/removes| S1["Student"]
    ADM1 --> SEC1["Sections & Subjects"]

    T1 -->|teaches multiple| SEC1
    SEC1 --> S1

    T1 -->|creates| LES["Lessons + Notes"]
    LES --> S1
    S1 -->|plays quiz, earns bounty| RANK["Rank Progress"]
```

---

## 2. Login Flow

One unified login page. JWT decides role → redirect to the right dashboard. No self-signup for teacher/student — only admin-created accounts (or their own Google account tied to the record) can log in.

```mermaid
flowchart TD
    A["User visits Login Page"] --> B{"Credentials valid?"}
    B -- No --> C["Not registered?"]
    C --> D["Popup: Ask your Admin to register you first"]
    B -- Yes --> E["JWT issued with role claim"]
    E --> F{"Role in JWT"}
    F -- superadmin --> G["Super Admin Dashboard"]
    F -- admin --> H["Admin Dashboard"]
    F -- teacher --> I["Teacher Dashboard"]
    F -- student --> J["Student Dashboard"]
```

---

## 3. Landing / Index Page

Not a static page — a mini interactive intro:
- Animated ship sailing across the screen ("set sail" feel).
- Short pitch: what StudyVerse is, pirate framing, no emoji spam — real illustration/animation instead.
- Interactive bit: user builds a **pirate flag** (pick name, color, symbol) before entering — light onboarding hook, not a gimmick tacked on.
- CTA → Login.

```mermaid
flowchart LR
    L1["Landing: animated ship + pitch"] --> L2["Build your pirate flag - name/color/symbol"]
    L2 --> L3["CTA: Set Sail -> Login"]
```

---

## 4. Teacher Workflow: Lessons & Notes

Teacher writes a topic → AI (Groq) generates the lesson + quiz in one click. Everything a teacher uploads (first lesson or note) auto-creates a **subject card** that bundles both lessons and notes together.

```mermaid
flowchart TD
    T["Teacher enters topic"] --> AI["AI (Groq) generates lesson + quiz"]
    AI --> CARD{"Subject card exists?"}
    CARD -- No --> NEW["Create new Subject Card"]
    CARD -- Yes --> ADD["Attach to existing Subject Card"]
    NEW --> DASH["Appears on Student Dashboard"]
    ADD --> DASH

    T --> NOTES["Upload notes: PDF / text, auto-dated daily"]
    NOTES --> CARD

    T --> MGMT["View / Edit / Delete lessons & notes"]
    T --> GRADE["Convert student bounty -> marks"]
    GRADE --> XL["Export all students' marks as Excel"]
    T --> ANALYTICS["Per-student analytics + leaderboard"]
```

---

## 5. Student Flow: News Snake Game → Quiz Battle

This is the core engagement loop, solving the "reading news is boring" problem.

```mermaid
flowchart TD
    S1["Student opens GK Quiz Game"] --> S2["NewsAPI fetches real headlines"]
    S2 --> S3["Groq rewrites headlines in kid-friendly pirate style"]
    S3 --> S4["Stored in MongoDB as 'treasure coins'"]
    S4 --> S5["Student plays Snake Game to collect 10 coins"]
    S5 --> S6{"All 10 coins collected?"}
    S6 -- No --> S5
    S6 -- Yes --> S7["Reveal 10 rewritten headlines + short content"]
    S7 --> S8["5 questions generated from those headlines"]
    S8 --> S9["Battle Screen: answer = attack enemy"]
    S9 --> S10{"Correct?"}
    S10 -- Yes --> S11["Player attacks + combo multiplier builds"]
    S10 -- No --> S12["Enemy attacks player"]
    S11 --> S13{"More questions?"}
    S12 --> S13
    S13 -- Yes --> S9
    S13 -- No --> S14["Bounty awarded"]
    S14 --> S15["Leaderboard + Analytics updated"]
```

---

## 6. Core Battle Engine (Theme-Agnostic)

**Key decision: don't build "a pirate game" — build one game engine with swappable skins.** Same logic every time; only visuals/story rotate (weekly, not daily — avoids burnout, keeps anticipation).

```mermaid
flowchart TD
    Q["Question appears"] --> ANS["Student answers"]
    ANS -->|Correct| ATK["Attack animation + progress + reward"]
    ANS -->|Wrong| DMG["Enemy attacks player"]
    ATK --> END{"Battle over?"}
    DMG --> END
    END -- No --> Q
    END -- Yes --> REW["Collect rewards / bounty"]
```

### Theme Skin Table (engine never changes, only these swap)

| Theme | Player | Enemy | Attack Animation |
|---|---|---|---|
| Pirate | Ship | Enemy ship | Cannon |
| Space | Spaceship | Alien fleet | Laser |
| Medieval | Knight | Dragon | Sword |
| Ninja | Ninja | Demon | Shuriken |
| Jungle | Explorer | Tiger | Arrow |
| Underwater | Dolphin rider | Shark | Water blast |
| Cyberpunk | Hacker | Robot | EMP attack |
| Fantasy | Wizard | Dark spirit | Magic spell |
| Viking | Viking ship | Sea serpent | Axe throw |
| Samurai | Samurai | Oni | Katana slash |

Rotation cadence: **weekly** theme swap, plus limited-time event skins (Halloween, Christmas, Summer). No copyrighted characters/IP — all original designs per theme. "Today's Adventure: 🏴 Pirate Sea" style reveal builds anticipation on load.

---

## 7. Ranking System

Bounty (earned from quiz battles) accumulates into rank progression:

```mermaid
flowchart LR
    R1["Cabin Boy"] --> R2["Pirate Apprentice"]
    R2 --> R3["Sailor"]
    R3 --> R4["First Mate"]
    R4 --> R5["Captain"]
    R5 --> R6["Warlord"]
    R6 --> R7["Pirate King 👑"]
```

*(Exact tier names/thresholds are tunable — this is the shape, not final copy.)*

---

## 8. Dashboards Summary

| Role | Sees |
|---|---|
| Super Admin | All schools, add/remove schools & admins, escalated issue resolution |
| Admin | Teachers, students, sections, subjects for their school; issue handling |
| Teacher | Lesson/notes creation (manual + AI), student analytics, marks export, leaderboard |
| Student | Subject cards (lessons + notes), quiz battles, bounty/rank, leaderboard, own analytics |

---

## 9. Tech Stack (from build so far)

- **Frontend**: separate repo, HTML/CSS/JS (component files kept separate, not bundled as zips)
- **Backend**: Node/Express + MongoDB Atlas, JWT auth, Helmet + rate limiting, soft deletes
- **AI**: Groq (lesson generation, headline rewriting)
- **News**: NewsAPI
- **Storage**: Cloudinary (PDF notes) + Google Docs viewer for inline preview
- **Deployment**: Render (frontend + backend as separate services)

---

## 10. What's Explicitly Out of Scope (for now)

- No public self-signup — admin-provisioned accounts only
- No daily theme swaps — weekly, to avoid dilution
- No reused copyrighted characters in any theme skin — all original art direction
