import pandas as pd
import numpy as np
from sklearn.model_selection import KFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, HuberRegressor
import warnings
warnings.filterwarnings('ignore')

def benchmark_linear_models():
    print("Loading optimized dataset...")
    df = pd.read_csv('data/optimised_final_dataset.csv')
    
    y = df['Exam_Score']
    X = df.drop(columns=['Exam_Score'])
    
    categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
    numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
        ])

    models = {
        "Standard Linear (OLS)": LinearRegression(),
        "Ridge (L2)": Ridge(alpha=1.0, random_state=42),
        "Lasso (L1)": Lasso(alpha=0.1, random_state=42),
        "ElasticNet (L1+L2)": ElasticNet(alpha=0.1, l1_ratio=0.5, random_state=42),
        "Huber (Robust)": HuberRegressor(max_iter=1000)
    }
    
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    results = []

    print("\nStarting Linear Benchmark (5-Fold CV)...")
    
    for name, model in models.items():
        print(f"Training {name}...")
        pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('regressor', model)])
        
        r2_scores, rmse_scores, mae_scores = [], [], []
        
        for train_idx, test_idx in kf.split(X):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            pipeline.fit(X_train, y_train)
            preds = pipeline.predict(X_test)
            
            r2_scores.append(r2_score(y_test, preds))
            rmse_scores.append(np.sqrt(mean_squared_error(y_test, preds)))
            mae_scores.append(mean_absolute_error(y_test, preds))
            
        results.append({
            'Model': name,
            'R2_Score': np.mean(r2_scores),
            'RMSE': np.mean(rmse_scores),
            'MAE': np.mean(mae_scores)
        })

    results_df = pd.DataFrame(results).sort_values(by='R2_Score', ascending=False).reset_index(drop=True)
    
    print("\nLINEAR REGRESSION BENCHMARK RESULTS")
    print(results_df.to_string(index=False))

    return results_df

if __name__ == "__main__":
    benchmark_linear_models()