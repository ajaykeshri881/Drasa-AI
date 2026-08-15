# 🚀 Drasa AI - Comprehensive Architecture & Developer Guide

Drasa AI is a state-of-the-art, multi-modal AI platform designed to deliver a premium, intelligent, and seamless conversational experience. Built on a modern Next.js 16 App Router architecture, it acts as a unified gateway to the world's most powerful AI models, integrating real-time web capabilities, RAG (Retrieval-Augmented Generation), live UI generation, and a tiered subscription system.

This document serves as an exhaustive guide to the Drasa AI codebase, microservices architecture, folder structures, technology stack rationale, and background workers.

---

## 🏗️ System Architecture & Microservices

The application is built on a distributed microservices architecture to ensure scalability, responsiveness, and separation of concerns.

### 1. Main Web Application (Next.js 16)
The primary user-facing monolith handles all real-time interactions, API routes, user authentication, chat streaming, and UI rendering. It directly communicates with AI providers (OpenRouter, Google Generative AI) for synchronous chat requests but delegates heavy, long-running tasks to the Worker Service.

### 2. Background Worker Service (Node.js + BullMQ)
Located in the `worker-service/` directory, this is an independent, headless Node.js microservice. It listens to Redis queues powered by BullMQ. Its purpose is to offload resource-intensive tasks from the main Next.js web server, ensuring the UI remains fast and API routes do not time out.

**Communication Flow:**
`Next.js Web App` ➡ (Enqueues Job) ➡ `Redis` ➡ (Processes Job) ➡ `Worker Service` ➡ (Updates DB/Vector Store)

---

## 🛠️ Complete Tech Stack & "Why We Use It"

### Frontend & Core Framework
* **Next.js 16 (App Router & Turbopack):** Used as the core full-stack framework. The App Router provides nested layouts, Server Components (RSC) for smaller bundle sizes, and seamless API routes. Turbopack is used for ultra-fast local development compiling.
* **React 19:** Leverages the latest React features like View Transitions, `useActionState`, and concurrent rendering for a highly responsive UI.
* **TypeScript:** Enforces strict static typing across the entire codebase, reducing runtime errors and improving developer experience and autocomplete.
* **Tailwind CSS v4:** Utility-first CSS framework used for building the premium, glassmorphic, and dynamic dark-mode user interface without writing custom CSS files.
* **Zustand:** A lightweight, unopinionated state management library used to manage global client-side state (e.g., chat history, UI toggles) without the boilerplate of Redux.
* **Lucide React:** Provides clean, consistent, and customizable SVG icons used throughout the UI.

### AI & Machine Learning
* **Vercel AI SDK (`ai`, `@ai-sdk/*`):** The standard library for building AI apps in React. It provides unified APIs for streaming text, handling tool calls, and managing chat state, allowing us to easily swap between Gemini, OpenAI, and Claude.
* **Google Generative AI (Gemini 3.5 / 3.1):** Used as the primary fallback and high-performance model for reasoning, content generation, and system tasks (like memory extraction).
* **OpenRouter:** A unified API router that gives us access to premium models like Claude 3.5 Sonnet and GPT-4o without needing separate billing for each provider.
* **Pinecone:** A managed Vector Database used for RAG (Retrieval-Augmented Generation). We store user-specific memories and document embeddings here to give the AI long-term memory.

### Backend, Database & Infrastructure
* **MongoDB (via Mongoose):** Our primary NoSQL database. Chosen for its flexible schema design, allowing us to easily store unstructured chat histories, user profiles, and subscription tiers.
* **Redis (Upstash / ioredis):** Used for three critical systems:
  1. **Rate Limiting:** Preventing API abuse using `@upstash/ratelimit`.
  2. **Message Broker:** Powering BullMQ for the worker service.
  3. **Caching:** Storing temporary session data and fast-access configurations.
* **BullMQ:** A robust Redis-based queue system used in the `worker-service` to manage jobs, handle retries, and control concurrency for background tasks.
* **NextAuth.js (Auth.js v5):** Handles secure authentication (Google OAuth). Version 5 is edge-compatible and integrates deeply with Next.js Server Actions and proxy routing.
* **Razorpay:** The payment gateway used to manage our tiered subscription model (Free, Starter, Pro, Ultimate) securely.
* **duck-duck-scrape:** Used by the AI as a tool to perform real-time web searches, allowing it to bypass knowledge cutoff dates and fetch live news.

---

## 📂 Detailed Folder Structure

