import pandas as pd
import numpy as np
import os
import joblib
from sklearn.linear_model import HuberRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data", "optimised_final_dataset.csv")
REFERENCE_DATA_PATH = os.path.join(BASE_DIR, "data", "combined_student_data.csv")  # For raw feature medians
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "huber_pipeline.pkl")

ml_pipeline = None
df_ml = None
df_reference = None  # For calculating engineered features

def init_ml(retrain=False):
    """Loads the dataset and either loads or trains the Huber pipeline."""
    global ml_pipeline, df_ml, df_reference
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"ML Data not found at {DATA_PATH}")
    
    if not os.path.exists(REFERENCE_DATA_PATH):
        raise FileNotFoundError(f"Reference data not found at {REFERENCE_DATA_PATH}")
        
    df_ml = pd.read_csv(DATA_PATH)
    df_reference = pd.read_csv(REFERENCE_DATA_PATH)  # Load reference for raw features

    if not retrain and os.path.exists(MODEL_PATH):
        ml_pipeline = joblib.load(MODEL_PATH)
    else:
        _train_pipeline()

def _train_pipeline():
    """Internal function to handle the actual fitting and saving."""
    global ml_pipeline, df_ml
    
    y = df_ml["Exam_Score"]
    X = df_ml.drop(columns=["Exam_Score"])
    
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols)
        ]
    )

    ml_pipeline = Pipeline([
        ("prep", preprocessor),
        ("reg", HuberRegressor(max_iter=1000))
    ])
    
    ml_pipeline.fit(X, y)
    joblib.dump(ml_pipeline, MODEL_PATH)

def retrain_model_with_new_data(new_data_df):
    """Called by main.py when a teacher uploads a new CSV."""
    global df_ml, df_reference
    
    df_reference = pd.concat([df_reference, new_data_df], ignore_index=True)
    df_reference.to_csv(REFERENCE_DATA_PATH, index=False)
    
    # Extract only engineered features for the model dataset
    engineered_cols = [col for col in df_ml.columns if col != "Exam_Score"]
    new_data_engineered = new_data_df[engineered_cols + ["Exam_Score"]] if all(col in new_data_df.columns for col in engineered_cols + ["Exam_Score"]) else None
    
    if new_data_engineered is not None:
        df_ml = pd.concat([df_ml, new_data_engineered], ignore_index=True)
        df_ml.to_csv(DATA_PATH, index=False)
        _train_pipeline()
    
    return len(df_reference)

