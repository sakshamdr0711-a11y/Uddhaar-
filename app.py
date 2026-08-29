from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "status": "UDDHAR backend is running"
    })


@app.route("/analyze-priority", methods=["POST"])
def analyze_priority():

    data = request.get_json(silent=True) or {}
    report_type = str(data.get("type", "")).lower()
    urgency = data.get("urgency", "")
    emergency_type = str(data.get("emergencyType", "")).lower()
    people_affected = data.get("peopleAffected", 0)

    score = 0

    # EMERGENCY PRIORITY
    if report_type == "emergency":
        emergency_scores = {
            "fire": 80,
            "medical": 90,
            "accident": 85,
            "disaster": 95,
            "flood": 90,
            "violence": 95,
            "other": 50
        }

        score += emergency_scores.get(emergency_type, 50)

    # PEOPLE AFFECTED
    try:
        people_affected = int(people_affected)
    except (ValueError, TypeError):
        people_affected = 0

    if people_affected >= 100:
        score += 30
    elif people_affected >= 50:
        score += 20
    elif people_affected >= 10:
        score += 10

    # FOOD RESCUE
    if report_type == "food":
        hours_remaining = data.get("hoursRemaining", 24)

        try:
            hours_remaining = float(hours_remaining)
        except (ValueError, TypeError):
            hours_remaining = 24

        if hours_remaining <= 2:
            score += 80
        elif hours_remaining <= 6:
            score += 60
        elif hours_remaining <= 12:
            score += 40
        else:
            score += 20

    # FINAL PRIORITY
    if score >= 70:
        priority = "critical"
    elif score >= 50:
        priority = "high"
    elif score >= 30:
        priority = "medium"
    else:
        priority = "low"

    return jsonify({
        "priority": priority,
        "score": score,
        "message": (
            f"UDDHAR analysis completed. "
            f"Priority level: {priority.upper()}"
        )
    })


if __name__ == "__main__":
    app.run(debug=True)