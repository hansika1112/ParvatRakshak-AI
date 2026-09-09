import pandas as pd
import joblib

from xgboost import XGBClassifier

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

TARGET = "landslide_observed"


train = pd.read_csv(TRAIN_FILE)
test = pd.read_csv(TEST_FILE)

X_train = train[FEATURES]
y_train = train[TARGET]

X_test = test[FEATURES]
y_test = test[TARGET]


print("=" * 60)
print("XGBOOST TRAINING")
print("=" * 60)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))
print("Features:", len(FEATURES))


model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42,
    n_jobs=-1
)


print("\nTraining XGBoost...")

model.fit(
    X_train,
    y_train
)

print("Training complete.")


y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]


accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
roc_auc = roc_auc_score(y_test, y_prob)

cm = confusion_matrix(y_test, y_pred)


print("\n" + "=" * 60)
print("XGBOOST PERFORMANCE")
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
        target_names=[
            "Background",
            "Landslide"
        ],
        zero_division=0
    )
)


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

print(
    importance.to_string(index=False)
)


joblib.dump(
    model,
    MODEL_FILE
)

print("\nModel saved:")
print(MODEL_FILE)

print("\n" + "=" * 60)
print("XGBOOST COMPLETE")
print("=" * 60)
