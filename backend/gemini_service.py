from flask import Blueprint, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

gemini_bp = Blueprint('gemini', __name__, url_prefix='/api/gemini')

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")  # fallback

if not api_key:
    raise ValueError("GEMINI_API_KEY missing in .env")

genai.configure(api_key=api_key)

safety_settings = [
    {"category": "HARM_CATEGORY_HATE_SPEECH",     "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HARASSMENT",      "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT","threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT","threshold": "BLOCK_ONLY_HIGH"},
]

def get_model():
    return genai.GenerativeModel(
        model_name=model_name,
        safety_settings=safety_settings,
        generation_config={
            "temperature": 0.65,
            "top_p": 0.92,
            "max_output_tokens": 1800,    
        }
    )

@gemini_bp.route("/explain-student", methods=["POST"])
def explain_student():
    payload = request.get_json()
    if not payload or "student_data" not in payload:
        return jsonify({"error": "Missing student_data"}), 400

    student = payload["student_data"]

    prompt = f"""
You are an experienced, supportive educational advisor helping a teacher understand a student.

Write a complete, detailed explanation (500–800 words) — do not cut off, summarize early, or stop mid-sentence.

STRICT FORMATTING RULES — YOU MUST FOLLOW THESE EXACTLY:
- Do NOT use ANY Markdown or formatting symbols at all.
- Do NOT use **bold**, *italics*, __underline__, `code`, # headings, - dashes, * stars, 1. numbers, > quotes, - bullets, or any other special characters for emphasis, lists, or structure.
- Write ONLY plain normal text with no formatting.
- Separate paragraphs with ONE blank line.
- Do not use any symbols, asterisks, dashes, numbers, or bold/italic markers — plain text paragraphs only.
- The entire response must be continuous readable paragraphs like a normal letter or email — no lists, no bold, no italics, no formatting.
- Never use any kind of formatting — plain text only.

Student data:
{json.dumps(student, indent=2)}

Write the response in this structure using plain paragraphs only (no numbers, no bullets):
Opening summary: current performance and how well they fit their cluster.
Key positive factors and strengths the teacher can build on.
Main contributing challenges or risk factors (be factual, kind, and non-judgmental).
Actionable insights and 2–3 specific, practical recommendations.
Closing encouraging note for the teacher and student.

Use natural, empathetic, professional language. Refer to specific data points (attendance, study hours, family income, etc.). Make sure the response is complete, flows naturally, and ends properly — never truncate or use formatting.
"""

    try:
        model = get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        print("\n" + "="*100)
        print("Gemini EXPLAIN full raw response (plain text only):")
        print(text)
        print("="*100 + "\n")

        return jsonify({"explanation": text})
    except Exception as e:
        print("Gemini explain error:", str(e))
        return jsonify({"error": str(e)}), 500


@gemini_bp.route("/generate-strategy", methods=["POST"])
def generate_strategy():
    payload = request.get_json()
    cluster_name = payload.get("cluster_name", "Unknown Cluster")
    student = payload["student_data"]
    past = payload.get("past_interventions", [])

    past_text = f"\nPrevious interventions and outcomes:\n{json.dumps(past, indent=2)}\n" if past else ""

    prompt = f"""
You are a creative, realistic education strategist.

Student in cluster: {cluster_name}

Data:
{json.dumps(student, indent=2)}{past_text}

Generate 4–5 practical, differentiated intervention ideas the teacher can realistically implement.
- At least one low/no-cost
- At least one that uses technology (most students have internet access)
- At least one involving peers or family (when appropriate)
- Each idea: 3–5 sentences, clear action steps

STRICT FORMATTING RULES — FOLLOW EXACTLY:
- Do NOT use ANY Markdown or formatting symbols at all.
- Do NOT use **bold**, *italics*, __underline__, `code`, # headings, - dashes, * stars, 1. numbered lists, > quotes, - bullets, or any special characters.
- Write ONLY plain normal text.
- Separate each idea with TWO blank lines.
- No formatting symbols of any kind — plain paragraphs only.
- The response must be continuous readable text — no lists, no bold, no italics, no numbers.

Write the ideas as plain paragraphs separated by blank lines. Do not truncate or cut off.
"""

    try:
        model = get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        print("\n" + "="*100)
        print("Gemini STRATEGY full raw response (plain text only):")
        print(text)
        print("="*100 + "\n")

        return jsonify({"strategies": text})
    except Exception as e:
        print("Gemini strategy error:", str(e))
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────
# Teacher Chatbot — with full school data context
# ─────────────────────────────────────────────────────────────────

