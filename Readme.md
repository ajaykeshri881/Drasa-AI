# 🚀 Drasa AI

Drasa AI is a state-of-the-art, multi-modal AI platform designed to deliver a premium, intelligent, and seamless conversational experience. Built on a modern Next.js 15 App Router architecture, it acts as a unified gateway to the world's most powerful AI models.

---

## ✨ Core Features

* **Multi-Modal AI Gateway:** Dynamically routes prompts to OpenRouter or Google Generative AI based on the user's subscription tier.
* **Live Website Builder:** Ask the AI to build a website, and watch it render instantly in a secure, sandboxed split-pane preview window using HTML, Tailwind CSS, and Vanilla JS.
* **Intelligent AI Modes:** Select between Code, Writing, Web Search, Vision, or let the `Auto` detector automatically choose the best system prompt for your query.
* **Premium Dark-Mode Interface:** A meticulously crafted, glassmorphic UI built with Tailwind CSS, featuring smooth micro-animations and a highly responsive design.
* **Subscription & Monetization:** Integrated with Razorpay to offer Free, Pro, and Ultimate tiers, restricting premium models to paying users.
* **Admin Dashboard:** A secured control panel to monitor active users, manage AI models, and broadcast system alerts.
* **Persistent Storage:** MongoDB (Mongoose) and Redis (ioredis) integration for permanent chat histories, usage limits, and user profile management.
* **Secure Authentication:** NextAuth.js (Auth.js) integration featuring Google OAuth for frictionless sign-ins.

---

## 🛠️ Tech Stack

* **Frontend & Backend Framework:** Next.js 15 (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Lucide React Icons
* **AI Orchestration:** Vercel AI SDK
* **Database:** MongoDB (via Mongoose)
* **Caching & Rate Limiting:** Redis (via ioredis)
* **Authentication:** NextAuth.js (Auth.js v5)
* **Payments:** Razorpay

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed on your machine. You will also need accounts for:
- [OpenRouter](https://openrouter.ai/) (For Claude, GPT-4o, Gemma)
- [Google AI Studio](https://aistudio.google.com/) (For Gemini)
- [MongoDB Atlas](https://www.mongodb.com/) (For database)
- [Upstash](https://upstash.com/) or local Redis (For caching)
- [Razorpay](https://razorpay.com/) (For payments)
- [Google Cloud Console](https://console.cloud.google.com/) (For OAuth Login)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/yourusername/drasa-ai.git
cd "drasa-ai"
npm install
```

### 3. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env.local
```
Open `.env.local` and configure your API keys. **Do not skip this step, or the platform will not function correctly.**

### 4. Running the Development Server
Start the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

---

## 🏗️ Project Structure

```text
src/
├── app/                  # Next.js 15 App Router pages & API routes
│   ├── (admin)/          # Protected Admin Panel routes
│   ├── (marketing)/      # Public pages (Pricing, etc.)
│   ├── api/              # Backend endpoints (Chat, Payments)
│   └── page.tsx          # Main Chat Interface
├── components/           # Reusable React components
│   ├── chat/             # Chat UI, Message Bubbles, Inputs
│   ├── artifacts/        # Live Website Builder & Preview iframe
│   └── layout/           # Sidebars, Navbars, Split Panes
├── lib/                  # Core Business Logic
│   ├── ai/               # AI Gateway, Model Routing, Prompt Builder
│   ├── auth/             # NextAuth.js Configuration
│   ├── db/               # MongoDB Connection & Schemas
│   └── payments/         # Razorpay SDK Integration
└── store/                # Zustand Global State Management
```

---

## 🛡️ Admin Access
To access the Admin panel, your account role must be set to `admin`. 
1. Log in normally via Google.
2. Open your MongoDB database.
3. Find your user document in the `users` collection and change `"role": "user"` to `"role": "admin"`.
4. Refresh the page and navigate to `http://localhost:3000/dashboard`.

---

## 📄 License
This project is proprietary software developed for Drasa AI. All rights reserved.
