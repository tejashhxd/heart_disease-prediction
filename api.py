import os
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory


ROOT_DIR = Path(__file__).resolve().parent
MODEL = joblib.load(ROOT_DIR / "knn_heart_model.pkl")
SCALER = joblib.load(ROOT_DIR / "heart_scaler.pkl")
EXPECTED_COLUMNS = joblib.load(ROOT_DIR / "heart_columns.pkl")
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

REQUIRED_COLUMNS = {
    "Age",
    "RestingBP",
    "Cholesterol",
    "FastingBS",
    "MaxHR",
    "Oldpeak",
    "Sex_M",
    "ChestPainType_ATA",
    "ChestPainType_NAP",
    "ChestPainType_TA",
    "RestingECG_Normal",
    "RestingECG_ST",
    "ExerciseAngina_Y",
    "ST_Slope_Flat",
    "ST_Slope_Up",
}
if set(EXPECTED_COLUMNS) != REQUIRED_COLUMNS:
    raise RuntimeError("The saved model feature columns do not match the prediction API.")

FIELD_RULES: dict[str, dict[str, Any]] = {
    "age": {"type": int, "minimum": 18, "maximum": 100},
    "sex": {"choices": {"M", "F"}},
    "chest_pain_type": {"choices": {"ATA", "NAP", "TA", "ASY"}},
    "resting_bp": {"type": int, "minimum": 80, "maximum": 200},
    "cholesterol": {"type": int, "minimum": 100, "maximum": 600},
    "fasting_bs": {"choices": {0, 1}},
    "resting_ecg": {"choices": {"Normal", "ST", "LVH"}},
    "max_hr": {"type": int, "minimum": 60, "maximum": 220},
    "exercise_angina": {"choices": {"Y", "N"}},
    "oldpeak": {"type": (int, float), "minimum": 0, "maximum": 6},
    "st_slope": {"choices": {"Up", "Flat", "Down"}},
}

app = Flask(__name__, static_folder=None)


def validate_input(data: Any) -> tuple[dict[str, Any] | None, list[dict[str, str]]]:
    if not isinstance(data, dict):
        return None, [{"msg": "Request body must be a JSON object."}]

    errors = []
    for field, rules in FIELD_RULES.items():
        if field not in data:
            errors.append({"msg": f"Field required: {field}"})
            continue

        value = data[field]
        expected_type = rules.get("type")
        if expected_type is not None and (
            not isinstance(value, expected_type)
            or isinstance(value, bool)
        ):
            errors.append({"msg": f"{field} has an invalid value."})
            continue

        choices = rules.get("choices")
        if choices is not None and (
            isinstance(value, bool)
            or not isinstance(value, (str, int))
            or value not in choices
        ):
            errors.append({"msg": f"{field} has an invalid value."})
            continue

        if "minimum" in rules and not rules["minimum"] <= value <= rules["maximum"]:
            errors.append(
                {
                    "msg": (
                        f"{field} must be between {rules['minimum']} "
                        f"and {rules['maximum']}."
                    )
                }
            )

    return (data, []) if not errors else (None, errors)


@app.get("/health")
def health():
    return jsonify(status="ok")


@app.post("/api/predict")
def predict():
    data = request.get_json(silent=True)
    validated_data, errors = validate_input(data)
    if errors:
        return jsonify(detail=errors), 422

    row = {column: 0 for column in EXPECTED_COLUMNS}
    row.update(
        {
            "Age": validated_data["age"],
            "RestingBP": validated_data["resting_bp"],
            "Cholesterol": validated_data["cholesterol"],
            "FastingBS": validated_data["fasting_bs"],
            "MaxHR": validated_data["max_hr"],
            "Oldpeak": validated_data["oldpeak"],
            f"Sex_{validated_data['sex']}": 1,
            f"ChestPainType_{validated_data['chest_pain_type']}": 1,
            f"RestingECG_{validated_data['resting_ecg']}": 1,
            f"ExerciseAngina_{validated_data['exercise_angina']}": 1,
            f"ST_Slope_{validated_data['st_slope']}": 1,
        }
    )
    input_frame = pd.DataFrame([row], columns=EXPECTED_COLUMNS)
    scaled_input = SCALER.transform(input_frame)
    prediction = int(MODEL.predict(scaled_input)[0])
    return jsonify(
        prediction=prediction,
        label="High risk" if prediction == 1 else "Low risk",
    )


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path: str):
    if not FRONTEND_DIST.is_dir():
        return jsonify(
            message="API is running. Start the frontend with `npm run dev` in the frontend directory."
        )

    requested_file = FRONTEND_DIST / path
    if path and requested_file.is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        debug=False,
    )
