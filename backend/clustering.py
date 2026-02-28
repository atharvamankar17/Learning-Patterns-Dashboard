import pandas as pd
import numpy as np
import os
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

BASE_DIR = os.path.dirname(__file__)

DATA_PATH = os.path.join(BASE_DIR, "data", "dashboard_ready_student_data_kmeans.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "kmeans_preprocessor.pkl")
KMEANS_PATH = os.path.join(MODELS_DIR, "kmeans_model.pkl")

df_cluster = None
kmeans_model = None
kmeans_preprocessor = None
persona_mapping = {}

def init_clustering(retrain=False):
    """Loads the dashboard data and prepares the K-Means prediction engine."""
    global df_cluster, df_raw, kmeans_model, kmeans_preprocessor, persona_mapping
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Clustering Data not found at {DATA_PATH}")
    
    df_cluster = pd.read_csv(DATA_PATH)
    
    # Generate deterministic mock classes "10-A", "10-B", "10-C"
    classes = ["10-A", "10-B", "10-C"]
    df_cluster["Class_Section"] = [classes[i % 3] for i in range(len(df_cluster))]
    
    raw_path = os.path.join(BASE_DIR, "data", "Student_data.csv")
    if os.path.exists(raw_path):
        df_raw = pd.read_csv(raw_path)
        df_raw["Class_Section"] = [classes[i % 3] for i in range(len(df_raw))]
    else:
        df_raw = None
    
    features_df = df_cluster.drop(columns=['Exam_Score', 'Persona_Cluster', 'Class_Section'], errors='ignore')
    
    if not retrain and os.path.exists(KMEANS_PATH) and os.path.exists(PREPROCESSOR_PATH):
        kmeans_model = joblib.load(KMEANS_PATH)
        kmeans_preprocessor = joblib.load(PREPROCESSOR_PATH)
    else:
        numerical_cols = features_df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = features_df.select_dtypes(exclude=[np.number]).columns.tolist()
        
        kmeans_preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numerical_cols),
                ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), categorical_cols)
            ])
            
        X_processed = kmeans_preprocessor.fit_transform(features_df)
        kmeans_model = KMeans(n_clusters=4, init='k-means++', random_state=42)
        kmeans_model.fit(X_processed) 
        
        joblib.dump(kmeans_preprocessor, PREPROCESSOR_PATH)
        joblib.dump(kmeans_model, KMEANS_PATH)
        
    _build_mapping_dictionary(features_df)

def _build_mapping_dictionary(features_df):
    """Internally maps the raw KMeans IDs (0,1,2,3) to the human names."""
    global persona_mapping
    
    X_processed = kmeans_preprocessor.transform(features_df)
    raw_clusters = kmeans_model.predict(X_processed)
    
    temp_df = df_cluster.copy()
    temp_df['Raw_Cluster'] = raw_clusters
    
    key_metrics = ['Exam_Score', 'Burnout_Risk', 'Engagement_Index']
    summary = temp_df.groupby('Raw_Cluster')[key_metrics].mean()
    
    highest_burnout = summary['Burnout_Risk'].idxmax()
    lowest_eng = summary['Engagement_Index'].idxmin()
    
    persona_mapping[highest_burnout] = "The Overworked Achiever"
    persona_mapping[lowest_eng] = "The Disengaged Learner"
    
    remaining = [c for c in summary.index if c not in persona_mapping]
    rem_sorted = summary.loc[remaining].sort_values(by='Exam_Score', ascending=False).index
    persona_mapping[rem_sorted[0]] = "The Balanced Achiever"
    persona_mapping[rem_sorted[1]] = "The Developing Learner"

def predict_persona(data_dict):
    """Predicts the Persona for a brand new student input from the frontend."""
    input_df = pd.DataFrame([data_dict])
    
    expected_cols = df_cluster.drop(columns=["Exam_Score", "Persona_Cluster"], errors='ignore').columns
    
    for col in expected_cols:
        if col not in input_df.columns:
            input_df[col] = df_cluster[col].mode()[0]
            
    features = input_df[expected_cols].copy()
    
    for col in features.columns:
        features[col] = features[col].astype(df_cluster[col].dtype)
    
    X_processed = kmeans_preprocessor.transform(features)
    raw_cluster = kmeans_model.predict(X_processed)[0]
    return persona_mapping[raw_cluster]

