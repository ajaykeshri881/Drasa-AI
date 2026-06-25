# Drasa AI - Product Requirements Document (PRD)

## 1. Project Overview
**Drasa AI** is a state-of-the-art, multi-modal AI platform designed to deliver a premium, intelligent, and seamless conversational experience. The platform acts as a unified gateway to powerful AI models (e.g., Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) and provides advanced capabilities like live website building, document parsing, and web search.

## 2. Target Audience
- Developers and designers seeking rapid prototyping via AI.
- Writers and researchers needing advanced content generation and web scraping/search capabilities.
- Power users looking for a centralized hub for top-tier AI models with a premium user experience.

## 3. Core Features & Functional Requirements

### 3.1 AI Gateway & Routing
- **Multi-Model Support:** Integrate with multiple AI providers (OpenRouter, Google Generative AI).
- **Dynamic Routing:** Automatically route prompts to specific models based on the user's subscription tier.
- **Intelligent Modes:** Provide distinct operation modes:
  - `Code`: Optimized for programming tasks.
  - `Writing`: Optimized for prose and content creation.
  - `Web Search`: Capability to search the web for real-time information (via `duck-duck-scrape`).
  - `Vision`: Image analysis and understanding.
  - `Auto`: Automatic detection of intent to route to the best system prompt.
- **RAG Capabilities:** Support retrieval-augmented generation using vector databases (Pinecone).

### 3.2 Live Website Builder
- **Code Generation:** AI generates HTML, Tailwind CSS, and Vanilla JavaScript.
- **Live Preview:** Real-time rendering of generated code in a secure, sandboxed split-pane iframe.

### 3.3 Document Processing
- **File Parsing:** Ability to upload and extract text from standard document formats:
  - PDFs (via `pdf-parse`)
  - Word Documents (via `mammoth`)
- **Background Processing:** Utilize message queues (`BullMQ`, `ioredis`) for heavy document processing or background jobs.

### 3.4 User Authentication & Profiles
- **OAuth Integration:** Frictionless sign-in using Google OAuth via `NextAuth.js`.
- **Chat History:** Persistent storage of user conversations and generated artifacts in MongoDB.


### 3.5 Subscription & Monetization
- **Tiers:** Free, Pro, and Ultimate subscription plans.
- **Payment Gateway:** Integration with `Razorpay` for subscription handling.
- **Access Control:** Restrict premium AI models and higher rate limits to paying users.

### 3.6 Admin Dashboard
- **Monitoring:** View active users and platform usage.
- **Management:** Manage AI model configurations and user roles.
- **Alerts:** Broadcast system-wide alerts to users.

## 4. Non-Functional Requirements

### 4.1 UI/UX & Aesthetics
- **Premium Design:** A modern, glassmorphic UI prioritizing a dark-mode first aesthetic.
- **Responsiveness:** Flawless experience across desktop, tablet, and mobile devices.
- **Micro-animations:** Smooth transitions and interactions (using `tailwindcss-animate`).

### 4.2 Performance & Scalability
- **Framework:** Next.js 15 using the App Router and Turbopack for optimal load times and SEO.
- **Caching & Rate Limiting:** Redis implementation to handle high traffic and prevent API abuse.
- **Background Workers:** Dedicated worker processes for asynchronous tasks to keep the main event loop unblocked.

### 4.3 Security
- **Sandboxed Rendering:** Secure isolation for the Live Website Builder preview.
- **Protected Routes:** Ensure Admin and Subscription-only features are strictly access-controlled.

## 5. Technology Stack

### Frontend & UI
- **Framework:** Next.js 15 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Components:** Base UI, Lucide React (Icons)
- **State Management:** Zustand
- **Markdown Rendering:** `react-markdown`, `rehype-highlight`, `remark-gfm`

### Backend & AI Orchestration
- **Runtime/Environment:** Node.js
- **AI Integration:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`)
- **Queue System:** BullMQ
- **Scraping:** `duck-duck-scrape`
- **Validation:** Zod

### Data Storage
- **Primary Database:** MongoDB (via Mongoose)
- **Caching / Key-Value:** Redis (via ioredis)
- **Vector Database:** Pinecone

### Third-Party Services
- **Authentication:** NextAuth.js (Auth.js v5)
- **Payments:** Razorpay
