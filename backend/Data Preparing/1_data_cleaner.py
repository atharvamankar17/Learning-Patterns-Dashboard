import pandas as pd
import os
from datetime import datetime
from faker import Faker
import random

BASE_DIR = os.path.dirname(__file__)
RAW_PATH = os.path.join(BASE_DIR, "data", "Student_data.csv")
CLEANED_PATH = os.path.join(BASE_DIR, "cleaned_student_data.csv")

def clean_data():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Cleaning started...")

    if not os.path.exists(RAW_PATH):
        raise FileNotFoundError(f"Raw file not found: {RAW_PATH}")

    df = pd.read_csv(RAW_PATH)

    print(f"Original rows: {len(df)}")
    print("Missing values before cleaning:")
    print(df.isnull().sum()[df.isnull().sum() > 0])

    cat_cols = [
        'Parental_Involvement', 'Access_to_Resources', 'Extracurricular_Activities',
        'Motivation_Level', 'Internet_Access', 'Family_Income', 'Teacher_Quality',
        'School_Type', 'Peer_Influence', 'Learning_Disabilities',
        'Parental_Education_Level', 'Distance_from_Home', 'Gender'
    ]

    num_cols = [
        'Hours_Studied', 'Attendance', 'Sleep_Hours', 'Previous_Scores',
        'Tutoring_Sessions', 'Physical_Activity', 'Exam_Score'
    ]

    for col in cat_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].mode()[0])

    for col in num_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
            df[col] = df[col].astype(int)

    df['Attendance'] = df['Attendance'].clip(0, 100)
    df['Hours_Studied'] = df['Hours_Studied'].clip(0, 50)
    df['Sleep_Hours'] = df['Sleep_Hours'].clip(3, 12)
    df['Tutoring_Sessions'] = df['Tutoring_Sessions'].clip(0, 10)
    df['Physical_Activity'] = df['Physical_Activity'].clip(0, 7)
    df['Exam_Score'] = df['Exam_Score'].clip(0, 100)
    df['Previous_Scores'] = df['Previous_Scores'].clip(0, 100)

    df = df.drop_duplicates()

    # Add random names and classes
    fake = Faker()
    df['Name'] = [fake.name() for _ in range(len(df))]
    classes = [f"Class {i}" for i in range(1, 11)]  # Classes 1 to 10
    df['Class'] = [random.choice(classes) for _ in range(len(df))]

    # Boost tutoring sessions if they are too low in raw data
    if 'Tutoring_Sessions' in df.columns:
        # Give 30% of students some tutoring if they have none
        mask = (df['Tutoring_Sessions'] == 0)
        df.loc[mask.sample(frac=0.3), 'Tutoring_Sessions'] = [random.randint(1, 5) for _ in range(int(0.3 * mask.sum()))]

    df.to_csv(CLEANED_PATH, index=False)
    print(f"Cleaned file saved → {CLEANED_PATH}")
    print(f"Final rows: {len(df)}")
    print("Missing values after cleaning:")
    print(df.isnull().sum()[df.isnull().sum() > 0])

if __name__ == "__main__":
    try:
        clean_data()
    except Exception as e:
        print(f"Cleaning failed: {e}")