def get_recommendation(persona_name):
    recs = {
        "The Disengaged Learner": "Focus on 'micro-wins' to build academic momentum.",
        "The Developing Learner": "Introduce active recall and foundational tutoring.",
        "The Overworked Achiever": "DO NOT assign extra homework. Mandate recovery time.",
        "The Balanced Achiever": "Provide advanced, open-ended project work."
    }
    return recs.get(persona_name, "Monitor closely.")

def get_filtered_dfs(class_name=None):
    if not class_name or class_name.lower() in ["school", "all classes", ""]:
        return df_cluster, df_raw
    f_cluster = df_cluster[df_cluster["Class_Section"] == class_name]
    f_raw = df_raw[df_raw["Class_Section"] == class_name] if df_raw is not None else None
    return f_cluster, f_raw

def get_cluster_summary(class_name=None):
    f_cluster, _ = get_filtered_dfs(class_name)
    counts = f_cluster["Persona_Cluster"].value_counts().to_dict()
    avgs = f_cluster.groupby("Persona_Cluster")["Exam_Score"].mean().round(1).to_dict()
    
    return [{
        "id": name, "name": name, "count": count, 
        "avgScore": avgs.get(name, 0), "recommendation": get_recommendation(name)
    } for name, count in counts.items()]

def get_all_students(class_name=None):
    students = []
    
    f_cluster, f_raw = get_filtered_dfs(class_name)
    
    # Pre-extract values to avoid pandas lookup overhead in the loop
    if f_raw is not None and len(f_raw) > 0:
        att_vals = f_raw.get("Attendance", pd.Series([0]*len(f_cluster))).values
        hrs_vals = f_raw.get("Hours_Studied", pd.Series([0]*len(f_cluster))).values
        tut_vals = f_raw.get("Tutoring_Sessions", pd.Series([0]*len(f_cluster))).values
    else:
        att_vals = hrs_vals = tut_vals = [0] * len(f_cluster)

    for i, (idx, row) in enumerate(f_cluster.iterrows()):
        student_data = {
            "index": int(idx),
            "examScore": int(row.get("Exam_Score", 0)),
            "clusterName": row.get("Persona_Cluster", "Unknown"),
            "engagement": round(float(row.get("Engagement_Index", 0)), 1),
            "burnoutRisk": round(float(row.get("Burnout_Risk", 0)), 1),
            "motivation": row.get("Motivation_Level", "Unknown")
        }
        
        if i < len(att_vals):
            student_data["attendance"] = float(att_vals[i])
            student_data["studyHours"] = float(hrs_vals[i])
            student_data["tutoringSessions"] = float(tut_vals[i])
            student_data["tutoring"] = float(tut_vals[i])
        else:
            student_data["attendance"] = student_data["studyHours"] = student_data["tutoringSessions"] = student_data["tutoring"] = 0.0
            
        students.append(student_data)
        
    return students

def get_student_by_index(index):
    if index < 0 or index >= len(df_cluster): return None
    data = df_cluster.iloc[index].to_dict()
    data["clusterName"] = data.pop("Persona_Cluster", "Unknown")
    
    if df_raw is not None and index < len(df_raw):
        raw_row = df_raw.iloc[index]
        data["hoursStudied"] = float(raw_row.get("Hours_Studied", data.get("Hours_Studied", 0)))
        data["attendance"] = float(raw_row.get("Attendance", data.get("Attendance", 0)))
        data["tutoringSessions"] = float(raw_row.get("Tutoring_Sessions", data.get("Tutoring_Sessions", 0)))
        data["sleepHours"] = float(raw_row.get("Sleep_Hours", data.get("Sleep_Hours", 0)))
        data["physicalActivity"] = float(raw_row.get("Physical_Activity", data.get("Physical_Activity", 0)))
    
    return data

def get_early_warnings(class_name=None):
    f_cluster, _ = get_filtered_dfs(class_name)
    at_risk = f_cluster[f_cluster["Persona_Cluster"].isin(["The Disengaged Learner", "The Overworked Achiever"])].head(30)
    warnings = []
    for idx, row in at_risk.iterrows():
        issues = ["Critically low engagement"] if row["Persona_Cluster"] == "The Disengaged Learner" else ["Severe burnout risk"]
        warnings.append({"index": int(idx), "score": int(row["Exam_Score"]), "clusterName": row["Persona_Cluster"], "issues": issues})
    return warnings

