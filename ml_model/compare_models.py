import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

TRAIN_FILE = "data/processed/train_dataset.csv"
TEST_FILE = "data/processed/test_dataset.csv"

RF_MODEL = "ml_model/models/random_forest_model.joblib"
XGB_MODEL = "ml_model/models/xgboost_model.joblib"

OUTPUT = "data/processed/model_comparison.csv"

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

TARGET = "landslide_observed"


test = pd.read_csv(TEST_FILE)

X_test = test[FEATURES]
y_test = test[TARGET]


models = {
    "Random Forest": joblib.load(RF_MODEL),
    "XGBoost": joblib.load(XGB_MODEL)
}


results = []

print("=" * 70)
print("MODEL COMPARISON")
print("=" * 70)

for name, model in models.items():

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    results.append({
        "model": name,
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(
            y_test, y_pred, zero_division=0
        ),
        "recall": recall_score(
            y_test, y_pred, zero_division=0
        ),
        "f1_score": f1_score(
            y_test, y_pred, zero_division=0
        ),
        "roc_auc": roc_auc_score(
            y_test, y_prob
        )
    })


comparison = pd.DataFrame(results)

print("\n")
print(comparison.to_string(index=False))

comparison.to_csv(
    OUTPUT,
    index=False
)

print("\nSaved:")
print(OUTPUT)


best_f1 = comparison.loc[
    comparison["f1_score"].idxmax()
]

best_auc = comparison.loc[
    comparison["roc_auc"].idxmax()
]

print("\n" + "=" * 70)
print("BEST MODELS")
print("=" * 70)

print(
    f"Best F1: {best_f1['model']} "
    f"({best_f1['f1_score']:.4f})"
)

print(
    f"Best ROC-AUC: {best_auc['model']} "
    f"({best_auc['roc_auc']:.4f})"
)
