WEIGHTS = {"HIGH": 25, "MEDIUM": 10, "LOW": 3}


def calculate_risk(findings):
    """Return a 0-100 risk score and a risk level for a list of findings."""
    score = min(100, sum(WEIGHTS.get(f["severity"], 0) for f in findings))

    if score == 0:
        level = "Safe"
    elif score < 25:
        level = "Low"
    elif score < 50:
        level = "Medium"
    elif score < 75:
        level = "High"
    else:
        level = "Critical"

    return {"score": score, "level": level}