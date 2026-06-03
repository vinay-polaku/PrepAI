# PrepAI – AI Interview Preparation Agent

PrepAI is a modern, responsive web application that generates personalized interview preparation plans (including role analysis, key skills, technical/behavioral questions, resume audits, and elevator pitch prompts) from a job description.

It is designed to run serverless on **Vercel** utilizing the **Gemini API** on the backend, while keeping **Ollama** as an optional offline/local engine.

---

## Features

- **Gemini API Integration:** Calls `/api/generate` securely, hiding the API Key on the server-side.
- **Optional Local Ollama Support:** Connects directly to local models (e.g. `gemma3`, `gemma:2b`) running on your machine for complete privacy and offline capability.
- **Tailored Prep Kits:** Generates specialized question-and-answer templates, ATS resume keywords, and speech-ready elevator pitches.
- **Built-in Teleprompter:** Practice your elevator pitch with a custom speed and font size-adjustable teleprompter.
- **Responsive Dashboard:** Modern glassmorphism UI styled with pure CSS.

---

## Setup & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes with Node.js)

### 2. Install Dependencies
Clone/navigate to your project folder and run:
```bash
npm install
```
This prepares the project dependencies.

### 3. Configure Environment Variables
Create a file named `.env` in the root directory of your project:
```bash
touch .env
```
Open `.env` and add your Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note:** Get your Gemini API Key from Google AI Studio.

---

## Local Development

To run the full app locally (including the backend API route):
```bash
npm run dev
```
This starts the local Node.js server (at `http://localhost:3000`) using `server.js`. It serves the frontend static assets and emulates the `/api/generate` endpoint locally (loading environment variables from `.env`) without requiring any Vercel credentials or login.

---

## Deployment on Vercel

PrepAI is ready to deploy directly to Vercel:

### Option A: Deployment via Vercel CLI (Recommended)
1. Run `npx vercel` to login and prepare the project.
2. Link the project and deploy it.
3. Configure the `GEMINI_API_KEY` environment variable in Vercel:
   ```bash
   npx vercel env add GEMINI_API_KEY
   ```
4. Push a production deployment:
   ```bash
   npx vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard
1. Push your repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Under **Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: `your_actual_gemini_api_key`
4. Click **Deploy**.

---

## Optional: Offline Ollama Mode Setup

If you prefer to run completely locally and offline without the Gemini API:

1. **Install Ollama:** Download and install from [ollama.com](https://ollama.com).
2. **Download Model:** Download the model of choice, e.g., Gemma 3:
   ```bash
   ollama pull gemma3
   ```
3. **Start Ollama:** Ensure the local Ollama server is running (usually started automatically, or via `ollama serve`).
4. **Configure PrepAI:**
   - Open the **Settings & API** panel in the PrepAI dashboard.
   - Select **Ollama Local AI** as your generation engine.
   - Check that the Server URL is set to `http://localhost:11434` and the Model matches the tag you pulled (e.g. `gemma3` or `gemma4:latest`).
   - Click **Save Configurations**.
