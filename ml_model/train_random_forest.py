import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

TRAIN_FILE = "data/processed/train_dataset.csv"
TEST_FILE = "data/processed/test_dataset.csv"

MODEL_FILE = "ml_model/models/random_forest_model.joblib"


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


# --------------------------------------------------
# Load data
# --------------------------------------------------

train = pd.read_csv(TRAIN_FILE)
test = pd.read_csv(TEST_FILE)

X_train = train[FEATURES]
y_train = train[TARGET]

X_test = test[FEATURES]
y_test = test[TARGET]


print("=" * 60)
print("RANDOM FOREST TRAINING")
print("=" * 60)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))
print("Features:", len(FEATURES))


# --------------------------------------------------
# Train model
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

print("\nTraining Random Forest...")

model.fit(X_train, y_train)

print("Training complete.")


# --------------------------------------------------
# Predictions
# --------------------------------------------------

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]


# --------------------------------------------------
# Evaluation
# --------------------------------------------------

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
roc_auc = roc_auc_score(y_test, y_prob)

cm = confusion_matrix(y_test, y_pred)


print("\n" + "=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"\nAccuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")


print("\nConfusion Matrix:")
print(cm)


print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Background", "Landslide"],
        zero_division=0
    )
)


# --------------------------------------------------
# Feature Importance
# --------------------------------------------------

importance = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
}).sort_values(
    "importance",
    ascending=False
)

print("\n" + "=" * 60)
print("FEATURE IMPORTANCE")
print("=" * 60)

print(importance.to_string(index=False))


# --------------------------------------------------
# Save model
# --------------------------------------------------

joblib.dump(model, MODEL_FILE)

print("\nModel saved:")
print(MODEL_FILE)

print("\n" + "=" * 60)
print("RANDOM FOREST COMPLETE")
print("=" * 60)
