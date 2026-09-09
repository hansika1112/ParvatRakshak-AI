import pandas as pd
import joblib

MODEL_FILE = "ml_model/models/xgboost_model.joblib"
TEST_FILE = "data/processed/test_dataset.csv"

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


def get_risk_level(probability):

    if probability < 0.25:
        return "Low"

    elif probability < 0.50:
        return "Medium"

    elif probability < 0.75:
        return "High"

    else:
        return "Critical"


# Load model
model = joblib.load(MODEL_FILE)

# Load test data
df = pd.read_csv(TEST_FILE)

X = df[FEATURES]

# Probability of landslide
probabilities = model.predict_proba(X)[:, 1]

# Add predictions
df["risk_probability"] = probabilities
df["risk_score"] = probabilities * 100

df["risk_level"] = [
    get_risk_level(p)
    for p in probabilities
]


print("=" * 60)
print("PARVATRAKSHAK AI - RISK PREDICTION")
print("=" * 60)

print("\nRisk distribution:")

print(
    df["risk_level"]
    .value_counts()
    .reindex(
        ["Low", "Medium", "High", "Critical"],
        fill_value=0
    )
)


print("\nSample predictions:")

print(
    df[
        [
            "elevation",
            "slope",
            "rainfall_1d",
            "rainfall_3d",
            "rainfall_7d",
            "rainfall_30d",
            "risk_probability",
            "risk_score",
            "risk_level"
        ]
    ].head(20).to_string(index=False)
)


OUTPUT = "data/processed/risk_predictions.csv"

df.to_csv(
    OUTPUT,
    index=False
)

print("\nSaved:")
print(OUTPUT)
