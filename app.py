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

    data = request.get_json()

    report_type = data.get("type", "")
    urgency = data.get("urgency", "")
    people_affected = data.get("peopleAffected", 0)

    score = 0


    # EMERGENCY PRIORITY

    if report_type == "emergency":

        if urgency == "critical":
            score += 70

        elif urgency == "high":
            score += 50

        elif urgency == "medium":
            score += 30


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

        hours_remaining = data.get(
            "hoursRemaining",
            24
        )

        try:
            hours_remaining = float(
                hours_remaining
            )

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