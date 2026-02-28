import pandas as pd
import os

def generate_final_dataset():
    os.makedirs('data', exist_ok=True)
    
    input_path = 'data/combined_student_data.csv'
    try:
        df_combined = pd.read_csv(input_path)
        print(f"Loaded dataset from {input_path} with shape {df_combined.shape}")
    except FileNotFoundError:
        print(f"Error: {input_path} not found.")
        return

    columns_to_remove = [
        'Hours_Studied',
        'Sleep_Hours',
        'Tutoring_Sessions',
        'Previous_Scores',
        'Attendance',
        'Physical_Activity'
    ]

    columns_to_drop = [col for col in columns_to_remove if col in df_combined.columns]
    df_final = df_combined.drop(columns=columns_to_drop)

    output_path = 'data/final_dataset.csv'
    df_final.to_csv(output_path, index=False)

    print("\n--- Process Complete ---")
    print(f"Removed redundant raw columns: {columns_to_drop}")
    print(f"Final dataset shape: {df_final.shape}")
    print(f"Successfully saved to: {output_path}")

if __name__ == "__main__":
    generate_final_dataset()