def _build_school_context(class_name: str | None) -> str:
    """Builds a rich school data snapshot to inject as the Gemini system context."""
    try:
        import clustering
        summary   = clustering.get_summary_report(class_name)
        clusters  = clustering.get_cluster_summary(class_name)
        warnings  = clustering.get_early_warnings(class_name)
        fairness  = clustering.compute_fairness(class_name)
        students  = clustering.get_all_students(class_name)
    except Exception as e:
        return f"(School data unavailable: {e})"

    scope = class_name if class_name and class_name != "School" else "the whole school"

    # Format at-risk students as a readable list
    at_risk_lines = []
    for w in warnings[:20]:  # cap to 20 so context isn't bloated
        name = w.get("name") or f"Student #{w.get('index', '?')}"
        score = w.get("score") or w.get("Exam_Score", "?")
        cluster = w.get("clusterName") or w.get("cluster", "?")
        issues = ", ".join(w.get("issues", [])) or "low performance"
        at_risk_lines.append(f"  - {name} | Score: {score} | Cluster: {cluster} | Issues: {issues}")

    # Format cluster breakdown
    cluster_lines = []
    for c in clusters:
        cluster_lines.append(
            f"  - {c.get('name','?')}: {c.get('count','?')} students, avg score {c.get('avgScore','?')}"
        )

    # Fairness summary
    fairness_lines = []
    for group, data in fairness.items():
        if group in ("status", "message"):
            continue
        flag = data.get("flag", "?")
        ratio = data.get("ratio", "?")
        fairness_lines.append(f"  - {group}: ratio={ratio}, flag={flag}")

    # Top/bottom students
    sorted_students = sorted(students, key=lambda s: s.get("examScore") or s.get("Exam_Score") or 0, reverse=True)
    top5  = sorted_students[:5]
    bot5  = sorted_students[-5:]

    def student_line(s):
        name  = s.get("name") or f"Student #{s.get('index','?')}"
        score = s.get("examScore") or s.get("Exam_Score", "?")
        cluster = s.get("clusterName") or "?"
        return f"  - {name} | Score: {score} | Cluster: {cluster}"

    context = f"""
=== SCHOOL DATA CONTEXT — {scope.upper()} ===

SUMMARY STATISTICS:
  Total students: {summary.get('totalStudents', '?')}
  Average exam score: {summary.get('avgScore', '?')}
  At-risk count: {summary.get('atRiskCount', '?')}
  Average attendance: {summary.get('avgAttendance', '?')}%
  Average study hours/week: {summary.get('avgStudyHours', '?')}
  Average sleep hours/night: {summary.get('avgSleepHours', '?')}
  Average tutoring sessions: {summary.get('avgTutoringSessions', '?')}

PERSONA CLUSTERS:
{chr(10).join(cluster_lines) or '  (none)'}

AT-RISK STUDENTS ({len(warnings)} total, showing up to 20):
{chr(10).join(at_risk_lines) or '  (none)'}

ALGORITHMIC FAIRNESS AUDIT:
{chr(10).join(fairness_lines) or '  (none)'}

TOP 5 PERFORMERS:
{chr(10).join(student_line(s) for s in top5)}

BOTTOM 5 PERFORMERS:
{chr(10).join(student_line(s) for s in bot5)}
""".strip()

    return context


@gemini_bp.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json()
    if not payload or "message" not in payload:
        return jsonify({"error": "Missing 'message'"}), 400

    message    = payload["message"]
    history    = payload.get("history", [])   # list of {role, text}
    class_name = payload.get("className")     # e.g. "10-A" or "School"

    school_ctx = _build_school_context(class_name)

    system_prompt = f"""You are PRAXIS AI — an intelligent, warm, and data-driven assistant built specifically for teachers.

Your job is to help teachers understand their students better, identify patterns, spot at-risk learners, and make evidence-based decisions. You have been given a live snapshot of school data below.

SCHOOL DATA (current, live):
{school_ctx}

INSTRUCTIONS:
- Answer questions using the school data above. Be specific — reference student names, scores, clusters, and trends.
- When asked about at-risk students, list them with their relevant issues.
- Be concise but thorough. Bullet points are fine for lists, but write prose for analysis.
- If asked something outside the data you have, say so honestly and offer what you can infer.
- Always be empathetic and professional — you are supporting educators, not judging students.
- Never fabricate student data. Only use what's provided above.
- Keep responses focused and scannable. Avoid walls of text.
"""

    # Build Gemini chat history
    chat_history = []
    for turn in history:
        role = "user" if turn.get("role") == "user" else "model"
        chat_history.append({"role": role, "parts": [turn.get("text", "")]})

    try:
        model = get_model()
        chat_session = model.start_chat(history=chat_history)
        full_message = f"{system_prompt}\n\nTeacher: {message}"
        response = chat_session.send_message(full_message)
        reply = response.text.strip()
        return jsonify({"reply": reply})
    except Exception as e:
        print("Gemini chat error:", str(e))
        return jsonify({"error": str(e)}), 500