import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score, roc_auc_score
import joblib

INPUT = "data/processed/final_ml_dataset.csv"

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

df = pd.read_csv(INPUT)

print("=" * 60)
print("PREPARING TRAINING DATA")
print("=" * 60)

X = df[FEATURES].copy()
y = df[TARGET].copy()

print("\nFeatures:")
for feature in FEATURES:
    print("-", feature)

print("\nX shape:", X.shape)
print("y shape:", y.shape)

print("\nClass distribution:")
print(y.value_counts().sort_index())


# --------------------------------------------------
# Train/Test Split
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n" + "=" * 60)
print("TRAIN / TEST SPLIT")
print("=" * 60)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))

print("\nTraining class distribution:")
print(y_train.value_counts().sort_index())

print("\nTesting class distribution:")
print(y_test.value_counts().sort_index())


# --------------------------------------------------
# Save split datasets
# --------------------------------------------------

train_df = X_train.copy()
train_df[TARGET] = y_train.values

test_df = X_test.copy()
test_df[TARGET] = y_test.values

train_df.to_csv(
    "data/processed/train_dataset.csv",
    index=False
)

test_df.to_csv(
    "data/processed/test_dataset.csv",
    index=False
)

print("\nSaved:")
print("data/processed/train_dataset.csv")
print("data/processed/test_dataset.csv")


print("\n" + "=" * 60)
print("PREPARATION COMPLETE")
print("=" * 60)
