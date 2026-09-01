import os
import sys
import pypdf
import re
import json
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

SOURCE_DIR = r"c:\Users\venre\Documents\WMIRS files"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")

os.makedirs(OUTPUT_DIR, exist_ok=True)

REPORTER_BMS = {
    "uid": "historical_officer_1",
    "name": "Archival Officer (BMS)",
    "email": "historical.bms@tayabasenro.gov.ph",
    "role": "archival_officer"
}

REPORTER_COMPLIANCE = {
    "uid": "historical_officer_2",
    "name": "Archival Officer (Compliance)",
    "email": "historical.compliance@tayabasenro.gov.ph",
    "role": "archival_officer"
}

def clean_date_to_2025(date_str):
    """
    Standardizes any date string into clean 'Month DD, 2025' and ISO 8601 string.
    Sanitizes future years (2026-2035) to 2025.
    """
    if not date_str:
        return "June 1, 2025", "2025-06-01T08:00:00"

    cleaned = date_str.replace('\n', ' ').replace('Juen', 'June').strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # Replace any 4-digit year with 2025
    cleaned = re.sub(r'20\d{2}', '2025', cleaned)

    # Parse Month Day, Year
    try:
        dt = datetime.strptime(cleaned, "%B %d, %Y")
        iso_str = dt.strftime("%Y-%m-%dT08:00:00")
        formatted_str = dt.strftime("%B %d, %Y")
        return formatted_str, iso_str
    except Exception:
        # Fallback regex extraction
        m = re.search(r'([A-Za-z]+)\s+(\d{1,2}),?\s*(?:20\d{2})?', cleaned)
        if m:
            month, day = m.group(1), m.group(2)
            try:
                dt = datetime.strptime(f"{month} {day}, 2025", "%B %d, %Y")
                return dt.strftime("%B %d, %Y"), dt.strftime("%Y-%m-%dT08:00:00")
            except Exception:
                pass
        return "October 9, 2025", "2025-10-09T08:00:00"

def parse_citations():
    filepath = os.path.join(SOURCE_DIR, "RECORDS-OF-CITATION-TICKETS.pdf")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []

    reader = pypdf.PdfReader(filepath)
    text = '\n'.join([p.extract_text() for p in reader.pages])

    pattern = re.compile(r'(\d+)\s+(\d{6})\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+(Establishment|Individual)', re.DOTALL)
    matches = list(pattern.finditer(text))
    
    records = []
    for i in range(len(matches)):
        start = matches[i].end()
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        content = text[start:end].strip().replace('\n', ' ')
        # Clean page footer text
        content = re.sub(r'\d+\s*\|\s*P\s*a\s*g\s*e.*', '', content).strip()
        
        ticket_no = matches[i].group(2)
        raw_date = matches[i].group(3)
        business_type = matches[i].group(4)
        
        formatted_date, iso_date = clean_date_to_2025(raw_date)
        
        records.append({
            "category": "Compliance",
            "subcategory": "Plastic Bag Ban Inspection Form",
            "date": formatted_date,
            "dateTime": iso_date,
            "establishmentName": f"Commercial Stall / Ticket #{ticket_no}",
            "businessType": business_type,
            "compliant": False,
            "infractionDetails": content or "Violation of Plastic Bag Ban Ordinance (Citation Issued)",
            "actionToken": "Citation Ticket",
            "status": "completed",
            "reporter": REPORTER_COMPLIANCE,
            "isHistorical": True
        })
    
    print(f"Extracted {len(records)} sanitized citation tickets.")
    return records

def parse_warnings():
    filepath = os.path.join(SOURCE_DIR, "RECORDS-OF-WARNING-NOTICE.pdf")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []

    reader = pypdf.PdfReader(filepath)
    text = '\n'.join([p.extract_text() for p in reader.pages])
    text = text.replace('Juen', 'June')

    pattern = re.compile(r'(\d+)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+(.*?)(?=\n\d+\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\Z)', re.DOTALL)
    matches = list(pattern.finditer(text))
    
    records = []
    for m in matches:
        raw_num = m.group(1)
        raw_date = m.group(2)
        content = m.group(3).strip().replace('\n', ' ')
        # Clean page header/footer texts
        content = re.sub(r'\d+\s*\|\s*P\s*a\s*g\s*e.*', '', content).strip()
        content = re.sub(r'Prepared by:.*', '', content).strip()
        content = re.sub(r'\*nothing follows\*.*', '', content).strip()
        
        formatted_date, iso_date = clean_date_to_2025(raw_date)
        
        records.append({
            "category": "Compliance",
            "subcategory": "Plastic Bag Ban Inspection Form",
            "date": formatted_date,
            "dateTime": iso_date,
            "establishmentName": f"Commercial Establishment #{raw_num}",
            "businessType": "Establishment",
            "compliant": False,
            "infractionDetails": content or "Non-compliance with single-use plastic regulation (Warning Notice Issued)",
            "actionToken": "Written Non-Compliance Notice",
            "status": "completed",
            "reporter": REPORTER_COMPLIANCE,
            "isHistorical": True
        })
    
    print(f"Extracted {len(records)} sanitized warning notices.")
    return records

