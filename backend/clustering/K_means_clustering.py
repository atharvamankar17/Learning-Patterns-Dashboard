import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

def generate_final_student_personas():
    print("Loading optimized dataset...")
    df = pd.read_csv('data/optimised_final_dataset.csv')
    
    features_df = df.drop(columns=['Exam_Score'], errors='ignore')
    
    numerical_cols = features_df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = features_df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), categorical_cols)
        ])
        
    print("Encoding and scaling data for K-Means...")
    X_processed = preprocessor.fit_transform(features_df)
    
    print("Running K-Means Clustering (K=4)...")
    kmeans = KMeans(n_clusters=4, init='k-means++', random_state=42)
    clusters = kmeans.fit_predict(X_processed)
    
    persona_mapping = {
        0: "The Disengaged Learner",       # Low Engagement, Low Burnout, Lowest Scores
        1: "The Developing Learner",       # Moderate Engagement, Moderate Scores
        2: "The Overworked Achiever",      # Max Engagement, Max Burnout, High Scores
        3: "The Balanced Achiever"         # High Engagement, Safe Burnout, High Scores
    }
    
    final_df = df.copy()
    named_clusters = [persona_mapping[c] for c in clusters]
    final_df.insert(0, 'Persona_Cluster', named_clusters)
    
    output_path = 'data/dashboard_ready_student_data_kmeans.csv'
    final_df.to_csv(output_path, index=False)
    
    print(f"\nSuccess! 4 Named Personas discovered.")
    print(f"Final dataset saved to {output_path}")
    print("\nFINAL PERSONA PROFILES SUMMARY:")
    
    key_metrics = ['Exam_Score', 'Burnout_Risk', 'Engagement_Index'] 
    available_metrics = [m for m in key_metrics if m in final_df.columns]
    
    profile_summary = final_df.groupby('Persona_Cluster')[available_metrics].mean().round(2)
    
    student_counts = final_df['Persona_Cluster'].value_counts()
    
    profile_summary.insert(0, 'Total_Students', student_counts)
    
    print("-" * 75)
    print(profile_summary.to_string())
    print("-" * 75)

if __name__ == "__main__":
    generate_final_student_personas()