import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor
import warnings
warnings.filterwarnings('ignore')

def benchmark_models():
    print("Loading dataset...")
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
        "Linear Regression": Pipeline(steps=[('preprocessor', preprocessor),
                                             ('regressor', LinearRegression())]),
                                             
        "Random Forest": Pipeline(steps=[('preprocessor', preprocessor),
                                         ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))]),
                                         
        "XGBoost": Pipeline(steps=[('preprocessor', preprocessor),
                                   ('regressor', xgb.XGBRegressor(n_estimators=100, random_state=42, objective='reg:squarederror'))])
    }
    
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    results = []

    print("\nStarting Benchmark (5-Fold Cross Validation)...")
    
    for name, pipeline in models.items():
        print(f"Training {name}...")
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

    print("Training LightGBM...")
    X_lgb = X.copy()
    for col in categorical_cols:
        X_lgb[col] = X_lgb[col].astype('category') 
        
    lgb_r2, lgb_rmse, lgb_mae = [], [], []
    for train_idx, test_idx in kf.split(X_lgb):
        X_train, X_test = X_lgb.iloc[train_idx], X_lgb.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        model = lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        lgb_r2.append(r2_score(y_test, preds))
        lgb_rmse.append(np.sqrt(mean_squared_error(y_test, preds)))
        lgb_mae.append(mean_absolute_error(y_test, preds))
        
    results.append({'Model': 'LightGBM', 'R2_Score': np.mean(lgb_r2), 'RMSE': np.mean(lgb_rmse), 'MAE': np.mean(lgb_mae)})

    print("Training CatBoost...")
    cat_r2, cat_rmse, cat_mae = [], [], []
    for train_idx, test_idx in kf.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        model = CatBoostRegressor(iterations=100, cat_features=categorical_cols, random_state=42, verbose=0)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        cat_r2.append(r2_score(y_test, preds))
        cat_rmse.append(np.sqrt(mean_squared_error(y_test, preds)))
        cat_mae.append(mean_absolute_error(y_test, preds))
        
    results.append({'Model': 'CatBoost', 'R2_Score': np.mean(cat_r2), 'RMSE': np.mean(cat_rmse), 'MAE': np.mean(cat_mae)})

    results_df = pd.DataFrame(results).sort_values(by='R2_Score', ascending=False).reset_index(drop=True)
    
    print("\nBENCHMARK RESULTS")
    print(results_df.to_string(index=False))
    
    return results_df

if __name__ == "__main__":
    benchmark_results = benchmark_models()