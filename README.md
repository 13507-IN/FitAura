# FitAura - AI Personal Stylist MVP

FitAura is a starter full-stack MVP where users upload a photo, choose an occasion, and receive outfit + grooming suggestions.

## Tech Stack

- Frontend: Next.js (App Router, TypeScript)
- Backend: Node.js + Express
- AI integration: MediaPipe-backed TFJS models, TensorFlow.js (CPU backend), Gemini Vision API

## Project Structure

```text
AuraFit/
  frontend/
    app/
      globals.css
      layout.tsx
      page.tsx
      upload/page.tsx
      result/page.tsx
    lib/
      api.ts
      storage.ts
    types/
      index.ts
    package.json
    tsconfig.json
    next.config.js
    next-env.d.ts
  backend/
    src/
      app.js
      server.js
      routes/analyzeRoutes.js
      controllers/analyzeController.js
      middleware/errorHandler.js
      services/aiPipeline.js
      services/recommender.js
      services/ml/imagePreprocess.js
      services/providers/geminiClient.js
      services/detectors/faceDetector.js
      services/detectors/bodyDetector.js
      services/detectors/colorDetector.js
      utils/constants.js
      utils/hash.js
    .env.example
    package.json
```

## Setup

1. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment:

```bash
cd backend
cp .env.example .env
cd ../frontend
cp .env.local.example .env.local
```

You can optionally set `GEMINI_API_KEY` for real Gemini calls.
The backend uses pure TensorFlow.js CPU backend (no native `tfjs-node` compile step) with MediaPipe-backed TFJS models for face/body inference, and a guarded Gemini JSON prompt flow.

3. Run backend:

```bash
cd backend
npm run dev
```

4. Run frontend:

```bash
cd frontend
npm run dev
```

5. Open `http://localhost:3000`.

## API Endpoints

- `POST /api/analyze` (multipart/form-data)
  - `image`: file
  - `occasion`: `College | Interview | Date | Party | Wedding | Casual Hangout | Travel`
  - `styleVibe`: optional `Minimal | Streetwear | Classy | Ethnic | Sporty`
- `POST /api/regenerate` (application/json)
  - `occasion`
  - `styleVibe`
  - `basePalette`: optional color array

## What To Do Next

1. Improve model quality and calibration:
   - Tune face-shape heuristics with a labeled validation set.
   - Replace pose-based silhouette rules with segmentation + body ratio features.
2. Move image processing to an async worker queue for scale (BullMQ + Redis).
3. Iterate Gemini prompt templates and add telemetry-based prompt tuning.
4. Persist results in a DB (PostgreSQL) and add user auth/session history.
5. Add test coverage:
   - Backend API tests (Jest/Supertest).
   - Frontend flow tests (Playwright).
6. Add observability (request logs, error tracking, latency metrics).