The codebase is highly modular, following feature-driven development principles.

### Root Directory
* `src/`: Contains the entirety of the Next.js web application.
* `worker-service/`: Contains the independent BullMQ background worker microservice.
* `graphify-out/`: Output directory for codebase knowledge graph analysis.
* `render.yaml` & `Dockerfile.worker`: Deployment configurations for hosting the microservices (e.g., on Render).

### Web Application (`src/`)
* **`app/`**: Next.js App Router routing structure.
  * `(auth)/`: Authentication pages (Login, Register).
  * `(dashboard)/`: User dashboard for managing subscriptions and history.
  * `(marketing)/`: Public-facing landing pages and pricing.
  * `(legal)/`: Terms of Service, Privacy Policy.
  * `admin/`: Protected admin control panel to monitor usage and system health.
  * `api/`: Backend Next.js Route Handlers. Contains webhooks for Razorpay and internal API endpoints.
  * `c/`: The main chat interface routes (e.g., `/c/[chatId]`).
  * `globals.css`: Global Tailwind CSS imports and custom root variables.
  * `proxy.ts`: (Replaces `middleware.ts` in Next 16) Handles route protection, edge-based rate limiting, and auth session verification before rendering pages.
* **`components/`**: Reusable UI components.
  * `chat/`: Input boxes, message bubbles, markdown renderers.
  * `artifacts/`: The Live Website Builder preview iframe and code renderer.
* **`features/`**: Domain-driven feature modules holding specific logic, hooks, and localized components.
  * `admin/`, `artifacts/`, `auth/`, `chat/`, `payments/`, `settings/`.
* **`lib/`**: Core backend business logic and utilities.
  * `ai/`: Contains the **AIGateway** (`gateway/index.ts`) which acts as the brain of the routing system. It detects the required mode (Code, Web, Writing), builds dynamic system prompts, handles tool invocations, and automatically falls back to alternative models if rate-limited.
  * `db/`: MongoDB connection singletons and Mongoose schemas (User, Chat, Message, Subscription).
  * `queue/`: Queue producers (`producers.ts`) that the Next.js app calls to send jobs to the Worker Service.
  * `utils/`, `validations/`, `errors/`, `config/`.
* **`types/`**: Global TypeScript interfaces.

### Worker Service (`worker-service/src/`)
* **`index.ts`**: The main entry point that initializes BullMQ Workers and connects to Redis.
* **`queue/`**: Redis connection configuration.
* **`processors/`**: The actual business logic for background jobs.

---

## 👷 Background Workers Breakdown

The `worker-service` handles tasks that are too slow or memory-intensive for serverless API routes. We utilize four distinct queues:

1. **DocumentWorker (`DocumentQueue`)**:
   * **Purpose:** Processes user-uploaded files (PDFs, Word documents, text).
   * **How it works:** Uses `pdf-parse` and `mammoth` to extract raw text from binary files. Once text is extracted, it formats the data and triggers the EmbeddingWorker to chunk and vectorize it.

2. **MemoryWorker (`MemoryQueue`)**:
   * **Purpose:** Implements long-term RAG memory.
   * **How it works:** Runs asynchronously after a chat session ends. It analyzes the conversation history using a lightweight AI model (e.g., Gemini Flash Lite) to extract key user facts, preferences, and details. These facts are then sent to the EmbeddingWorker.

3. **LongTaskWorker (`LongTaskQueue`)**:
   * **Purpose:** Handles massive AI generation tasks that would normally timeout a standard HTTP request (which usually caps at 30-60 seconds).
   * **How it works:** Used for features like "Full Website Generation", "Deep Web Research", or "Complex Codebase Analysis". It updates the database with a "generating" status, streams the output directly to the DB, and signals the frontend via websockets or polling when complete.

4. **EmbeddingWorker (`EmbeddingQueue`)**:
   * **Purpose:** Generates vector embeddings for RAG.
   * **How it works:** Takes raw text chunks from documents or memory facts, calls an embedding model API, and inserts the resulting high-dimensional vectors into the **Pinecone** database under the user's specific namespace.

---

## ✨ Unique Platform Features

