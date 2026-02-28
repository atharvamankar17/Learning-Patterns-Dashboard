import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
import os

os.makedirs('data', exist_ok=True)

def generate_formulated_data(filepath='cleaned_student_data.csv'):
    try:
        df = pd.read_csv(filepath)
    except FileNotFoundError:
        df = pd.read_csv(f'data/{filepath}')

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'Exam_Score' in numeric_cols:
        numeric_cols.remove('Exam_Score')

    num_imputer = SimpleImputer(strategy='median')
    df_cleaned_num = pd.DataFrame(num_imputer.fit_transform(df[numeric_cols]), columns=numeric_cols)

    # 3. Mathematical Feature Engineering
    features = pd.DataFrame()

    features['Study_to_Sleep_Ratio'] = df_cleaned_num['Hours_Studied'] / (df_cleaned_num['Sleep_Hours'] + 1e-5)
    features['Tutoring_to_Study_Ratio'] = df_cleaned_num['Tutoring_Sessions'] / (df_cleaned_num['Hours_Studied'] + 1e-5)
    features['Study_Per_Score_Unit'] = df_cleaned_num['Hours_Studied'] / (df_cleaned_num['Previous_Scores'] + 1e-5)
    features['Engagement_Index'] = (df_cleaned_num['Attendance'] / 100) * df_cleaned_num['Hours_Studied']
    features['Academic_Momentum'] = df_cleaned_num['Previous_Scores'] * (df_cleaned_num['Attendance'] / 100)
    features['Tutoring_Impact'] = df_cleaned_num['Tutoring_Sessions'] * df_cleaned_num['Previous_Scores']
    features['Holistic_Effort'] = df_cleaned_num['Hours_Studied'] + (df_cleaned_num['Tutoring_Sessions'] * 2) + df_cleaned_num['Physical_Activity']
    features['Burnout_Risk'] = (df_cleaned_num['Hours_Studied'] * df_cleaned_num['Attendance']) / ((df_cleaned_num['Sleep_Hours'] * df_cleaned_num['Physical_Activity']) + 1)
    features['Fatigue_Factor'] = (df_cleaned_num['Hours_Studied'] ** 2) / (df_cleaned_num['Sleep_Hours'] + 1e-5)
    features['Score_Gap_Potential'] = 100 - df_cleaned_num['Previous_Scores']
    features['Log_Hours_Studied'] = np.log1p(df_cleaned_num['Hours_Studied'])
    features['Consistency_Score'] = df_cleaned_num['Attendance'] / (df_cleaned_num['Hours_Studied'] + 1e-5)
    features['Rest_Deficit'] = df_cleaned_num['Physical_Activity'] / (df_cleaned_num['Sleep_Hours'] + 1e-5)
    features['Academic_Velocity'] = df_cleaned_num['Previous_Scores'] / (df_cleaned_num['Hours_Studied'] + 1e-5)
    features['Effort_Efficiency_Index'] = (df_cleaned_num['Previous_Scores'] * df_cleaned_num['Attendance']) / ((df_cleaned_num['Hours_Studied'] * df_cleaned_num['Sleep_Hours']) + 1)
    features['Distraction_Vulnerability'] = df_cleaned_num['Hours_Studied'] / (df_cleaned_num['Attendance'] + 1e-5)
    features['Resource_Dependency_Metric'] = df_cleaned_num['Tutoring_Sessions'] * (100 - df_cleaned_num['Previous_Scores'])
    features['Overall_Wellbeing_Index'] = df_cleaned_num['Sleep_Hours'] + df_cleaned_num['Physical_Activity']
    features['Stress_Load'] = df_cleaned_num['Hours_Studied'] / (features['Overall_Wellbeing_Index'] + 1e-5)
    features['Study_Sleep_Harmonic'] = 2 * (df_cleaned_num['Hours_Studied'] * df_cleaned_num['Sleep_Hours']) / (df_cleaned_num['Hours_Studied'] + df_cleaned_num['Sleep_Hours'] + 1e-5)
    features['Study_Density_Factor'] = (df_cleaned_num['Hours_Studied'] ** 2) * (df_cleaned_num['Attendance'] / 100)

    output_path = 'data/formulated_student_data.csv'
    features.to_csv(output_path, index=False)
    
    print(f"Data processing complete!")
    print(f"File saved successfully at {output_path}")
    print(f"Total formulated features created: {features.shape[1]}")

if __name__ == "__main__":
    generate_formulated_data('cleaned_student_data.csv')