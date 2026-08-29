from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime
from pathlib import Path


# ==========================================
# APP SETUP
# ==========================================

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "uddhaar.db"


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

def init_db():

    conn = get_db_connection()
    cursor = conn.cursor()

    # FOOD RESCUES
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_rescues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            food_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            food_type TEXT NOT NULL,
            location TEXT NOT NULL,
            expiry TEXT NOT NULL,
            contact TEXT NOT NULL,
            priority TEXT NOT NULL,
            score INTEGER NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL
        )
    """)

    # SOS REPORTS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sos_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emergency_type TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            people_affected INTEGER DEFAULT 0,
            priority TEXT NOT NULL,
            score INTEGER NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL
        )
    """)

    # CIVIC REPORTS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS civic_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_type TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL,
            impact TEXT NOT NULL,
            priority TEXT NOT NULL,
            score INTEGER NOT NULL,
            status TEXT DEFAULT 'open',
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# ==========================================
# SMART PRIORITY ENGINE
# ==========================================

def calculate_priority(data):

    report_type = str(data.get("type", "")).lower()

    score = 0

    # --------------------------------------
    # EMERGENCY PRIORITY
    # --------------------------------------

    if report_type == "emergency":

        emergency_type = str(
            data.get("emergencyType", "")
        ).lower()

        emergency_scores = {

            "medical emergency": 90,
            "medical": 90,

            "fire": 85,

            "accident": 85,

            "flood or natural disaster": 95,
            "flood": 95,
            "disaster": 95,

            "safety threat": 90,
            "violence": 95,

            "other": 60
        }

        score += emergency_scores.get(
            emergency_type,
            60
        )

        try:
            people_affected = int(
                data.get("peopleAffected", 0)
            )
        except (ValueError, TypeError):
            people_affected = 0

        if people_affected >= 100:
            score += 30

        elif people_affected >= 50:
            score += 20

        elif people_affected >= 10:
            score += 10

        elif people_affected >= 1:
            score += 5


    # --------------------------------------
    # FOOD RESCUE PRIORITY
    # --------------------------------------

    elif report_type == "food":

        try:
            hours_remaining = float(
                data.get("hoursRemaining", 24)
            )
        except (ValueError, TypeError):
            hours_remaining = 24

        if hours_remaining <= 2:
            score += 90

        elif hours_remaining <= 6:
            score += 70

        elif hours_remaining <= 12:
            score += 50

        else:
            score += 25

        try:
            quantity = int(
                data.get("quantity", 0)
            )
        except (ValueError, TypeError):
            quantity = 0

        if quantity >= 100:
            score += 20

        elif quantity >= 50:
            score += 15

        elif quantity >= 10:
            score += 10


    # --------------------------------------
    # CIVIC PRIORITY
    # --------------------------------------

    elif report_type == "civic":

        impact = str(
            data.get("impact", "")
        ).lower()

        civic_scores = {

            "low — minor inconvenience": 20,
            "low": 20,

            "medium — community impact": 45,
            "medium": 45,

            "high — safety concern": 70,
            "high": 70,

            "critical — immediate danger": 95,
            "critical": 95
        }

        score += civic_scores.get(
            impact,
            30
        )


    # --------------------------------------
    # FINAL PRIORITY
    # --------------------------------------

    if score >= 90:
        priority = "critical"

    elif score >= 70:
        priority = "high"

    elif score >= 40:
        priority = "medium"

    else:
        priority = "low"


    return {
        "priority": priority,
        "score": score
    }


# ==========================================
# HOME / SERVER STATUS
# ==========================================

@app.route("/")
def home():

    return jsonify({
        "status": "UDDHAAR backend is running",
        "message": "Response network backend is online"
    })


# ==========================================
# PRIORITY ANALYSIS API
# ==========================================

@app.route("/analyze-priority", methods=["POST"])
def analyze_priority():

    data = request.get_json(silent=True) or {}

    result = calculate_priority(data)

    return jsonify({
        "success": True,
        "priority": result["priority"],
        "score": result["score"],
        "message": (
            f"UDDHAAR analysis completed. "
            f"Priority level: "
            f"{result['priority'].upper()}"
        )
    })


# ==========================================
# FOOD RESCUE APIs
# ==========================================