### 🦙 Ollama Integration (100% Local & Offline AI)
Drasa AI provides deep, first-class support for running local AI models using **Ollama**. 
* **Absolute Privacy:** For users dealing with sensitive data, local models execute entirely on their own machine. Data never leaves the browser.
* **Auto-Discovery:** The Next.js frontend actively pings `http://127.0.0.1:11434/api/tags` to automatically discover and list any installed local models in the chat's Model Selector.
* **Offline Capable:** When deployed locally, the entire platform and AI gateway fallback seamlessly to Ollama when the user is disconnected from the internet.
* **Setup Guide:** A dedicated `/ollama` route provides users with step-by-step instructions on downloading, configuring CORS (`OLLAMA_ORIGINS`), and serving models.

### 🛡️ Admin Dashboard & Control Panel
A protected administrative interface (`/admin`) allows platform owners to monitor everything:
* **System Health:** Live tracking of Redis latencies, DB status, and worker queue depths.
* **User Management:** View total users, manage roles, and track token usage per user.
* **Global Configuration:** A dynamic global settings panel to broadcast system-wide alerts, change default AI models, or adjust the underlying system prompts without redeploying the code.

### 💳 Tiered Monetization & Plan Enforcement
Drasa AI features a robust built-in monetization engine using **Razorpay**:
* **Granular Limits:** Enforces hard monthly caps on tokens, messages, and uploaded files depending on the tier (Free, Starter, Pro, Ultimate).
* **Premium AI Access:** Restricts advanced models (like GPT-4o or Claude 3.5 Sonnet) exclusively to higher-tier paid users while gracefully degrading free users to standard models like Gemini Flash.
* **Zero-Leakage:** Checks for subscription limits at the Edge (Next.js middleware) and at the AI Gateway level to prevent prompt injection or billing bypasses.

---

## 💻 Core Website Code Mechanics (How the AI works)

### The AI Gateway (`src/lib/ai/gateway/index.ts`)
When a user sends a message, the request hits the Next.js API, which forwards it to the `AIGateway`. 
1. **Mode Detection:** The system first detects if the prompt is asking for code, a web search, or general chat.
2. **System Prompt Construction:** It dynamically builds a system prompt injecting the user's name, current date, and relevant RAG memory retrieved from Pinecone.
3. **Execution & Fallback:** It attempts to stream a response using the primary model. If OpenRouter fails (e.g., 502 Bad Gateway) or a user hits a rate limit, the `AIGateway` utilizes a `while` loop to automatically failover to backup API keys or a fallback model (like Gemini) completely seamlessly.
4. **Tool Invocations:** If the user asks for current events, the AI calls the `duck-duck-scrape` tool. The backend executes this tool, feeds the search results back to the model, and resumes streaming to the user.

### Live Website Builder (Artifacts)
When the AI is asked to build UI, it wraps the generated code in specialized markdown blocks. The frontend parses these blocks and renders them inside a secure `iframe` using `src/components/artifacts`. It compiles React/Tailwind/Vanilla JS in the browser in real-time, providing a split-pane view (Chat on the left, rendered UI on the right).

---

## 🚀 Development & Setup

### 1. Prerequisites
Ensure you have **Node.js 18+** installed. You need accounts for:
- [OpenRouter](https://openrouter.ai/) & [Google AI Studio](https://aistudio.google.com/) (AI Models)
- [MongoDB Atlas](https://www.mongodb.com/) (Database)
- [Upstash](https://upstash.com/) or local Redis (Caching & Queues)
- [Razorpay](https://razorpay.com/) (Payments)
- [Pinecone](https://www.pinecone.io/) (Vector Database)
- [Google Cloud Console](https://console.cloud.google.com/) (OAuth Login)

### 2. Installation
```bash
git clone https://github.com/yourusername/drasa-ai.git
cd drasa-ai
npm install

# Install worker dependencies
cd worker-service
npm install
cd ..
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` in the root directory. You **must** configure your MongoDB, Redis, Pinecone, and API keys for the platform to run locally.

### 4. Running the Platform Locally
You need two terminal instances to run the full stack:

**Terminal 1 (Next.js Web App):**
```bash
npm run dev
```

**Terminal 2 (BullMQ Worker Service):**
```bash
cd worker-service
npm run dev
```

Navigate to `http://localhost:3000` to start using Drasa AI.

---

## 🛡️ Admin Access
To access the Admin panel:
1. Log in to the application via Google OAuth.
2. Open your MongoDB Atlas dashboard.
3. Locate your user document in the `users` collection.
4. Update the `"role"` field from `"user"` to `"admin"`.
5. Refresh the app and navigate to `/dashboard/admin` (or `/admin` based on routing).

---
*Developed for Drasa AI. All rights reserved.*
