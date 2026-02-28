import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import RFE
from sklearn.preprocessing import LabelEncoder
import os

def run_feature_selection_and_preserve_descriptive():
    df = pd.read_csv('data/final_dataset.csv')
    
    descriptive_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    y = df['Exam_Score']
    X = df.drop(columns=['Exam_Score'])
    
    X_encoded = X.copy()
    for col in descriptive_cols:
        le = LabelEncoder()
        X_encoded[col] = le.fit_transform(X_encoded[col].astype(str))

    estimator = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    n_features_to_select = 10
    selector = RFE(estimator, n_features_to_select=n_features_to_select, step=1)
    
    print(f"Running RFE to find the top {n_features_to_select} predictive features...")
    selector = selector.fit(X_encoded, y)
    
    selected_feature_names = X_encoded.columns[selector.support_].tolist()
    
    print("\nTop 10 Highly Contributing Features (RFE Selected):")
    for i, feature in enumerate(selected_feature_names, 1):
        print(f"{i}. {feature}")
        
    final_columns = selected_feature_names.copy()
    for col in descriptive_cols:
        if col not in final_columns:
            final_columns.append(col)
    final_columns.append('Exam_Score')
    
    df_final = df[final_columns]
    
    output_path = 'data/optimised_final_dataset.csv'
    df_final.to_csv(output_path, index=False)
    
    print(f"\nFinal dataset saved to {output_path}")
    print(f"Total columns in final dataset: {df_final.shape[1]}")
    print(f"Contains: {len(selected_feature_names)} RFE predictors + {len(descriptive_cols)} descriptive contexts + 1 Target.")

if __name__ == "__main__":
    run_feature_selection_and_preserve_descriptive()