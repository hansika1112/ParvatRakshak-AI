import joblib
import pandas as pd


MODEL_FILE = "ml_model/models/xgboost_model.joblib"

FEATURES = [
    "elevation",
    "slope",
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d",
    "temperature",
    "humidity",
    "wind_speed"
]


# Load model once
model = joblib.load(MODEL_FILE)


def get_risk_level(probability: float) -> str:
    """
    Convert model probability into an operational risk level.

    These thresholds are provisional engineering thresholds
    and should be calibrated/validated before operational use.
    """

    if probability < 0.25:
        return "Low"

    elif probability < 0.50:
        return "Medium"

    elif probability < 0.75:
        return "High"

    return "Critical"


def predict_risk(features: dict) -> dict:
    """
    Generate landslide risk prediction from environmental features.
    """

    missing_features = [
        feature
        for feature in FEATURES
        if feature not in features
    ]

    if missing_features:
        raise ValueError(
            f"Missing features: {missing_features}"
        )

    input_data = pd.DataFrame(
        [[features[feature] for feature in FEATURES]],
        columns=FEATURES
    )

    probability = float(
        model.predict_proba(input_data)[0][1]
    )

    risk_score = probability * 100

    risk_level = get_risk_level(probability)

    return {
        "risk_probability": round(probability, 4),
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level
    }