def generate_bms_data():
    """
    Generates exact bird census records from the 4 official 2025 BMS reports (Brgy. Lalo).
    All records feature activities formatted as ARRAY of strings.
    """
    quarterly_data = [
        {
            "quarter": "Q1 2025",
            "date": "March 4, 2025",
            "dateTime": "2025-03-04T05:54:00",
            "species": [
                ("Balicassiao", 7, ["Foraging", "Calling"]),
                ("Blue-headed Fantail", 2, ["Flying"]),
                ("Elegant Tit", 8, ["Foraging"]),
                ("Grey-capped Emerald Dove", 1, ["Perching"]),
                ("Tarictic Hornbill", 1, ["Calling"]),
                ("Philippine Bulbul", 16, ["Foraging", "Calling"]),
                ("Philippine Hanging Parrot", 7, ["Flying"]),
                ("Red Junglefowl", 1, ["Foraging"]),
                ("White-eared Brown Dove", 1, ["Perching"]),
                ("Olive-backed Sunbird", 1, ["Nesting"]),
                ("Philippine Fairy-bluebird", 3, ["Calling"]),
                ("Northern Sooty Woodpecker", 3, ["Foraging"]),
                ("White-browed Shama", 1, ["Calling"]),
                ("Buzzing Flowerpecker", 1, ["Flying"]),
                ("Philippine Scops-owl", 1, ["Perching"]),
                ("Sulphur-billed Nuthatch", 1, ["Foraging"]),
                ("Spotted Wood Kingfisher", 4, ["Perching"]),
                ("Philippine Drongo-Cuckoo", 3, ["Calling"]),
                ("Red-keeled Flowerpecker", 2, ["Flying"]),
                ("Guaiabero", 2, ["Foraging"]),
                ("Grey-backed Tailorbird", 2, ["Calling"]),
                ("Phil. Night Jar", 1, ["Perching"])
            ]
        },
        {
            "quarter": "Q2 2025",
            "date": "May 21, 2025",
            "dateTime": "2025-05-21T05:55:00",
            "species": [
                ("Balicassiao", 4, ["Foraging"]),
                ("Blue-headed Fantail", 3, ["Flying"]),
                ("Elegant Tit", 3, ["Foraging", "Calling"]),
                ("Large-billed Crow", 2, ["Calling"]),
                ("Lowland White-eye", 1, ["Foraging"]),
                ("Philippine Bulbul", 5, ["Calling"]),
                ("Philippine Coucal", 2, ["Foraging"]),
                ("Philippine Cuckoo-Dove", 10, ["Perching", "Calling"]),
                ("Philippine Hanging Parrot", 3, ["Flying"]),
                ("Philippine Pygmy Woodpecker", 2, ["Foraging"]),
                ("Red Junglefowl", 3, ["Foraging"]),
                ("White-eared Brown Dove", 10, ["Perching"]),
                ("Bicolored Flowerpecker", 1, ["Flying"]),
                ("Black-chinned Fruit Dove", 1, ["Perching"]),
                ("Guaiabero", 1, ["Calling"]),
                ("Amethyst Brown Dove", 1, ["Perching"]),
                ("Orange-bellied Flowerpecker", 1, ["Foraging"]),
                ("Wattled Bulbul", 1, ["Calling"])
            ]
        },
        {
            "quarter": "Q3 2025",
            "date": "September 4, 2025",
            "dateTime": "2025-09-04T05:55:00",
            "species": [
                ("Balicassiao", 19, ["Foraging", "Calling"]),
                ("Blue-headed Fantail", 2, ["Flying"]),
                ("Elegant Tit", 2, ["Foraging"]),
                ("Large-billed Crow", 1, ["Calling"]),
                ("Tarictic Hornbill", 3, ["Calling", "Flying"]),
                ("Philippine Bulbul", 13, ["Foraging"]),
                ("Philippine Cuckoo-Dove", 5, ["Perching"]),
                ("Philippine Hanging Parrot", 6, ["Flying"]),
                ("Red Junglefowl", 1, ["Foraging"]),
                ("White-eared Brown Dove", 7, ["Perching"]),
                ("Rough-crested Malkoha", 2, ["Foraging"]),
                ("Philippine Fairy-bluebird", 5, ["Calling"]),
                ("Philippine Hawk-eagle", 1, ["Flying"]),
                ("Northern Sooty Woodpecker", 1, ["Foraging"]),
                ("White-browed Shama", 1, ["Calling"]),
                ("Guaiabero", 1, ["Perching"]),
                ("Amethyst Brown Dove", 1, ["Perching"]),
                ("Philippine Trogon", 1, ["Calling"]),
                ("Grey-backed Tailorbird", 2, ["Nesting"])
            ]
        },
        {
            "quarter": "Q4 2025",
            "date": "November 11, 2025",
            "dateTime": "2025-11-11T06:04:00",
            "species": [
                ("Balicassiao", 9, ["Foraging"]),
                ("Elegant Tit", 2, ["Calling"]),
                ("Large-billed Crow", 3, ["Calling"]),
                ("Tarictic Hornbill", 3, ["Flying", "Calling"]),
                ("Philippine Bulbul", 20, ["Foraging", "Calling"]),
                ("Philippine Cuckoo-Dove", 2, ["Perching"]),
                ("Philippine Hanging Parrot", 14, ["Flying"]),
                ("Red Junglefowl", 3, ["Foraging"]),
                ("White-eared Brown Dove", 4, ["Perching"]),
                ("Bicolored Flowerpecker", 1, ["Flying"]),
                ("Philippine Fairy-bluebird", 1, ["Calling"]),
                ("Philippine Hawk-eagle", 1, ["Flying"]),
                ("Buzzing Flowerpecker", 1, ["Foraging"]),
                ("Philippine Serpent Eagle", 1, ["Flying"]),
                ("Mountain Tailor Bird", 1, ["Calling"]),
                ("Guaiabero", 4, ["Foraging"]),
                ("Amethyst Brown Dove", 2, ["Perching"])
            ]
        }
    ]

    records = []
    for q_data in quarterly_data:
        for idx, (species, count, activities) in enumerate(q_data["species"]):
            records.append({
                "category": "BMS",
                "subcategory": "Avian Tracking Form",
                "classification": "Avian",
                "avianSpecies": species,
                "count": count,
                "stationId": f"Station {idx % 9}",
                "activities": activities,
                "date": q_data["date"],
                "dateTime": q_data["dateTime"],
                "status": "completed",
                "reporter": REPORTER_BMS,
                "isHistorical": True
            })

    print(f"Generated {len(records)} official BMS records across 4 quarters of 2025.")
    return records

