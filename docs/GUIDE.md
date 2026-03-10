# NoteGenius AI — Complete User Guide

> Your AI-powered smart notebook. 100% browser-based, free, no sign-up required.

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Setting Up Your Groq API Key](#setting-up-your-groq-api-key)
3. [App Layout](#app-layout)
4. [Managing Notes](#managing-notes)
5. [Saving Notes](#saving-notes)
6. [Quick Actions](#quick-actions)
7. [Smart Tools](#smart-tools)
8. [Power Analysis Tools](#power-analysis-tools)
9. [Rewrite As](#rewrite-as)
10. [Translate To](#translate-to)
11. [Chat with Your Note](#chat-with-your-note)
12. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

NoteGenius AI runs entirely in your browser — no installation, no account, no server.

1. Open the app in **Chrome** or **Edge** (recommended)
2. You will see 3 panels: **Sidebar** (left) · **Editor** (center) · **AI Panel** (right)
3. A welcome note is ready — start typing immediately
4. Set up your free Groq API key to unlock all AI features (see below)

---

## Setting Up Your Groq API Key

All AI features require a **free** Groq API key. It takes 2 minutes to get one.

### Step-by-Step Instructions

**Step 1:** Open [console.groq.com](https://console.groq.com) in a new browser tab

**Step 2:** Sign up for a free account
- Click **"Sign Up"**
- You can log in with Google or GitHub — no credit card needed

**Step 3:** Create your API key
- Once logged in, click **"API Keys"** in the left menu
- Click the **"Create API Key"** button
- Give it a name like `NoteGenius` (any name works)
- Click **"Submit"**

**Step 4:** Copy your key
- Your new key appears on screen — it starts with `gsk_` followed by a long string
- Click the **copy icon** to copy it
- Save it somewhere safe — Groq only shows the full key once

**Step 5:** Add it to NoteGenius AI
- Look at the left sidebar — you will see a yellow **"Groq API Key Required"** banner
- Click **"How to get my free key"**
- Paste your key into the input field
- Click **"Save Key"**
- The banner turns green (**AI Key Active**) — you are ready!

### Is It Really Free?
Yes. Groq's free tier gives you:
- Millions of tokens per day for free
- Access to Llama 3.3 70B (the most powerful free AI model)
- No credit card required

---

## App Layout

```
+-----------------+--------------------------+-----------------+
|   LEFT SIDEBAR  |     CENTER EDITOR        |   RIGHT PANEL   |
|                 |                          |                 |
|  - Search bar   |  - Note title            |  - Quick Actions|
|  - Notes list   |  - Writing area          |  - Smart Tools  |
|  - + New Note   |  - Save as .txt button   |  - Power Analysis|
|                 |  - Delete button         |  - Rewrite As   |
|  - API Key      |  - Word/char count       |  - Translate To |
|    status       |                          |  - Chat         |
+-----------------+--------------------------+-----------------+
```

---

## Managing Notes

### Create a New Note
- Click **"+ New Note"** in the left sidebar
- A new note called "Untitled Note" appears
- Click the title to rename it
- Start typing in the center editor

### Switch Between Notes
- Click any note in the sidebar to switch to it
- Your changes are saved in memory automatically

### Search Notes
- Type in the search bar at the top of the sidebar
- Notes filter in real-time by title and content
- Clear the search to see all notes

### Delete a Note
- Open the note you want to delete
- Click the **trash icon** in the top toolbar
- The note is removed immediately

---

## Saving Notes

NoteGenius AI stores notes in **browser memory only** — they are cleared when you close the tab. Always download important notes.

### Save as .txt
1. Open the note you want to save
2. Click the green **"Save as .txt"** button in the toolbar
3. Your browser's Save dialog appears — choose a folder
4. The file is saved as plain text you can open in any editor

### File Format
```
My Note Title
=============
Your note content goes here...
```

---

## Quick Actions

These 5 buttons process your **entire note** with one click. Results appear in the AI result box on the right.

---

### 1. Summarize

**What it does:** Condenses your entire note into clear, concise bullet points.

**Apply button:** Appends the summary to the end of your note.

**Scenario:**
> Maya just finished a 2-hour client meeting and has 800 words of messy notes. She clicks **Summarize** and gets 7 clean bullet points covering the client's requirements, concerns, and agreed next steps. She pastes these into her project management tool in seconds.

---

### 2. Expand

**What it does:** Takes short bullet points or rough ideas and turns them into detailed, well-written paragraphs.

**Apply button:** Appends the expanded content to the end of your note.

**Scenario:**
> Raj has a note with 4 bullet points: "email campaign -> 3 segments -> A/B test subject -> track open rate". He clicks **Expand** and gets a full 3-paragraph email marketing strategy. He uses it as the first draft of a proposal.

---

### 3. Fix Grammar

**What it does:** Corrects all grammar, spelling, and punctuation errors in your note.

**Apply button:** REPLACES your entire note with the corrected version.

**Scenario:**
> Priya typed lecture notes quickly and made many typos. She clicks **Fix Grammar** and her note is instantly clean, correctly punctuated, and readable — ready to share with classmates.

---

### 4. Key Points

**What it does:** Extracts the most important points and action items as a numbered list.

**Apply button:** Appends the key points to the end of your note.

**Scenario:**
> After a 1-hour product brainstorm, Sam has a wall-of-text note. He clicks **Key Points** and gets a numbered list of 6 decisions made and 4 action items — including the deadline he almost missed.

---

### 5. ELI5 (Explain Like I'm 5)

**What it does:** Rewrites complex content in simple, everyday language using analogies.

**Apply button:** Appends the simplified version to the end of your note.

**Scenario:**
> Aisha pasted a dense paragraph about blockchain from a whitepaper. She clicks **ELI5** and gets an explanation comparing it to a shared notebook that thousands of people can read but no one can erase — something she can actually explain to her parents.

---

## Smart Tools

5 intelligent tools that go beyond basic AI actions.

---

### 6. Generate Title

**What it does:** Reads your note content and suggests **3 clever, descriptive titles**. Click any title to apply it as your note's title instantly.

**Scenario:**
> Dev wrote 4 paragraphs about why remote work is changing company culture but titled it "Untitled Note". He clicks **Generate Title** and gets three options:
> - *"The Silent Office Revolution"*
> - *"Why Your Best Employee Works From a Coffee Shop"*
> - *"Remote Work Isn't a Perk Anymore — It's a Filter"*
>
> He clicks the second one and the note title updates immediately.

---

### 7. Action Items

**What it does:** Scans your note for tasks, to-dos, and commitments and formats them as a `- [ ]` markdown checklist.

**Apply button:** Appends the checklist to the end of your note.

**Scenario:**
> After a brainstorming session, Nadia has ideas and tasks mixed together in one messy note. She clicks **Action Items** and gets:
> ```
> - [ ] Research competitor pricing by Thursday
> - [ ] Schedule call with the design team
> - [ ] Write landing page copy draft
> - [ ] Send invoice to Client A
> ```
> She copies this directly into her task manager.

---

### 8. Analyze Tone

**What it does:** Analyzes the emotional tone and writing style of your note and gives **one specific improvement tip**.

**Apply button:** Appends the analysis as a comment block.

**Scenario:**
> Karan wrote a performance review for a struggling team member. Before submitting, he clicks **Analyze Tone** and reads: *"The tone is firm but fair. However, the second paragraph sounds accusatory rather than constructive. Suggestion: Replace 'you failed to deliver' with 'the deliverable was not completed' to depersonalize the feedback."* He makes the edit.

---

### 9. Hashtags

**What it does:** Generates 8-10 relevant hashtags for your note — useful for categorizing notes or preparing social media posts.

**Apply button:** Appends the hashtags on a new line.

**Scenario:**
> Leila wrote a note about her experience switching from React to Next.js. She clicks **Hashtags** and gets:
> `#nextjs #react #webdev #javascript #frontend #fullstack #devjourney #coding #typescript`
>
> She pastes these into her LinkedIn post when sharing her experience.

---

### 10. Continue Writing

**What it does:** Reads your note and writes the **next natural paragraph** that continues your thoughts in your exact writing style.

**Apply button:** Appends the continuation to the end of your note.

**Scenario:**
> Omar is writing a blog post about productivity systems. He has two strong paragraphs but hits writer's block. He clicks **Continue Writing** and the AI generates a third paragraph in his casual, first-person style that flows naturally from his last sentence. He tweaks one word and keeps writing.

---

## Power Analysis Tools

5 unique features you won't find in any other note app. These go deep.

---

### 11. Blind Spots

**What it does:** Finds what is **missing** from your note — topics you forgot to cover, questions left unanswered, gaps a reader would notice.

**Apply button:** Appends a `--- Blind Spots ---` section.

**Scenario:**
> Yuna wrote a business proposal for a new app. She clicks **Blind Spots** and gets:
> ```
> Missing: No mention of the competitive landscape or existing alternatives
> Unanswered: What is the pricing model after the free trial?
> Gap: No timeline or milestone dates are provided
> Missing: User acquisition strategy is not addressed
> ```
> She addresses each gap before sending the proposal to investors.

---

### 12. First Principles

**What it does:** Applies **Elon Musk / Aristotle-style thinking** to your note — strips all assumptions, identifies the fundamental truths, and rebuilds the idea from scratch.

**Apply button:** Appends a `--- First Principles Analysis ---` section.

**Scenario:**
> Arjun is planning to launch a food delivery startup. He clicks **First Principles** and the AI shows him his hidden assumptions (people want convenience, restaurants want more orders, delivery is the bottleneck). The fundamental truth: *people want good food fast at a fair price*. The rebuilt idea suggests starting with meal prep subscriptions instead of delivery — cutting out the logistics problem entirely.

---

### 13. Devil's Advocate

**What it does:** AI **argues against your own idea** — gives 4 sharp counterarguments and identifies the strongest objection, so you can prepare before someone else raises them.

**Apply button:** Appends a `--- Devil's Advocate ---` section.

**Scenario:**
> Mei wrote a note about her plan to quit her job and freelance full-time. She clicks **Devil's Advocate** and reads four brutal but fair counterarguments — including *"Your current income provides health insurance you haven't accounted for"* and *"Your client pipeline is based on 2 warm contacts, not a repeatable acquisition strategy."* She spends the next week addressing each point before making the leap.

---

### 14. Time Capsule

**What it does:** Rewrites your note as a **message from your future self**, 5 years from now — looking back with wisdom, perspective, and hindsight.

**Apply button:** REPLACES your note content with the time capsule message.

**Scenario:**
> James wrote an anxious note about starting his first job and feeling like an impostor. He clicks **Time Capsule** and reads: *"Looking back, the anxiety you felt on that first week was the same anxiety felt by every person who ever cared about doing good work. The impostor feeling didn't mean you didn't belong — it meant you had high standards. You figured it out. You always do."* He saves it and re-reads it on bad days.

---

### 15. Stress Test

**What it does:** Tries to **break your plan** — identifies the single weakest point, the worst-case scenario, the first warning sign, and the one question you must answer before proceeding.

**Apply button:** Appends a `--- Stress Test Results ---` section.

**Scenario:**
> Sofia is planning to launch an online course in 6 weeks. She clicks **Stress Test** and reads:
> - **Weakest Point:** The timeline assumes content creation takes 2 hours/day but your calendar shows 4 existing commitments that conflict
> - **Worst Case:** You launch with incomplete modules and get refund requests that damage your reputation before you've built it
> - **Early Warning:** If you haven't finished Module 3 by Week 2, the whole timeline collapses
> - **Survival Question:** Do you have 10 people who have already said they will pay, or are you building for hypothetical buyers?
>
> She restructures her plan before writing a single lesson.

---

## Rewrite As

Rewrites your entire note in a different tone while keeping the meaning identical.

**Apply behavior:** REPLACES your entire note content.

| Mode | Best For |
|------|----------|
| **Professional** | Emails to managers, client reports, formal documents |
| **Casual** | Personal notes, friendly messages, informal content |
| **Academic** | Essays, research notes, scholarly writing |
| **Persuasive** | Pitches, proposals, arguments you want to win |
| **Creative** | Blog posts, storytelling, engaging content |

**Scenario:** You wrote a casual complaint about a software bug. Before reporting it, you click **Rewrite As -> Professional** and it becomes a clear, formal bug report with no emotional language.

---

## Translate To

Translates your note to another language. The **original text is kept** and the translation is appended below.

Available languages: Spanish, French, German, Japanese, Chinese, Arabic, Tamil

**Scenario:** You wrote meeting notes in English but your international team reads French. You click **Translate To -> French** and the full translation appears below the original — both in one note.

---

## Chat with Your Note

The chat at the bottom of the AI panel lets you **have a conversation about your note**.

- The AI reads your entire note as context
- Ask any question about the content
- Follow-up questions keep conversation history

**Example questions:**
- *"What are the main topics in this note?"*
- *"What action items are mentioned?"*
- *"Write a follow-up email based on this note"*
- *"What is the strongest argument in this note?"*
- *"What questions does this note leave unanswered?"*
- *"Summarize this in one sentence"*

---

## Tips & Best Practices

**Chain AI actions for maximum power:**
Write rough notes -> Fix Grammar -> Rewrite As Professional -> Generate Title -> Save as .txt
*Result: A polished document in under 60 seconds*

**Use Devil's Advocate before big decisions:**
Write your plan -> Devil's Advocate -> address each objection -> Stress Test -> proceed with confidence

**Beat writer's block:**
Write 1-2 paragraphs -> Continue Writing -> edit the AI paragraph -> repeat until done

**Meeting notes workflow:**
Take messy notes during meeting -> Key Points -> Action Items -> Save as .txt -> share with team

**Prepare before sharing:**
Write draft -> Analyze Tone -> fix tone issues -> Blind Spots -> fill gaps -> Rewrite As Professional

**Understand complex topics:**
Paste dense content -> ELI5 -> First Principles -> Chat: "What am I still missing?"

**Content creation:**
Write ideas -> Expand -> Continue Writing -> Hashtags -> Translate To (for international audience)

---

*NoteGenius AI — Version 1.0 · March 2026 · Open Source · MIT License*