def calculate_engineered_features(raw_data_dict):
    """Converts raw student data to engineered features for model prediction."""
    # Map frontend camelCase to backend snake_case if needed
    data = raw_data_dict.copy()
    
    # Helper to get value with proper None/0 handling
    def get_value(keys, default):
        for key in keys:
            if key in data and data[key] is not None:
                return float(data[key])
        return default
    
    # Provide defaults for numeric fields (handles 0 properly)
    # Use df_reference (combined_student_data) for raw feature medians
    hours_studied = get_value(["hoursStudied", "Hours_Studied"], df_reference["Hours_Studied"].median())
    sleep_hours = get_value(["sleepHours", "Sleep_Hours"], df_reference["Sleep_Hours"].median())
    tutoring_sessions = get_value(["tutoringSessions", "Tutoring_Sessions"], df_reference["Tutoring_Sessions"].median())
    attendance = get_value(["attendance", "Attendance"], df_reference["Attendance"].median())
    # Use examScore as Previous_Scores (current performance indicator)
    previous_scores = get_value(["previousScores", "Previous_Scores", "examScore", "Exam_Score"], df_reference["Previous_Scores"].median())
    physical_activity = get_value(["physicalActivity", "Physical_Activity"], df_reference["Physical_Activity"].median())
    
    # Enforce minimum values to avoid division by near-zero issues
    hours_studied = max(hours_studied, 0.5)
    sleep_hours = max(sleep_hours, 0.5)
    physical_activity = max(physical_activity, 0.1)
    attendance = max(attendance, 1.0)
    previous_scores = max(previous_scores, 10.0)  # Score can't be below 10 realistically
    
    # Calculate engineered features (same formulas as in feature engineering script)
    features = {}
    
    features['Study_to_Sleep_Ratio'] = hours_studied / (sleep_hours + 1e-5)
    features['Tutoring_to_Study_Ratio'] = tutoring_sessions / (hours_studied + 1e-5)
    features['Study_Per_Score_Unit'] = hours_studied / (previous_scores + 1e-5)
    features['Engagement_Index'] = (attendance / 100) * hours_studied
    features['Academic_Momentum'] = previous_scores * (attendance / 100)
    features['Tutoring_Impact'] = tutoring_sessions * previous_scores
    features['Holistic_Effort'] = hours_studied + (tutoring_sessions * 2) + physical_activity
    features['Burnout_Risk'] = (hours_studied * attendance) / ((sleep_hours * physical_activity) + 1)
    features['Fatigue_Factor'] = (hours_studied ** 2) / (sleep_hours + 1e-5)
    features['Score_Gap_Potential'] = 100 - previous_scores
    features['Log_Hours_Studied'] = np.log1p(hours_studied)
    features['Consistency_Score'] = attendance / (hours_studied + 1e-5)
    features['Rest_Deficit'] = physical_activity / (sleep_hours + 1e-5)
    features['Academic_Velocity'] = previous_scores / (hours_studied + 1e-5)
    features['Effort_Efficiency_Index'] = (previous_scores * attendance) / ((hours_studied * sleep_hours) + 1)
    features['Distraction_Vulnerability'] = hours_studied / (attendance + 1e-5)
    features['Resource_Dependency_Metric'] = tutoring_sessions * (100 - previous_scores)
    
    overall_wellbeing = sleep_hours + physical_activity
    features['Overall_Wellbeing_Index'] = overall_wellbeing
    features['Stress_Load'] = hours_studied / (overall_wellbeing + 1e-5)
    features['Study_Sleep_Harmonic'] = 2 * (hours_studied * sleep_hours) / (hours_studied + sleep_hours + 1e-5)
    features['Study_Density_Factor'] = (hours_studied ** 2) * (attendance / 100)
    
    # Add categorical fields from original data or defaults
    categorical_fields = ['Parental_Involvement', 'Access_to_Resources', 'Extracurricular_Activities', 
                         'Motivation_Level', 'Internet_Access', 'Family_Income', 'Teacher_Quality', 
                         'School_Type', 'Peer_Influence', 'Learning_Disabilities', 'Parental_Education_Level', 
                         'Distance_from_Home', 'Gender']
    
    for cat_field in categorical_fields:
        if cat_field in data:
            features[cat_field] = data[cat_field]
        else:
            # Use mode from reference data
            features[cat_field] = df_reference[cat_field].mode()[0] if len(df_reference[cat_field].mode()) > 0 else "Unknown"
    
    return features

def predict_score(data_dict):
    """Predicts the exam score with feature engineering from raw data."""
    # Convert raw data to engineered features
    engineered_data = calculate_engineered_features(data_dict)
    
    input_df = pd.DataFrame([engineered_data])
    training_features = df_ml.drop(columns=["Exam_Score"]).columns
    
    # Ensure all training features are present
    for col in training_features:
        if col not in input_df.columns:
            input_df[col] = df_ml[col].mode()[0]
    
    # Keep only training features in correct order
    input_df = input_df[training_features]
    
    pred = ml_pipeline.predict(input_df)[0]
    return round(float(pred), 1)

def get_feature_importance():
    """Extracts coefficient weights from the Huber model for UI transparency."""
    coef = ml_pipeline.named_steps["reg"].coef_

    prep = ml_pipeline.named_steps["prep"]

    # Pull feature names directly from what the pipeline was trained on
    # — avoids mismatch when extra columns are added elsewhere
    num_features = prep.transformers_[0][1].get_feature_names_out() if hasattr(prep.transformers_[0][1], "get_feature_names_out") else prep.transformers_[0][2]
    cat_features = prep.transformers_[1][1].get_feature_names_out()

    # StandardScaler doesn't have get_feature_names_out in older sklearn; fall back
    try:
        num_features = list(prep.transformers_[0][1].get_feature_names_out())
    except AttributeError:
        num_features = list(prep.transformers_[0][2])  # the column list stored in the transformer tuple

    all_features = list(num_features) + list(cat_features)

    pairs = sorted(zip(all_features, coef), key=lambda x: abs(x[1]), reverse=True)
    return [{"name": f, "importance": round(float(c), 3)} for f, c in pairs[:15]]