def generate_users_data():
    return [
        {
            "uid": "historical_officer_1",
            "name": "Archival Officer (BMS)",
            "displayName": "Archival Officer (BMS)",
            "email": "historical.bms@tayabasenro.gov.ph",
            "role": "archival_officer",
            "accountType": "archival_officer",
            "staffScope": "BMS",
            "isHistorical": True,
            "status": "active",
            "createdAt": "2025-01-01T00:00:00.000Z"
        },
        {
            "uid": "historical_officer_2",
            "name": "Archival Officer (Compliance)",
            "displayName": "Archival Officer (Compliance)",
            "email": "historical.compliance@tayabasenro.gov.ph",
            "role": "archival_officer",
            "accountType": "archival_officer",
            "staffScope": "Compliance",
            "isHistorical": True,
            "status": "active",
            "createdAt": "2025-01-01T00:00:00.000Z"
        }
    ]

if __name__ == "__main__":
    citations = parse_citations()
    warnings = parse_warnings()
    compliance_data = citations + warnings
    bms_data = generate_bms_data()
    users_data = generate_users_data()
    
    with open(os.path.join(OUTPUT_DIR, "compliance_data.json"), "w", encoding="utf-8") as f:
        json.dump(compliance_data, f, indent=2)
        
    with open(os.path.join(OUTPUT_DIR, "bms_data.json"), "w", encoding="utf-8") as f:
        json.dump(bms_data, f, indent=2)
        
    with open(os.path.join(OUTPUT_DIR, "users_data.json"), "w", encoding="utf-8") as f:
        json.dump(users_data, f, indent=2)
        
    print(f"Successfully generated all clean JSON files in {OUTPUT_DIR}")
