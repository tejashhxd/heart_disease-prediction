# Cardia — Heart Health Estimate

Cardia is a responsive web app that sends user-provided health measurements to
a saved machine-learning model and displays its heart disease risk estimate.
It has a React and TypeScript frontend and a Flask API, and is deployed on
Render.

## Live app

**Try Cardia:** [https://cardia-faj4.onrender.com/](https://cardia-faj4.onrender.com/)

## Important health information

> Cardia provides an educational estimate only. It is not a diagnosis, medical
> advice, or a substitute for care from a qualified healthcare professional.
> Do not use it to make medical decisions or for emergency care. If you have
> urgent symptoms, contact your local emergency services.

The app does not intentionally save submitted health information. Predictions
depend on the model and its training data and may be inaccurate or unsuitable
for an individual.

## Features

- Responsive React and TypeScript interface with light and dark themes.
- Validated form for the health measurements expected by the model.
- Flask API that prepares, scales, and classifies each submitted record.
- Serves the built frontend and prediction API from the same web service.
- No application database or user accounts.

## How predictions work

1. The form collects age, sex, chest pain type, resting blood pressure,
   cholesterol, fasting blood sugar, resting ECG, maximum heart rate,
   exercise-induced angina, ST depression (`Oldpeak`), and ST slope.
2. The frontend sends these values as JSON to `POST /api/predict`.
3. Flask validates the values, converts categorical inputs into the model's
   expected one-hot encoded columns, and orders features using the saved
   feature list.
4. The saved scaler transforms the input before the K-nearest neighbors
   classifier predicts class `0` or `1`.
5. The API returns the prediction and a `Low risk` or `High risk` label.

This is a binary model output, not a clinical risk score or probability.

## Technology

- **Frontend:** React, TypeScript, Vite, CSS
- **Backend:** Python, Flask, Gunicorn
- **Model:** scikit-learn `KNeighborsClassifier` with a saved
  `StandardScaler`
- **Hosting:** Render Web Service

## Run locally

Requirements: Python 3.10+ and Node.js 20+.

### 1. Start the Flask API

From the repository root:

```sh
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```sh
# macOS/Linux
source .venv/bin/activate
```

Then install the dependencies and start Flask:

```sh
pip install -r requirements.txt
python api.py
```

The API listens at `http://127.0.0.1:8000`. Its health endpoint is
`http://127.0.0.1:8000/health`.

### 2. Start the frontend

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (normally
[`http://localhost:5173`](http://localhost:5173)). Vite proxies `/api` and
`/health` requests to the Flask API at `http://127.0.0.1:8000`.

To create a production frontend build locally:

```sh
cd frontend
npm run build
```

The built files are written to `frontend/dist`.

## Render deployment

The live service is available at
[https://cardia-faj4.onrender.com/](https://cardia-faj4.onrender.com/).

For a Render **Web Service**, configure:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Build command | `npm ci --prefix frontend && npm run build --prefix frontend && pip install -r requirements.txt` |
| Start command | `gunicorn api:app --bind 0.0.0.0:$PORT` |
| Health check path | `/health` |

Build the React app before starting Flask so that the API can serve the
compiled frontend from `frontend/dist`. Render's Linux environment uses
Gunicorn as the production WSGI server; `python api.py` is intended for local
development.

## Prediction API

### `POST /api/predict`

Content type: `application/json`.

Example request:

```json
{
  "age": 40,
  "sex": "M",
  "chest_pain_type": "ATA",
  "resting_bp": 120,
  "cholesterol": 200,
  "fasting_bs": 0,
  "resting_ecg": "Normal",
  "max_hr": 150,
  "exercise_angina": "N",
  "oldpeak": 1.0,
  "st_slope": "Up"
}
```

Successful response:

```json
{
  "prediction": 0,
  "label": "Low risk"
}
```

`prediction` is `0` or `1`; `label` is `Low risk` or `High risk`. Invalid or
out-of-range inputs return HTTP `422` with validation details.

### `GET /health`

Returns `{"status":"ok"}` when the web service is running.

## Model files

- `knn_heart_model.pkl` — trained K-nearest neighbors classifier
- `heart_scaler.pkl` — fitted feature scaler
- `heart_columns.pkl` — expected model feature names and order

The scikit-learn version is pinned to `1.6.1` in `requirements.txt` to match
the version used to save the model artifacts. The repository does not include
the original training dataset or training code.
