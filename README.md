# Cardia heart disease risk estimate

Cardia is a React and TypeScript frontend backed by a Flask service. The API
uses the saved K-nearest neighbors model, scaler, and feature list in this
repository. It does not store submitted health information.

> This model output is an educational estimate, not a medical diagnosis or
> substitute for advice from a qualified healthcare professional. Do not use
> this application for emergency care.

## Run locally

Requirements: Python 3.10+ and Node.js 20+.

1. Install the API dependencies and start the backend from the repository root:

   ```sh
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   python api.py
   ```

2. In another terminal, start the frontend:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

3. Open the local URL printed by Vite (normally http://localhost:5173).

The Vite development server proxies `/api` and `/health` to the backend at
`http://127.0.0.1:8000`. ## Deploy

Build the static frontend and install the API dependencies during your hosting
platform's build step:

```sh
npm ci --prefix frontend
npm run build --prefix frontend
pip install -r requirements.txt
```

Start the app with:

```sh
waitress-serve --listen=0.0.0.0:8000 api:app
```

The API serves the compiled frontend from `frontend/dist` when it is present.
Configure the host to use `/health` as its health-check path and bind Waitress
to the port required by your hosting platform. Provide Python 3.10 or later
plus Node.js 20 or later for the build step.

## Prediction API

`POST /api/predict` takes JSON fields `age`, `sex`, `chest_pain_type`,
`resting_bp`, `cholesterol`, `fasting_bs`, `resting_ecg`, `max_hr`,
`exercise_angina`, `oldpeak`, and `st_slope`. The API validates the input,
reproduces the model's one-hot feature columns in the saved order, scales the
values, and returns a binary prediction and a human-readable label.

The scikit-learn dependency is pinned to 1.6.1 to match the serialized model
artifacts.
