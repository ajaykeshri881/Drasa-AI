# 🚀 Drasa AI

Drasa AI is a state-of-the-art, multi-modal AI platform designed to deliver a premium, intelligent, and seamless conversational experience. Built on a modern Next.js 15 App Router architecture, it acts as a unified gateway to the world's most powerful AI models, including Claude 3.5 Sonnet, GPT-4o, and Gemini 1.5 Pro.

---

## 📖 What We Are Building In-Depth

Drasa AI is more than just a chat interface; it is an intelligent, multi-modal AI orchestrator and workspace. We are building a centralized hub that abstract away the complexities of dealing with different AI providers while offering specialized tools for distinct workflows:

1. **Intelligent AI Gateway**: A core system that routes user requests to the most optimal AI model. It features an `Auto` mode detector that analyzes prompt intent (e.g., coding, writing, web search, reasoning) and adjusts the system prompt accordingly. It also includes automatic fallback mechanisms (e.g., if OpenRouter fails, it falls back to a Google Gemini model).
2. **Live Website Builder**: A standout feature that allows users to prompt the AI to build UI components or full single-page websites. The AI generates HTML, Tailwind CSS, and Vanilla JavaScript, which is instantly rendered in a secure, sandboxed split-pane preview window.
3. **Advanced Memory & RAG**: The platform utilizes both MongoDB and Vector Databases (Pinecone/Redis) to provide long-term semantic memory. When a user asks the AI to remember something, it uses tools to store this fact, which is semantically retrieved in future conversations to provide hyper-personalized responses.
4. **Real-time Web Capabilities**: Integrated with `duck-duck-scrape`, the AI can dynamically search the web for up-to-date information, news, or factual queries to avoid hallucinations on recent events.
5. **Tiered Monetization System**: A fully integrated subscription model (via Razorpay) offering Free, Starter, Pro, and Ultimate tiers. The platform enforces strict monthly token limits and restricts premium tier models to paying users.

---

## ✨ Core Features

* **Multi-Modal AI Gateway:** Dynamically routes prompts to OpenRouter or Google Generative AI based on the user's subscription tier.
* **Live Website Builder:** Instantly render AI-generated UI in a secure iframe.
* **Intelligent AI Modes:** Select between Code, Writing, Web Search, Vision, Reasoning, or `Auto`.
* **Premium Dark-Mode Interface:** A meticulously crafted, glassmorphic UI built with Tailwind CSS.
* **Subscription & Monetization:** Integrated with Razorpay.
* **Admin Dashboard:** Control panel to monitor users, manage AI models, and broadcast system alerts.
* **Persistent Storage:** MongoDB (Mongoose) and Redis (ioredis) for chat histories, usage limits, and vector memory.
* **Secure Authentication:** NextAuth.js (Auth.js) integration featuring Google OAuth.

---

## 🛠️ Tech Stack

* **Frontend & Backend Framework:** Next.js 15 (App Router, Turbopack, React 19)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Lucide React Icons + Base UI
* **AI Orchestration:** Vercel AI SDK
* **Database:** MongoDB (via Mongoose)
* **Caching, Queues & Rate Limiting:** Redis (via ioredis), BullMQ
* **Authentication:** NextAuth.js (Auth.js v5)
* **Payments:** Razorpay
* **State Management:** Zustand

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed. You need accounts for:
- [OpenRouter](https://openrouter.ai/) (For Claude, GPT-4o, Gemma)
- [Google AI Studio](https://aistudio.google.com/) (For Gemini)
- [MongoDB Atlas](https://www.mongodb.com/) (Database)
- [Upstash](https://upstash.com/) or local Redis (Caching & Queues)
- [Razorpay](https://razorpay.com/) (Payments)
- [Google Cloud Console](https://console.cloud.google.com/) (OAuth Login)

### 2. Installation
```bash
git clone https://github.com/yourusername/drasa-ai.git
cd drasa-ai
npm install
```

### 3. Environment Variables
```bash
cp .env.example .env.local
```
Configure your API keys in `.env.local`. **This is strictly required for the platform to function.**

### 4. Running the Server & Workers
Start the development server:
```bash
npm run dev
```
Start the background worker (for background memory extraction):
```bash
npm run worker
```
Navigate to `http://localhost:3000`.

---

## 🏗️ Project Structure

```text
src/
├── app/                  # Next.js 15 App Router pages & API routes
│   ├── (admin)/          # Protected Admin Panel routes
│   ├── (marketing)/      # Public pages (Pricing, etc.)
│   ├── api/              # Backend endpoints (Chat, Payments, Admin, Workers)
│   └── page.tsx          # Main Chat Interface
├── components/           # Reusable React components
│   ├── chat/             # Chat UI, Message Bubbles, Inputs
│   ├── artifacts/        # Live Website Builder & Preview iframe
│   └── layout/           # Sidebars, Navbars, Split Panes
├── lib/                  # Core Business Logic
│   ├── ai/               # AI Gateway, Model Routing, Prompt Builder, Memory
│   ├── auth/             # NextAuth.js Configuration
│   ├── db/               # MongoDB Connection & Schemas
│   ├── queue/            # BullMQ background jobs
│   └── payments/         # Razorpay SDK Integration
├── store/                # Zustand Global State Management
└── workers/              # Background worker entry points
```

---

## 🛡️ Admin Access
To access the Admin panel:
1. Log in via Google.
2. Open your MongoDB database.
3. Update your user document in the `users` collection: `"role": "admin"`.
4. Refresh and navigate to `/dashboard`.

---

## 📄 License
This project is proprietary software developed for Drasa AI. All rights reserved.