def get_summary_report(class_name=None):
    f_cluster, f_raw = get_filtered_dfs(class_name)
    
    if len(f_cluster) == 0:
        return {
            "totalStudents": 0, "avgExamScore": 0, "highRiskPercent": 0,
            "clusterDistribution": {}, "avgAttendance": 0, "avgStudyHours": 0,
            "avgSleep": 0, "avgPhysicalActivity": 0, "tutoringRate": 0, "disabilityRate": 0
        }
    
    high_risk_count = len(f_cluster[f_cluster["Persona_Cluster"].isin(["The Disengaged Learner", "The Overworked Achiever"])])
    
    try:
        avg_attendance = round(f_raw["Attendance"].mean(), 1) if f_raw is not None and "Attendance" in f_raw.columns else None
        avg_study_hours = round(f_raw["Hours_Studied"].mean(), 1) if f_raw is not None and "Hours_Studied" in f_raw.columns else None
        avg_sleep = round(f_raw["Sleep_Hours"].mean(), 1) if f_raw is not None and "Sleep_Hours" in f_raw.columns else None
        avg_physical_activity = round(f_raw["Physical_Activity"].mean(), 1) if f_raw is not None and "Physical_Activity" in f_raw.columns else None
        tutoring_rate = round(100 * len(f_raw[f_raw["Tutoring_Sessions"] > 0]) / len(f_raw), 1) if f_raw is not None and "Tutoring_Sessions" in f_raw.columns else None
        disability_rate = round(100 * len(f_raw[f_raw["Learning_Disabilities"] == "Yes"]) / len(f_raw), 1) if f_raw is not None and "Learning_Disabilities" in f_raw.columns else None
    except Exception:
        avg_attendance = avg_study_hours = avg_sleep = avg_physical_activity = tutoring_rate = disability_rate = None

    return {
        "totalStudents": len(f_cluster),
        "avgExamScore": round(f_cluster["Exam_Score"].mean(), 1),
        "highRiskPercent": round(100 * high_risk_count / len(f_cluster), 1) if len(f_cluster) > 0 else 0,
        "clusterDistribution": f_cluster["Persona_Cluster"].value_counts(normalize=True).round(3).to_dict(),
        "avgAttendance": avg_attendance,
        "avgStudyHours": avg_study_hours,
        "avgSleep": avg_sleep,
        "avgPhysicalActivity": avg_physical_activity,
        "tutoringRate": tutoring_rate,
        "disabilityRate": disability_rate
    }

def get_mock_timeline(student_data):
    burnout_base = student_data.get("Burnout_Risk", 50)
    burnout_vals = [burnout_base] + np.random.normal(burnout_base, 5, 4).tolist()
    score_vals = [student_data.get("Exam_Score", 70)] + np.random.normal(student_data.get("Exam_Score", 70), 2, 4).tolist()
    
    sleep_base = student_data.get("sleepHours", student_data.get("Sleep_Hours", 7))
    sleep_vals = [sleep_base] + np.random.normal(sleep_base, 0.5, 4).tolist()
    
    return {
        "labels": ["Baseline", "Week 1", "Week 2", "Week 3", "Projection"],
        "burnout_trend": [round(x, 1) for x in burnout_vals],
        "scores": [round(x, 0) for x in score_vals],
        "sleep": [round(max(0, min(24, x)), 1) for x in sleep_vals]
    }

def compute_fairness(class_name=None):
    f_cluster, _ = get_filtered_dfs(class_name)
    
    def disparate_impact(attribute, unprivileged, privileged):
        if attribute not in f_cluster.columns: return {"ratio": 1.0, "flag": "Missing column"}
        unpriv_group, priv_group = f_cluster[f_cluster[attribute] == unprivileged], f_cluster[f_cluster[attribute] == privileged]
        if len(unpriv_group) == 0 or len(priv_group) == 0: return {"ratio": 1.0, "flag": "Insufficient data"}
        unfavorable = ["The Disengaged Learner", "The Overworked Achiever"]
        unpriv_rate = len(unpriv_group[unpriv_group["Persona_Cluster"].isin(unfavorable)]) / len(unpriv_group)
        priv_rate = len(priv_group[priv_group["Persona_Cluster"].isin(unfavorable)]) / len(priv_group)
        ratio = unpriv_rate / priv_rate if priv_rate > 0 else 0
        return {"ratio": round(ratio, 2), "flag": "Potential bias" if ratio < 0.8 or ratio > 1.25 else "Acceptable"}
        
    return {"gender": disparate_impact("Gender", "Female", "Male"), "income": disparate_impact("Family_Income", "Low", "High")}
