from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import pandas as pd
import io
import traceback
import ML
import clustering
from gemini_service import gemini_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.register_blueprint(gemini_bp)

INTERVENTIONS = []

print("Initializing AI Backend...")
try:
    ML.init_ml(retrain=False)
    clustering.init_clustering(retrain=False)
    print("ML and Clustering Engines Online!")
except Exception as e:
    print(f"Warning during startup: {e}")

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route("/api/clusters/summary", methods=["GET"])
@app.route("/api/clusters", methods=["GET"])
def cluster_summary():
    class_name = request.args.get("className")
    return jsonify({"clusters": clustering.get_cluster_summary(class_name)})

@app.route("/api/early-warnings", methods=["GET"])
def early_warnings():
    class_name = request.args.get("className")
    return jsonify({"atRisk": clustering.get_early_warnings(class_name)})

@app.route("/api/students", methods=["GET"])
def get_students_list():
    class_name = request.args.get("className")
    return jsonify({"students": clustering.get_all_students(class_name)})

@app.route("/api/student/<int:index>", methods=["GET"])
def get_student(index):
    student_data = clustering.get_student_by_index(index)
    if not student_data:
        return jsonify({"error": "Student index out of range"}), 404
    return jsonify(student_data)

@app.route("/api/student/<int:index>/timeline", methods=["GET"])
def student_timeline(index):
    student = clustering.get_student_by_index(index)
    if not student:
        return jsonify({"error": "Invalid index"}), 404
    return jsonify(clustering.get_mock_timeline(student))

@app.route("/api/summary-report", methods=["GET"])
def summary_report():
    class_name = request.args.get("className")
    return jsonify(clustering.get_summary_report(class_name))

@app.route("/api/fairness-audit", methods=["GET"])
def fairness_audit():
    class_name = request.args.get("className")
    return jsonify(clustering.compute_fairness(class_name))

@app.route("/api/feature-importance", methods=["GET"])
def feature_importance():
    return jsonify({"importance": ML.get_feature_importance()})

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No student data provided"}), 400
    try:
        predicted_score = ML.predict_score(data)
        predicted_persona = clustering.predict_persona(data)
        
        return jsonify({
            "predictedScore": predicted_score,
            "predictedPersona": predicted_persona
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/what-if", methods=["POST"])
def what_if():
    payload = request.get_json()
    if not payload or "original" not in payload or "changes" not in payload:
        return jsonify({"error": "Missing 'original' or 'changes'"}), 400

    original = payload["original"].copy()
    modified = original.copy()
    modified.update(payload["changes"])

    try:
        orig_score = ML.predict_score(original)
        mod_score = ML.predict_score(modified)
        
        orig_persona = clustering.predict_persona(original)
        mod_persona = clustering.predict_persona(modified)
        
        return jsonify({
            "original": orig_score,
            "new": mod_score,
            "difference": round(mod_score - orig_score, 1),
            "originalPersona": orig_persona,
            "newPersona": mod_persona,
            "personaChanged": orig_persona != mod_persona
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/upload-data", methods=["POST"])
def upload_data():
    if 'csv' not in request.files:
        return jsonify({"error": "No CSV file provided"}), 400

    file = request.files['csv']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        content = file.read().decode('utf-8', errors='replace')
        new_df = pd.read_csv(io.StringIO(content))
        
        new_total = ML.retrain_model_with_new_data(new_df)
        
        return jsonify({
            "success": True,
            "newStudentsUploaded": len(new_df),
            "totalStudentsNow": new_total
        })
    except Exception as e:
        print("Upload error:\n", traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/interventions", methods=["GET"])
def get_interventions():
    return jsonify({"interventions": INTERVENTIONS})

@app.route("/api/intervention", methods=["POST"])
def add_intervention():
    data = request.get_json()
    if not data or "studentIndex" not in data or "strategy" not in data or "outcome" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    INTERVENTIONS.append(data)
    return jsonify({"success": True, "interventionId": len(INTERVENTIONS) - 1})

if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")
