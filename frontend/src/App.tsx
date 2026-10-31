import { FormEvent, useEffect, useState } from "react";

type FormValues = {
  age: number;
  sex: "M" | "F";
  chest_pain_type: "ATA" | "NAP" | "TA" | "ASY";
  resting_bp: number;
  cholesterol: number;
  fasting_bs: 0 | 1;
  resting_ecg: "Normal" | "ST" | "LVH";
  max_hr: number;
  exercise_angina: "Y" | "N";
  oldpeak: number;
  st_slope: "Up" | "Flat" | "Down";
};

type PredictionResult = {
  prediction: 0 | 1;
  label: "Low risk" | "High risk";
};

const initialValues: FormValues = {
  age: 40,
  sex: "M",
  chest_pain_type: "ATA",
  resting_bp: 120,
  cholesterol: 200,
  fasting_bs: 0,
  resting_ecg: "Normal",
  max_hr: 150,
  exercise_angina: "N",
  oldpeak: 1,
  st_slope: "Up",
};

function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("cardia-theme");
    return savedTheme
      ? savedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [values, setValues] = useState<FormValues>(initialValues);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("cardia-theme", isDark ? "dark" : "light");
  }, [isDark]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const detail: unknown = await response.json().catch(() => null);
        const errorDetail =
          typeof detail === "object" && detail !== null && "detail" in detail
            ? detail.detail
            : null;
        const validationMessage =
          Array.isArray(errorDetail) &&
          typeof errorDetail[0] === "object" &&
          errorDetail[0] !== null &&
          "msg" in errorDetail[0] &&
          typeof errorDetail[0].msg === "string"
            ? errorDetail[0].msg
            : null;
        const message =
          typeof errorDetail === "string"
            ? errorDetail
            : validationMessage ??
              "The prediction could not be completed. Please try again.";
        throw new Error(message);
      }

      setResult((await response.json()) as PredictionResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the prediction service. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Cardia home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 27s-10.5-6.2-10.5-14a5.8 5.8 0 0 1 10.5-3.4A5.8 5.8 0 0 1 26.5 13C26.5 20.8 16 27 16 27Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 16h4l2-4 3.2 8 2.1-4h3.7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>cardia<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-actions">
          <span className="topbar-note"><span className="live-dot" /> Private health check</span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            aria-pressed={isDark}
            onClick={() => setIsDark((current) => !current)}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> A little more insight</div>
          <h1>Understand your<br /><em>heart health.</em></h1>
          <p>
            Share a few health measurements to see an estimate from our
            heart-health model.
          </p>
          <div className="hero-note">
            <span className="note-icon" aria-hidden="true">i</span>
            <span>Your answers are used only to generate this estimate.</span>
          </div>
        </div>

        <aside className="hero-art" aria-label="Heart health illustration">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-center">
            <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
              <path
                d="M60 101S19 77 19 46a22 22 0 0 1 41-11 22 22 0 0 1 41 11c0 31-41 55-41 55Z"
                fill="var(--art-heart-fill)"
                stroke="var(--art-heart-stroke)"
                strokeWidth="2"
              />
              <path
                d="M32 59h18l8-16 13 34 8-18h12"
                stroke="var(--green)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="art-caption">YOUR WELLBEING, IN FOCUS</span>
          <span className="art-sparkle sparkle-one">✳</span>
          <span className="art-sparkle sparkle-two">✳</span>
        </aside>
      </section>

      <section className="form-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">YOUR DETAILS</span>
            <h2>About your heart</h2>
          </div>
          <span className="step-label">11 DETAILS <span>·</span> ABOUT 2 MIN</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Age <small>years</small></span>
              <input type="number" min="18" max="100" value={values.age}
                onChange={(event) => update("age", Number(event.target.value))} required />
            </label>
            <label className="field">
              <span>Sex</span>
              <select value={values.sex} onChange={(event) => update("sex", event.target.value as FormValues["sex"])}>
                <option value="M">Male</option><option value="F">Female</option>
              </select>
            </label>
            <label className="field field-wide">
              <span>Chest pain type</span>
              <select value={values.chest_pain_type} onChange={(event) => update("chest_pain_type", event.target.value as FormValues["chest_pain_type"])}>
                <option value="ATA">Atypical angina</option>
                <option value="NAP">Non-anginal pain</option>
                <option value="TA">Typical angina</option>
                <option value="ASY">Asymptomatic</option>
              </select>
            </label>
            <label className="field">
              <span>Resting blood pressure <small>mm Hg</small></span>
              <input type="number" min="80" max="200" value={values.resting_bp}
                onChange={(event) => update("resting_bp", Number(event.target.value))} required />
            </label>
            <label className="field">
              <span>Cholesterol <small>mg/dL</small></span>
              <input type="number" min="100" max="600" value={values.cholesterol}
                onChange={(event) => update("cholesterol", Number(event.target.value))} required />
            </label>
            <label className="field">
              <span>Fasting blood sugar above 120?</span>
              <select value={values.fasting_bs} onChange={(event) => update("fasting_bs", Number(event.target.value) as 0 | 1)}>
                <option value={0}>No</option><option value={1}>Yes</option>
              </select>
            </label>
            <label className="field">
              <span>Resting ECG</span>
              <select value={values.resting_ecg} onChange={(event) => update("resting_ecg", event.target.value as FormValues["resting_ecg"])}>
                <option value="Normal">Normal</option><option value="ST">ST</option><option value="LVH">LVH</option>
              </select>
            </label>
            <label className="field">
              <span>Maximum heart rate <small>bpm</small></span>
              <input type="number" min="60" max="220" value={values.max_hr}
                onChange={(event) => update("max_hr", Number(event.target.value))} required />
            </label>
            <label className="field">
              <span>Exercise-induced angina</span>
              <select value={values.exercise_angina} onChange={(event) => update("exercise_angina", event.target.value as FormValues["exercise_angina"])}>
                <option value="N">No</option><option value="Y">Yes</option>
              </select>
            </label>
            <label className="field">
              <span>Oldpeak <small>ST depression</small></span>
              <input type="number" min="0" max="6" step="0.1" value={values.oldpeak}
                onChange={(event) => update("oldpeak", Number(event.target.value))} required />
            </label>
            <label className="field">
              <span>ST slope</span>
              <select value={values.st_slope} onChange={(event) => update("st_slope", event.target.value as FormValues["st_slope"])}>
                <option value="Up">Up</option><option value="Flat">Flat</option><option value="Down">Down</option>
              </select>
            </label>
          </div>

          {error && <div className="message error-message" role="alert">{error}</div>}
          {result && (
            <div className={`message result-message ${result.prediction === 1 ? "high-risk" : "low-risk"}`} role="status">
              <span className="result-symbol" aria-hidden="true">{result.prediction === 1 ? "!" : "✓"}</span>
              <div>
                <strong>{result.label} estimate</strong>
                <p>{result.prediction === 1
                  ? "The model identified indicators associated with higher risk. Consider discussing your results with a healthcare professional."
                  : "The model did not identify a higher-risk pattern in these answers. Keep up with regular check-ups."
                }</p>
              </div>
            </div>
          )}

          <div className="form-footer">
            <p><span aria-hidden="true">✳</span> This estimate is not a diagnosis or a substitute for medical advice.</p>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Checking..." : "Get my estimate"}
              {!isSubmitting && <span aria-hidden="true">↗</span>}
            </button>
          </div>
        </form>
      </section>

      <footer className="page-footer">
        <span>Made for more informed conversations.</span>
        <span>Not for emergency use · Always consult a clinician</span>
      </footer>
    </main>
  );
}

export default App;
