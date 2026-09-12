from typing import Dict


ALERT_MESSAGES: Dict[str, Dict[str, str]] = {
    "Low": {
        "English": "Landslide risk is currently low. Continue normal monitoring.",
        "Hindi": "भूस्खलन का जोखिम वर्तमान में कम है। सामान्य निगरानी जारी रखें।",
        "Assamese": "ভূমিস্খলনৰ আশংকা বৰ্তমান কম। সাধাৰণ নিৰীক্ষণ অব্যাহত ৰাখক।",
    },
    "Medium": {
        "English": "Moderate landslide risk detected. Stay alert and monitor weather conditions.",
        "Hindi": "मध्यम भूस्खलन जोखिम पाया गया है। सतर्क रहें और मौसम की स्थिति पर नजर रखें।",
        "Assamese": "মধ্যমীয়া ভূমিস্খলনৰ আশংকা ধৰা পৰিছে। সতৰ্ক থাকক আৰু বতৰৰ পৰিস্থিতি নিৰীক্ষণ কৰক।",
    },
    "High": {
        "English": "High landslide risk detected. Avoid vulnerable slopes and follow local advisories.",
        "Hindi": "उच्च भूस्खलन जोखिम पाया गया है। संवेदनशील ढलानों से दूर रहें और स्थानीय निर्देशों का पालन करें।",
        "Assamese": "উচ্চ ভূমিস্খলনৰ আশংকা ধৰা পৰিছে। বিপদজনক ঢালৰ পৰা আঁতৰি থাকক আৰু স্থানীয় নিৰ্দেশনা মানি চলক।",
    },
    "Critical": {
        "English": "CRITICAL landslide risk detected. Move to a safe location and follow emergency instructions.",
        "Hindi": "गंभीर भूस्खलन जोखिम! सुरक्षित स्थान पर जाएं और आपातकालीन निर्देशों का पालन करें।",
        "Assamese": "গুৰুতৰ ভূমিস্খলনৰ আশংকা! নিৰাপদ স্থানলৈ যাওক আৰু জৰুৰীকালীন নিৰ্দেশনা মানি চলক।",
    },
}


def generate_alert(risk_level: str, language: str = "English") -> dict:
    if risk_level not in ALERT_MESSAGES:
        raise ValueError(
            f"Invalid risk level. Choose from: {list(ALERT_MESSAGES.keys())}"
        )

    if language not in {"English", "Hindi", "Assamese"}:
        raise ValueError(
            "Unsupported language. Choose English, Hindi, or Assamese."
        )

    severity = {
        "Low": "info",
        "Medium": "warning",
        "High": "danger",
        "Critical": "emergency",
    }[risk_level]

    return {
        "risk_level": risk_level,
        "language": language,
        "severity": severity,
        "message": ALERT_MESSAGES[risk_level][language],
        "delivery_status": "simulated",
    }
