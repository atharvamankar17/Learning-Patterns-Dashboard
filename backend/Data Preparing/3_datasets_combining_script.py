import pandas as pd
import os

def create_combined_dataset():
    os.makedirs('data', exist_ok=True)
    
    print("Loading datasets...")
    
    df_cleaned = pd.read_csv('data/cleaned_student_data.csv')    
    df_formulated = pd.read_csv('data/formulated_student_data.csv')
    
    if len(df_cleaned) != len(df_formulated):
        raise ValueError("Row counts do not match between datasets. Check for dropped rows.")
        
    print("Combining datasets column-wise...")
    df_combined = pd.concat([df_cleaned, df_formulated], axis=1)
    
    output_path = 'data/combined_student_data.csv'
    df_combined.to_csv(output_path, index=False)
    
    print(f"Success! Combined dataset created at: {output_path}")
    print(f"- Cleaned Features: {df_cleaned.shape[1]}")
    print(f"- Formulated Features: {df_formulated.shape[1]}")
    print(f"- Final Total Features: {df_combined.shape[1]}")
    print(f"- Total Records: {df_combined.shape[0]}")

if __name__ == "__main__":
    create_combined_dataset()