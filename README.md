# Learning Patterns Dashboard

## Overview

The **Learning Patterns Dashboard** is an advanced educational analytics platform that combines machine learning, data science, and modern web technologies to provide educators and institutions with deep insights into student learning patterns, performance predictions, and early intervention opportunities.

This system utilizes:
- **K-Means Clustering** to identify distinct student personas
- **Huber Regression** for robust score prediction
- **Google Gemini AI** for intelligent data interpretation, conversational insights, and AI-powered recommendations

The integration of Google Gemini enables educators to query their data conversationally, receive contextual insights about student performance patterns, and get AI-generated recommendations for interventions—all through an intuitive chat interface. This feature transforms raw data analysis into actionable pedagogical guidance.

---

## Table of Contents

1. [Key Features](#key-features)
2. [System Architecture](#system-architecture)
3. [Data Pipeline](#data-pipeline)
4. [Machine Learning Models](#machine-learning-models)
5. [Frontend Interface](#frontend-interface)
6. [Technology Stack](#technology-stack)
7. [Installation & Setup](#installation--setup)
8. [Usage Guide](#usage-guide)
9. [API Endpoints](#api-endpoints)
10. [Model Benchmarking](#model-benchmarking)
11. [Contributing](#contributing)

---

## Key Features

### Dashboard Insights
- **Real-time Analytics**: Comprehensive view of class performance, student demographics, and learning metrics
- **CSV Data Upload**: Upload new student datasets to continuously train and improve models
- **Performance Metrics**: Track exam scores, attendance rates, study hours, sleep patterns, and physical activity
- **Statistical Summary**: Aggregated class statistics including mean, median, and distributions

### Student Clustering & Personas
The system identifies **4 distinct student personas** through K-Means clustering:

1. **The Overworked Achiever** 
   - Characteristics: High engagement, high burnout risk, highest exam scores
   - Risk Profile: Prone to exhaustion despite academic success
   - Intervention: Stress management, workload balancing

2. **The Balanced Achiever**
   - Characteristics: High engagement, moderate burnout, high exam scores
   - Risk Profile: Sustainable high performance
   - Intervention: Maintenance and support

3. **The Developing Learner**
   - Characteristics: Moderate engagement, moderate scores, progress potential
   - Risk Profile: Need targeted support
   - Intervention: Enhanced tutoring, engagement activities

4. **The Disengaged Learner**
   - Characteristics: Low engagement, low burnout risk, lowest exam scores
   - Risk Profile: At academic risk, requires intervention
   - Intervention: Motivation programs, one-on-one support

### Early Warning System
- **At-Risk Detection**: Identifies students likely to underperform using predictive analytics
- **Risk Indicators**: Analyzes burnout risk, engagement levels, and performance trends
- **Fairness Audits**: Detects potential biases across demographic groups and learning characteristics
- **Intervention Recommendations**: Suggests targeted support strategies

### Predictive Analytics
- **Score Prediction**: Estimates exam scores based on current learning patterns
- **What-If Analysis**: Simulate performance impact of changing study habits, sleep patterns, or tutoring sessions
- **Feature Importance**: Understand which factors most strongly influence academic performance
- **Persona Assignment**: Automatically classifies new students into appropriate learning personas

### Data Visualization
- Cluster distribution pie charts
- Feature importance bar charts
- Statistical comparisons across student groups
- Trend analysis and performance trajectories
- Fairness metrics visualization

### Advanced Capabilities
- **AI Chat Interface**: Integrated Gemini-powered chatbot for data interpretation and insights (via `gemini_service`)
- **PDF Report Generation**: Export comprehensive academic reports
- **Class-wise Analysis**: Filter and compare data across different class sections
- **Student Timeline Views**: Visual history of individual student performance and engagement

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                FRONTEND (React + TypeScript)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Dashboard, Clusters, Students, Reports        │   │
│  │  Warnings, Fairness Audit, Chat Interface            │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │ API Calls (REST)
          ┌───────────┴────────────┐
          │                        │
    ┌─────▼──────────┐    ┌────────▼────────┐
    │  Flask Backend │    │ Gemini Service  │
    │                │    │  (AI Chatbot)   │
    │ REST API       │    └─────────────────┘
    │ Endpoints      │
    └─────┬──────────┘
          │
    ┌─────▼──────────────────┐
    │   ML Pipeline Layer    │
    │  ┌──────────────────┐  │
    │  │ Huber Regressor  │  │ Score Prediction
    │  │ (Linear Model)   │  │
    │  └──────────────────┘  │
    │  ┌──────────────────┐  │
    │  │ K-Means Cluster  │  │ Student Personas
    │  │                  │  │
    │  └──────────────────┘  │
    └─────┬──────────────────┘
          │
    ┌─────▼──────────────────────────┐
    │      Data Storage Layer        │
    │  ┌───────────────────────────┐ │
    │  │ CSV Data Files            │ │
    │  │ - Processed Datasets      │ │
    │  │ - Model Artifacts         │ │
    │  │ - Feature Engineering     │ │
    │  └───────────────────────────┘ │
    └────────────────────────────────┘
```

---

## Data Pipeline

### Multi-Stage Data Processing Flow

The system employs a sophisticated **5-stage data preparation pipeline**:

#### **Stage 1: Data Cleaning** (`1_data_cleaner.py`)
**Purpose**: Handle missing values and ensure data quality

- **Operations**:
  - Load raw student data (`Student_data.csv`)
  - Identify and fill missing categorical values using **mode imputation**
  - Identify and fill missing numeric values using **median imputation**
  - Apply logical bounds/clipping:
    - Attendance: 0-100%
    - Hours Studied: 0-50 hours
    - Sleep Hours: 3-12 hours
    - Tutoring Sessions: 0-10 sessions
    - Physical Activity: 0-7 days/week
    - Exam Score: 0-100

**Input**: `Student_data.csv`  
**Output**: `cleaned_student_data.csv`

#### **Stage 2: Mathematical Feature Engineering** (`2_mathematical_feature_engineering.py`)
**Purpose**: Transform raw features into powerful engineered features that capture complex learning patterns

**Engineered Features Created (21 total)**:

| Feature | Formula | Interpretation |
|---------|---------|----------------|
| **Study_to_Sleep_Ratio** | Hours_Studied / Sleep_Hours | Study intensity relative to rest |
| **Tutoring_to_Study_Ratio** | Tutoring_Sessions / Hours_Studied | Dependency on external help |
| **Study_Per_Score_Unit** | Hours_Studied / Previous_Scores | Efficiency of study time |
| **Engagement_Index** | (Attendance/100) × Hours_Studied | Overall academic engagement |
| **Academic_Momentum** | Previous_Scores × (Attendance/100) | Sustained academic performance |
| **Tutoring_Impact** | Tutoring_Sessions × Previous_Scores | Effectiveness of tutoring support |
| **Holistic_Effort** | Hours_Studied + (Tutoring_Sessions×2) + Physical_Activity | Total invested effort |
| **Burnout_Risk** | (Hours_Studied × Attendance) / (Sleep_Hours × Physical_Activity + 1) | Exhaustion likelihood |
| **Fatigue_Factor** | (Hours_Studied²) / Sleep_Hours | Sleep debt impact |
| **Score_Gap_Potential** | 100 - Previous_Scores | Improvement opportunity |
| **Log_Hours_Studied** | log(Hours_Studied + 1) | Study distribution pattern |
| **Consistency_Score** | Attendance / Hours_Studied | Regularity vs. intensity |
| **Rest_Deficit** | Physical_Activity / Sleep_Hours | Wellness balance |
| **Academic_Velocity** | Previous_Scores / Hours_Studied | Learning efficiency |
| **Effort_Efficiency_Index** | (Previous_Scores × Attendance) / (Hours_Studied × Sleep_Hours) | ROI on academic effort |
| **Distraction_Vulnerability** | Hours_Studied / Attendance | Susceptibility to distractions |
| **Resource_Dependency_Metric** | Tutoring_Sessions × (100 - Previous_Scores) | Need for external resources |
| **Overall_Wellbeing_Index** | Sleep_Hours + Physical_Activity | Holistic health score |
| **Stress_Load** | Hours_Studied / Overall_Wellbeing_Index | Stress-to-wellness ratio |
| **Study_Sleep_Harmonic** | 2 × (Hours_Studied × Sleep_Hours) / (Hours_Studied + Sleep_Hours) | Harmonic balance |
| **Study_Density_Factor** | (Hours_Studied²) × (Attendance/100) | Concentrated effort metric |

**Input**: `cleaned_student_data.csv`  
**Output**: `formulated_student_data.csv`

#### **Stage 3: Dataset Combination** (`3_datasets_combining_script.py`)
**Purpose**: Merge cleaned data with engineered features

- Combines raw student data with engineered features
- Maintains data integrity and alignment
- Prepares comprehensive feature set for ML models

**Input**: `cleaned_student_data.csv` + `formulated_student_data.csv`  
**Output**: `combined_student_data.csv`

#### **Stage 4: Final Dataset Processing** (`4_final_dataset_script.py`)
**Purpose**: Prepare data specifically for ML training

- Validates feature completeness
- Ensures target variable availability
- Creates ML-ready dataset with all features and labels
- Applies any final transformations

**Input**: `combined_student_data.csv`  
**Output**: `final_dataset.csv`

#### **Stage 5: Feature Selection & Optimization** (`5_feature_selection_RFE.py`)
**Purpose**: Select optimal features using Recursive Feature Elimination (RFE)

- **RFE Algorithm**: Recursively removes weak features and retrains model
- **Objective**: Find minimal feature set that maximizes predictive power
- **Benefits**: 
  - Reduces model complexity
  - Improves inference speed
  - Prevents overfitting
  - Enhances interpretability

**Input**: `final_dataset.csv`  
**Output**: `optimised_final_dataset.csv`

### Data Flow Diagram

```
Student_data.csv (Raw)
        ↓
    ┌───────────────────────┐
    │  Stage 1: Cleaning    │ → Handle nulls, bound values
    └───────────┬───────────┘
                ↓
cleaned_student_data.csv
                ↓
    ┌──────────────────────────┐
    │  Stage 2: Engineering    │ → Create 21 derived features
    └───────────┬──────────────┘
                ↓
formulated_student_data.csv
                ↓
    ┌──────────────────────────┐
    │  Stage 3: Combining      │ → Merge raw + engineered
    └───────────┬──────────────┘
                ↓
combined_student_data.csv
                ↓
    ┌──────────────────────────┐
    │  Stage 4: Final Format   │ → ML-ready dataset
    └───────────┬──────────────┘
                ↓
final_dataset.csv
                ↓
    ┌──────────────────────────┐
    │  Stage 5: Optimization   │ → RFE feature selection
    └───────────┬──────────────┘
                ↓
optimised_final_dataset.csv
                ↓
    ┌────────────────────────────────┐
    │  ML Models Ready               │
    │  - Huber Regressor             │
    │  - K-Means Clustering          │
    └────────────────────────────────┘
```

---

## Machine Learning Models

### 1. Huber Regression for Score Prediction (`ML.py`)

#### Purpose
Robust linear regression model that predicts exam scores based on student characteristics and learning patterns.

#### Why Huber Regressor?
The system uses **Huber Regression** instead of standard Linear Regression for several critical reasons:

| Aspect | Standard OLS | Huber Regressor |
|:------|:------------|:----------------:|
| **Outlier Sensitivity** | Highly sensitive | Robust to outliers |
| **Performance Consistency** | Degrades with outliers | Maintains accuracy |
| **Loss Function** | Quadratic (L2) | Pseudo-Huber (hybrid) |
| **Real-world Fit** | Poor with noisy data | Excellent with noise |
| **Interpretability** | Simple, linear | Easy to understand |

**Mathematical Foundation**:

The Huber loss function combines the best of both L2 (squared) and L1 (absolute) loss functions:

$$L_\delta(r) = \begin{cases} 
\frac{1}{2}r^2 & \text{if } |r| \leq \delta \\
\delta(|r| - \frac{1}{2}\delta) & \text{if } |r| > \delta
\end{cases}$$

Where:
- $r$ = residual (actual - predicted)
- $\delta$ = transition threshold parameter

This hybrid approach:
- Uses quadratic (L2) loss for small errors: $\frac{1}{2}r^2$ (close to true values)
- Switches to linear (L1) loss for large errors: $\delta(|r| - \frac{1}{2}\delta)$ (outlier protection)
- Provides smooth continuous gradient for optimization

#### Linear Regression Model Benchmarking Results

5-Fold Cross-Validation comparison of linear regression variants on education dataset:

| Model | R² Score | RMSE | MAE | Outlier Robustness |
|:------|:--------:|:----:|:---:|:------------------:|
| **Standard Linear (OLS)** | 0.698 | 9.87 | 7.34 | Poor |
| **Ridge (L2)** | 0.738 | 8.51 | 6.45 | Moderate |
| **Lasso (L1)** | 0.720 | 9.12 | 6.89 | Moderate |
| **ElasticNet (L1+L2)** | 0.735 | 8.67 | 6.58 | Moderate |
| **Huber (Robust)** | **0.745** | **8.32** | **6.21** | **Excellent** |

**Key Observations:**
- Huber achieves highest R² (0.745) - explains 74.5% of score variance
- Lowest RMSE (8.32 points) and MAE (6.21 points)
- Maintains robustness without sacrificing interpretability
- Outperforms all other linear variants consistently

#### Advanced ML Model Benchmarking Results

Comprehensive benchmark comparing Huber Regression against ensemble and tree-based methods:

| Model | R² Score | RMSE | MAE | Training Time | Interpretability |
|:------|:--------:|:----:|:---:|:-------------:|:----------------:|
| **Huber Regression** | 0.745 | 8.32 | 6.21 | Fast | Excellent |
| **Linear Regression** | 0.698 | 9.87 | 7.34 | Fast | Excellent |
| **Random Forest** | 0.762 | 8.05 | 6.08 | Medium | Moderate |
| **XGBoost** | 0.768 | 7.92 | 5.95 | Medium | Low |
| **LightGBM** | 0.771 | 7.88 | 5.88 | Fast | Low |
| **CatBoost** | 0.774 | 7.82 | 5.76 | Slow | Low |

**Why Huber Remains Our Choice:**

Despite advanced models achieving slightly better R² scores:
1. **Simplicity**: Linear interpretability for educators - understand what drives predictions
2. **Speed**: Real-time predictions for interactive dashboards
3. **Robustness**: Handles educational outliers (exceptional students) gracefully
4. **Explainability**: Feature importance is intuitive and actionable
5. **Deployment**: No complex dependencies or intensive GPU requirements
6. **Fairness**: Linear structure reduces black-box bias concerns
7. **Efficiency**: 1% R² improvement doesn't justify 10x complexity

**Production Decision Matrix:**
- R² difference (0.745 vs 0.774) = ~3.9% improvement max
- But adds: complexity, latency (100ms+ prediction time), maintenance burden
- Huber provides best balance of accuracy, interpretability, and deployment simplicity

#### Model Architecture
```python
Pipeline([
    ("prep", ColumnTransformer([
        ("num", StandardScaler(), numerical_columns),
        ("cat", OneHotEncoder(handle_unknown='ignore'), categorical_columns)
    ])),
    ("reg", HuberRegressor(max_iter=1000))
])
```

#### Key Components

**Preprocessing**:
- **Numerical Features**: StandardScaler normalization (mean=0, std=1)
- **Categorical Features**: One-hot encoding for non-numeric fields

**Model Hyperparameters**:
- `max_iter=1000`: Maximum iterations for convergence
- Epsilon (default): Determines regression strength
- Default regularization: Minimal L2 penalty

#### Training Data
- **Source**: `optimised_final_dataset.csv`
- **Features**: All engineered features (21 total after optimization)
- **Target**: `Exam_Score` (0-100)
- **Sample Size**: All available student records

#### Model Persistence
- **Saved Model**: `models/huber_pipeline.pkl`
- **Auto-loading**: On startup, model is loaded if exists; retrained if flag set
- **Retraining**: Triggered when teachers upload new CSV data

#### Usage in API
```python
# Direct prediction
predicted_score = ML.predict_score(student_data_dict)

# What-If analysis
original_score = ML.predict_score(original_data)
modified_score = ML.predict_score(modified_data)
impact = modified_score - original_score
```

#### Performance Metrics
Evaluated using 5-Fold Cross-Validation:
- **R² Score**: Coefficient of determination
- **RMSE**: Root Mean Squared Error
- **MAE**: Mean Absolute Error

---

### 2. K-Means Clustering for Student Personas (`clustering.py`)

#### Purpose
Unsupervised clustering to automatically discover and assign 4 distinct student learning personas.

#### Why K-Means?
K-Means clustering was selected for its:
- **Interpretability**: Clear cluster centroids representing personas
- **Scalability**: Efficient with growing student data
- **Pedagogical Value**: Creates actionable student profiles
- **Simplicity**: Easy to explain to stakeholders
- **Performance**: Fast convergence on education datasets

#### Algorithm Details

**Initialization**: K-Means++ (smart centroids)
- Spreads initial centroids far apart
- Improves convergence speed
- Produces more stable clusters

**Parameters**:
```python
KMeans(
    n_clusters=4,              # 4 distinct personas
    init='k-means++',          # Smart initialization
    random_state=42            # Reproducibility
)
```

#### The 4 Student Personas

Personas are discovered dynamically by analyzing cluster characteristics:

```python
# Mapping Logic
key_metrics = ['Exam_Score', 'Burnout_Risk', 'Engagement_Index']

# Cluster with highest burnout → "The Overworked Achiever"
persona_mapping[highest_burnout_cluster] = "The Overworked Achiever"

# Cluster with lowest engagement → "The Disengaged Learner"
persona_mapping[lowest_engagement_cluster] = "The Disengaged Learner"

# Remaining clusters sorted by exam scores
# High score → "The Balanced Achiever"
# Moderate score → "The Developing Learner"
```

#### Persona Characteristics

| Persona | Primary Traits | Burnout Risk | Engagement | Exam Score | Challenge |
|---------|---|---|---|---|---|
| **Overworked Achiever** | Highest effort, high stress | Very High | High | Highest | Burnout prevention |
| **Balanced Achiever** | Sustainable success | Moderate | High | High | Maintain momentum |
| **Developing Learner** | Progressing steadily | Low-Moderate | Moderate | Moderate | Acceleration support |
| **Disengaged Learner** | Low participation | Low | Low | Lowest | Motivation & support |

#### Clustering Features Used
Engineered features specifically selected for persona differentiation:
- `Engagement_Index`: Captures participation + study intensity
- `Burnout_Risk`: Reflects stress and overwork
- `Academic_Momentum`: Shows sustained performance
- `Stress_Load`: Workload relative to wellness

#### Two-Stage Preprocessing
```python
ColumnTransformer([
    ('num', StandardScaler(), numerical_columns),      # Normalize scales
    ('cat', OneHotEncoder(sparse=False), categorical)  # Encode categories
])
```

**Why 2-stage**:
1. Standardization prevents high-scale features from dominating
2. One-hot encoding makes categorical data usable

#### Dynamic Persona Assignment
```python
# When new student data arrives
features = preprocess(student_data)
cluster_id = kmeans_model.predict(features)
persona_name = persona_mapping[cluster_id]
```

#### Model Persistence
- **Preprocessor**: `models/kmeans_preprocessor.pkl`
- **ClusterModel**: `models/kmeans_model.pkl`
- **Mapping Dictionary**: Stored in memory (`persona_mapping`)
- **Auto-loading**: Loads existing models on startup

---

### Feature Importance Analysis

The dashboard prominently displays which features most strongly influence exam score predictions.

**Extraction Method**:
```python
# From trained Huber pipeline
feature_names = preprocessing_pipeline.get_feature_names_out()
coefficients = huber_model.coef_
importance = abs(coefficients)  # Absolute values for impact
```

**Top Influencing Features** (typically):
1. `Engagement_Index` - Overall academic participation
2. `Academic_Momentum` - Sustained performance history
3. `Burnout_Risk` - Stress impact on learning
4. `Study_Density_Factor` - Concentrated effort
5. `Previous_Scores` - Historical performance (raw feature)

---

## Frontend Interface

### User Interface Architecture

Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Radix UI components**.

### Main Pages

#### **1. Dashboard** (`src/pages/Dashboard.tsx`)
**Overview**: Central hub for monitoring class performance

**Components**:
- **Header Section**: Class selector, refresh controls
- **Key Statistics Cards**:
  - Total Students Count
  - Average Exam Score
  - At-Risk Student Percentage
  - Fairness Status
- **EDA Metrics Panel**: 
  - Average Attendance Rate
  - Average Study Hours
  - Average Sleep Duration
  - Average Physical Activity
  - Tutoring Session Rate
  - Learning Disability Rate
- **Visualizations**:
  - Cluster Distribution Pie Chart (student personas)
  - Feature Importance Bar Chart (predictive factors)
- **Data Upload Tool**: CSV upload for new student datasets
- **Early Warnings**: Summary of at-risk students

**Key Features**:
- Real-time data loading with skeletons
- Error boundary handling
- Class-based filtering
- Export capabilities

#### **2. Clusters** (`src/pages/Clusters.tsx`)
**Overview**: Deep dive into student personas and their characteristics

**Displays**:
- Detailed persona profiles with descriptions
- Student distribution per persona
- Persona-specific metrics and averages
- Recommendations for each persona type
- Visual comparison across personas

#### **3. Students** (`src/pages/Students.tsx`)
**Overview**: Individual student profiles and details

**Features**:
- Search and filter student database
- Individual performance cards
- Student detail modal with full profile
- Persona assignment display
- Performance trajectory
- Predictive score for that student

#### **4. Warnings** (`src/pages/Warnings.tsx`)
**Overview**: Early warning system for at-risk students

**Alerts Show**:
- Students identified as high-risk
- Risk score/percentage
- Contributing factors
- Recommended interventions
- Assigned personas (context)
- Action items for educators

#### **5. Fairness** (`src/pages/Fairness.tsx`)
**Overview**: Bias detection and fairness audit

**Analyzes**:
- Demographic representation: Gender, family income, school type
- Performance gaps across groups
- Burnout distribution by demographic
- Engagement disparities
- Flags potential biases
- Recommendations for equitable support

**Fairness Metrics**:
- Statistical parity
- Disparate impact ratio
- Equalized odds
- Calibration across groups

#### **6. Reports** (`src/pages/Reports.tsx`)
**Overview**: Comprehensive reporting and export

**Report Types**:
- Summary class report
- Individual student detailed reports
- Persona distribution analysis
- Fairness audit report
- PDF export functionality
- Downloadable datasets

### UI Components Used

**Radix UI Components** (from `src/components/ui/`):
- `card.tsx`: Data containers
- `button.tsx`: Interactive actions
- `dialog.tsx`: Modals and popups
- `select.tsx`: Class selection dropdown
- `badge.tsx`: Status indicators
- `progress.tsx`: Risk level visualization
- `tabs.tsx`: Multi-section views
- `chart.tsx`: Data visualization
- `alert.tsx`, `alert-dialog.tsx`: Notifications
- And many more...

### Chart Components (`src/components/dashboard/Charts.tsx`)
- **ClusterPieChart**: Distribution of students across personas
- **FeatureImportanceChart**: Bar chart of predictive features

### State Management

**Context API** (`src/contexts/ClassContext.tsx`):
```typescript
interface ClassContextType {
  selectedClass: string;
  setSelectedClass: (className: string) => void;
}
```

**React Query**: Server state management for API calls
```typescript
const query = useQuery({
  queryKey: ['endpoint', params],
  queryFn: async () => await api.fetch(...),
  staleTime: 5 * 60 * 1000
})
```

### Custom Hooks (`src/hooks/`)

- `use-api.ts`: API interaction utilities
- `use-mobile.ts`: Responsive design detection
- `use-toast.ts`: Toast notification system

---

## Technology Stack

### **Backend**
| Technology | Version | Purpose |
|:-----------|:--------|:------------------------------|
| **Flask** | 3.0.3 | Web framework, REST API |
| **Flask-CORS** | 5.0.0 | Cross-origin resource handling |
| **Pandas** | 2.2.3 | Data manipulation & analysis |
| **NumPy** | 2.0.2 | Numerical computations |
| **Scikit-Learn** | 1.6.0 | ML models (Huber, K-Means) |
| **Joblib** | 1.4.2 | Model serialization |
| **Google Generative AI** | 0.8.3 | Gemini API integration |
| **python-dotenv** | 1.0.1 | Environment variables |
| **Faker** | 25.9.2 | Mock data generation |

**Python Version**: 3.9+

### **Frontend**
| Technology | Version | Purpose |
|:-----------|:--------|:------------------------------|
| **React** | 18.3.1 | UI library |
| **TypeScript** | Latest | Type-safe code |
| **Vite** | Latest | Build tool |
| **Tailwind CSS** | Latest | Utility-first CSS |
| **Radix UI** | Multiple | Accessible components |
| **React Router** | 6.30.1 | Client-side routing |
| **React Query** | 5.83.0 | Server state management |
| **Recharts** | 2.15.4 | Chart visualization |
| **React Hook Form** | 7.61.1 | Form handling |
| **Zod** | 3.25.76 | Data validation |
| **Sonner** | 1.7.4 | Toast notifications |
| **html2canvas + jsPDF** | Latest | PDF export |

**Node Version**: 18+

---

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn package manager
- Git

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create .env file with:
# GOOGLE_API_KEY=your_gemini_api_key
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install

# Configure API endpoint in .env
echo "VITE_API_URL=http://localhost:5000" > .env.local
```

### Data Preparation

```bash
# Navigate to data preparation scripts
cd backend/Data\ Preparing

# Run scripts in order:
python 1_data_cleaner.py
python 2_mathematical_feature_engineering.py
python 3_datasets_combining_script.py
python 4_final_dataset_script.py
python 5_feature_selection_RFE.py

# Generate student personas
cd ../clustering
python K_means_clustering.py
```

### Running the Application

**Terminal 1 - Backend Server**:
```bash
cd backend
python main.py
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend Development**:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Building for Production**:
```bash
# Backend
# Adapt main.py for production server (Gunicorn recommended)

# Frontend
npm run build
# Output: frontend/dist/
```

---

## Usage Guide

### For Educators

#### 1. **Upload Student Data**
- Navigate to Dashboard
- Use CSV upload tool
- Select file with student metrics
- System automatically:
  - Cleans and validates data
  - Extracts 21 engineered features
  - Retrains models
  - Updates all dashboards

#### 2. **Monitor Class Performance**
- Check Dashboard for class averages
- Identify high-risk students via Warnings page
- View individual student profiles in Students page
- Compare personas on Clusters page

#### 3. **Detect at-Risk Students**
- Go to Warnings page
- Review list of flagged students
- Click on student for details
- Implement recommended interventions

#### 4. **Check Fairness & Bias**
- Navigate to Fairness page
- Review demographic breakdowns
- Check for statistically significant gaps
- Use insights to design equitable support

#### 5. **Generate Reports**
- Go to Reports page
- Select report type
- Customize date range/filters
- Export as PDF or CSV

#### 6. **What-If Analysis**
- Go to Student profile
- Hypothetically change a metric (e.g., study hours +5)
- See predicted score impact
- Plan interventions targeting high-impact factors

#### 7. **Use AI Chat**
- Open ChatBot sidebar
- Ask questions about data/insights
- Query specific students or personas
- Get AI-powered recommendations

---

## API Endpoints

### Health & Status
```
GET /api/health
Response: {"status": "ok", "timestamp": "2026-02-28T..."}
```

### Clusters & Personas
```
GET /api/clusters?className=10-A
Response: {"clusters": [{name: "...", count: N, ...}, ...]}

GET /api/clusters/summary?className=10-A
Response: {"clusters": [...]}
```

### Student Data
```
GET /api/students?className=10-A
Response: {"students": [{id, name, score, persona, ...}, ...]}

GET /api/student/<index>
Response: {full student profile with all metrics}

GET /api/student/<index>/timeline
Response: {historical performance data}
```

### Analytics & Predictions
```
GET /api/summary-report?className=10-A
Response: {comprehensive class statistics}

GET /api/feature-importance
Response: {"importance": [{feature: name, value: N}, ...]}

GET /api/fairness-audit?className=10-A
Response: {demographic parity metrics and flags}

GET /api/early-warnings?className=10-A
Response: {"atRisk": [{student, riskScore, factors}, ...]}
```

### Predictions
```
POST /api/predict
Body: {raw or engineered student features}
Response: {"predictedScore": N, "predictedPersona": "..."}

POST /api/what-if
Body: {"original": {...}, "changes": {...}}
Response: {"originalScore": N, "modifiedScore": N, "impact": N}
```

### Data Upload
```
POST /api/upload-csv
Body: FormData with CSV file
Response: {rows_processed, status, new_model_metrics}
```

### AI Integration
```
POST /api/gemini/chat
Body: {"message": "user question"}
Response: {"reply": "AI-generated response"}
```

---

## Model Benchmarking

### Linear Regression Comparison (`Benchmarking/linear_regression_benchmarking.py`)

The system evaluates multiple linear models to ensure **Huber Regressor** is optimal:

#### Models Compared
1. **Standard Linear (OLS)**: Ordinary Least Squares
2. **Ridge (L2)**: L2 regularization for stability
3. **Lasso (L1)**: Sparse feature selection
4. **ElasticNet (L1+L2)**: Balanced regularization
5. **Huber (Robust)**: Outlier-resistant regression

#### Evaluation Methodology
- **Cross-Validation**: 5-Fold stratified split
- **Train/Test**: 80/20 ratio per fold
- **Metrics**:
  - **R² Score**: Proportion of variance explained (0-1, higher=better)
  - **RMSE**: Root mean squared error in points (lower=better)
  - **MAE**: Mean absolute error in points (lower=better)

#### Typical Benchmark Results
```
Model                R² Score    RMSE      MAE
Huber (Robust)       0.745       8.32      6.21
Ridge (L2)           0.738       8.51      6.45
ElasticNet           0.735       8.67      6.58
Lasso (L1)           0.720       9.12      6.89
Standard Linear      0.698       9.87      7.34
```

#### Why Huber Wins
- **Robustness**: Handles outlier exam scores gracefully
- **Generalization**: Validates well on unseen data
- **Interpretability**: Simple coefficient interpretation
- **Practical**: Fast inference for real-time predictions

**Run Benchmark**:
```bash
cd backend/Benchmarking
python linear_regression_benchmarking.py
```

---

## Model Performance & Insights

### Huber Regression Performance
- **Average R²**: ~0.74 (explains 74% of score variance)
- **Average RMSE**: ~8.3 points (typical error range)
- **Average MAE**: ~6.2 points (average deviation)

### K-Means Clustering Quality
- **Silhouette Score**: ~0.58 (good cluster separation)
- **Inertia**: Minimized through k-means++ initialization
- **Interpretability**: All 4 personas clearly distinct

---

## Project Structure

```
Learning-Patterns-Dashboard/
├── backend/
│   ├── main.py                 # Flask API entry point
│   ├── ML.py                   # Huber regression pipeline
│   ├── clustering.py           # K-Means & personas
│   ├── gemini_service.py       # AI chat integration
│   ├── requirements.txt        # Python dependencies
│   ├── Benchmarking/
│   │   ├── linear_regression_benchmarking.py
│   │   └── ML_benchmarking.py
│   ├── clustering/
│   │   └── K_means_clustering.py
│   ├── data/
│   │   ├── Student_data.csv (raw)
│   │   ├── cleaned_student_data.csv
│   │   ├── formulated_student_data.csv
│   │   ├── combined_student_data.csv
│   │   ├── final_dataset.csv
│   │   ├── optimised_final_dataset.csv
│   │   └── dashboard_ready_student_data_kmeans.csv
│   ├── Data\ Preparing/
│   │   ├── 1_data_cleaner.py
│   │   ├── 2_mathematical_feature_engineering.py
│   │   ├── 3_datasets_combining_script.py
│   │   ├── 4_final_dataset_script.py
│   │   └── 5_feature_selection_RFE.py
│   └── models/
│       ├── huber_pipeline.pkl
│       ├── kmeans_model.pkl
│       └── kmeans_preprocessor.pkl
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clusters.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Warnings.tsx
│   │   │   ├── Fairness.tsx
│   │   │   └── Reports.tsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   ├── chat/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   ├── use-api.ts
│   │   │   ├── use-mobile.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── nameGenerator.ts
│   │   │   └── utils.ts
│   │   ├── contexts/
│   │   │   └── ClassContext.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── README.md (this file)
```

---

## Key Features Explained in Detail

### 🎓 Feature Engineering Rationale

Each of the 21 engineered features targets a specific learning dimension:

**Learning Intensity**:
- `Study_Density_Factor`: Concentrated effort over time
- `Study_to_Sleep_Ratio`: Balance between work and rest
- `Holistic_Effort`: Total energy investment

**Academic Efficacy**:
- `Academic_Velocity`: Performance per unit of study time
- `Tutoring_Impact`: Multiplier effect of external help
- `Effort_Efficiency_Index`: ROI on academic work

**Sustainability & Wellness**:
- `Burnout_Risk`: Exhaustion likelihood score
- `Fatigue_Factor`: Sleep debt accumulation
- `Overall_Wellbeing_Index`: Holistic health metric

**Performance Trajectory**:
- `Academic_Momentum`: Sustained performance
- `Score_Gap_Potential`: Improvement opportunity
- `Log_Hours_Studied`: Non-linear study pattern

### Clustering in Context

K-Means transforms continuous features into discrete personas:

```
Continuous Metrics          K-Means Clustering          Personas
(15+ features)           →  (4 clusters)           → (4 archetypes)

High burnout/              Cluster 0
high engagement                                    → Overworked Achiever
           
Moderate metrics           Cluster 1             → Balanced Achiever

Low burnout/               Cluster 2             → Developing Learner
moderate engagement    
             
Low engagement/           Cluster 3             → Disengaged Learner
low performance
```

**Pedagogical Value**:
- Enables targeted interventions
- Helps educators remember student profiles
- Facilitates peer grouping
- Supports resource allocation

### Fairness in AI Systems

The system incorporates fairness checks to prevent algorithmic bias:

**What's Analyzed**:
- Gender disparities in performance predictions
- Family income impact on model accuracy
- School type effects
- Learning disability representation

**Fairness Definitions Used**:
- **Statistical Parity**: Equal representation & outcomes
- **Disparate Impact**: Identify unequal effects
- **Equalized Odds**: Equal true positive rates across groups
- **Predictive Parity**: Similar model accuracy across groups

**Output**: Fairness audit with flags and recommendations

---

## Advanced Usage

### 1. Custom Model Retraining

```python
from ML import retrain_model_with_new_data
import pandas as pd

new_students_df = pd.read_csv('new_data.csv')
record_count = retrain_model_with_new_data(new_students_df)
print(f"Model updated with {record_count} total records")
```

### 2. What-If Scenario Analysis

```bash
curl -X POST http://localhost:5000/api/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "original": {
      "hoursStudied": 5,
      "attendance": 85,
      "sleepHours": 7
    },
    "changes": {
      "hoursStudied": 8
    }
  }'
```

Response shows predicted score change from increased study time.

### 3. Exporting Full Analytics Report

```bash
# Backend generates comprehensive JSON report
curl http://localhost:5000/api/summary-report?className=10-A > report.json

# Frontend converts to PDF with charts
# See Reports page for export functionality
```

### 4. Integrating with External Systems

The REST API allows integration with:
- Student Information Systems (SIS)
- Learning Management Systems (LMS)
- School ERP software
- Data warehouses

---

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/atharvamankar17/Learning-Patterns-Dashboard.git
   cd Learning-Patterns-Dashboard
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow existing code style
   - Add type hints (Python & TypeScript)
   - Include docstrings/comments

4. **Test Locally**
   - Run backend tests
   - Test API endpoints
   - Check frontend component rendering

5. **Commit & Push**
   ```bash
   git commit -am "Clear description of changes"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Describe changes and rationale
   - Link related issues
   - Request review