@app.route("/food-rescues", methods=["POST"])
def create_food_rescue():

    data = request.get_json(silent=True) or {}

    required_fields = [
        "foodName",
        "quantity",
        "foodType",
        "location",
        "expiry",
        "contact"
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "success": False,
                "message": f"{field} is required"
            }), 400


    # Calculate remaining hours

    try:
        expiry_time = datetime.fromisoformat(
            data["expiry"]
        )

        hours_remaining = (
            expiry_time - datetime.now()
        ).total_seconds() / 3600

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Invalid expiry date"
        }), 400


    # Smart priority analysis

    analysis = calculate_priority({
        "type": "food",
        "hoursRemaining": hours_remaining,
        "quantity": data["quantity"]
    })


    # Save to database

    conn = get_db_connection()

    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO food_rescues (
            food_name,
            quantity,
            food_type,
            location,
            expiry,
            contact,
            priority,
            score,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["foodName"],
        int(data["quantity"]),
        data["foodType"],
        data["location"],
        data["expiry"],
        data["contact"],
        analysis["priority"],
        analysis["score"],
        "active",
        datetime.now().isoformat()
    ))

    rescue_id = cursor.lastrowid

    conn.commit()
    conn.close()


    return jsonify({
        "success": True,

        "message":
            "Food rescue created successfully",

        "rescue": {
            "id": rescue_id,
            "foodName": data["foodName"],
            "quantity": data["quantity"],
            "foodType": data["foodType"],
            "location": data["location"],
            "expiry": data["expiry"],
            "contact": data["contact"],
            "priority": analysis["priority"],
            "score": analysis["score"],
            "status": "active"
        }
    }), 201


# ==========================================
# GET ACTIVE FOOD RESCUES
# ==========================================

@app.route("/food-rescues", methods=["GET"])
def get_food_rescues():

    conn = get_db_connection()

    rows = conn.execute("""
        SELECT *
        FROM food_rescues
        WHERE status = 'active'
        ORDER BY score DESC, created_at DESC
    """).fetchall()

    conn.close()


    rescues = []

    for row in rows:

        rescues.append({
            "id": row["id"],
            "foodName": row["food_name"],
            "quantity": row["quantity"],
            "foodType": row["food_type"],
            "location": row["location"],
            "expiry": row["expiry"],
            "contact": row["contact"],
            "priority": row["priority"],
            "score": row["score"],
            "status": row["status"],
            "createdAt": row["created_at"]
        })


    return jsonify({
        "success": True,
        "count": len(rescues),
        "rescues": rescues
    })


# ==========================================
# CLAIM FOOD RESCUE
# ==========================================

@app.route("/food-rescues/<int:rescue_id>/claim", methods=["POST"])
def claim_food_rescue(rescue_id):

    conn = get_db_connection()

    rescue = conn.execute("""
        SELECT *
        FROM food_rescues
        WHERE id = ?
    """, (rescue_id,)).fetchone()


    if not rescue:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Food rescue not found"
        }), 404


    if rescue["status"] != "active":

        conn.close()

        return jsonify({
            "success": False,
            "message": "This rescue is no longer available"
        }), 400


    conn.execute("""
        UPDATE food_rescues
        SET status = 'claimed'
        WHERE id = ?
    """, (rescue_id,))

    conn.commit()
    conn.close()


    return jsonify({
        "success": True,
        "message": "Food rescue successfully claimed"
    })

# ==========================================
# LIVE IMPACT DASHBOARD
# ==========================================

@app.route("/dashboard", methods=["GET"])
def dashboard():

    conn = get_db_connection()

    # Total quantity of successfully claimed food
    meals_rescued = conn.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM food_rescues
        WHERE status = 'claimed'
    """).fetchone()[0]


    # Number of successful rescue connections
    successful_connections = conn.execute("""
        SELECT COUNT(*)
        FROM food_rescues
        WHERE status = 'claimed'
    """).fetchone()[0]


    # Number of currently active food rescues
    active_rescues = conn.execute("""
        SELECT COUNT(*)
        FROM food_rescues
        WHERE status = 'active'
    """).fetchone()[0]


    conn.close()


    return jsonify({
        "success": True,

        "dashboard": {
            "mealsSaved": meals_rescued,
            "claimedListings": successful_connections,
            "activeListings": active_rescues
        }
    })

# ==========================================
# DATABASE TEST API
# ==========================================

@app.route("/health")
def health():

    return jsonify({
        "success": True,
        "server": "online",
        "database": "connected"
    })


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    init_db()

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )