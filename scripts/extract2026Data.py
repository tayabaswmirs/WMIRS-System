"""
extract2026Data.py
Parses, sanitizes, and structures the 3 official FY 2026 ENRO datasets:
1. Consolidated Quarterly Violations (Jan-Dec 2026) -> Waste Incidents (incidents collection)
2. Issued Citation Tickets Under Ord. 21-10 & 17-01 -> Plastic Bag Compliance Monitoring
3. Issued Warning Notices Under Ord. 21-10 & 17-01 -> Plastic Bag Compliance Monitoring
4. Official Signatory User Profiles -> users collection
"""

import os
import sys
import re
import json
from datetime import datetime, timedelta

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# OFFICIAL SIGNATORIES AND ENRO USERS
# ─────────────────────────────────────────────────────────────────────────────
USERS_2026 = [
    {
        "uid": "officer_kevin_morales",
        "name": "Kevin King F. Morales",
        "displayName": "Kevin King F. Morales",
        "email": "kevin.morales@tayabasenro.gov.ph",
        "role": "envi_enforcer",
        "accountType": "envi_enforcer",
        "designation": "AAIII - Environmental Enforcer",
        "staffScope": "Waste",
        "status": "active",
        "isHistorical": True,
        "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
        "uid": "officer_carlo_sabornido",
        "name": "Carlo S. Sabornido",
        "displayName": "Carlo S. Sabornido",
        "email": "carlo.sabornido@tayabasenro.gov.ph",
        "role": "envi_enforcer",
        "accountType": "envi_enforcer",
        "designation": "AAIII - Environmental Enforcer",
        "staffScope": "Waste",
        "status": "active",
        "isHistorical": True,
        "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
        "uid": "officer_blessbelle_durante",
        "name": "Blessbelle Claire A. Durante",
        "displayName": "Blessbelle Claire A. Durante",
        "email": "blessbelle.durante@tayabasenro.gov.ph",
        "role": "envi_enforcer",
        "accountType": "envi_enforcer",
        "designation": "AAIII - Environmental Enforcer",
        "staffScope": "Compliance",
        "status": "active",
        "isHistorical": True,
        "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
        "uid": "officer_jerdylene_tabi",
        "name": "Jerdylene C. Tabi",
        "displayName": "Jerdylene C. Tabi",
        "email": "jerdylene.tabi@tayabasenro.gov.ph",
        "role": "supervisor",
        "accountType": "supervisor",
        "designation": "Supervising EMS, OIC-ESWMU",
        "staffScope": "Compliance",
        "status": "active",
        "isHistorical": True,
        "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
        "uid": "officer_melvin_rada",
        "name": "Melvin C. Rada",
        "displayName": "Melvin C. Rada",
        "email": "melvin.rada@tayabasenro.gov.ph",
        "role": "admin",
        "accountType": "admin",
        "designation": "CGDH1 - City ENRO Head",
        "staffScope": "All",
        "status": "active",
        "isHistorical": True,
        "createdAt": "2026-01-01T00:00:00.000Z"
    }
]

REPORTER_ENFORCER = {
    "uid": "officer_kevin_morales",
    "name": "Kevin King F. Morales",
    "email": "kevin.morales@tayabasenro.gov.ph",
    "role": "envi_enforcer",
    "designation": "AAIII - Environmental Enforcer"
}

REPORTER_COMPLIANCE = {
    "uid": "officer_blessbelle_durante",
    "name": "Blessbelle Claire A. Durante",
    "email": "blessbelle.durante@tayabasenro.gov.ph",
    "role": "envi_enforcer",
    "designation": "AAIII - Environmental Enforcer"
}

def clean_date_2026(date_raw):
    """
    Standardizes any date input to ("Month DD, 2026", "2026-MM-DDTHH:mm:ss").
    Fixes typos like '20265', '02/092026', 'Sept 15 , 2026', 'August 18,2026'.
    """
    if not date_raw:
        return "September 01, 2026", "2026-09-01T08:00:00"

    cleaned = str(date_raw).strip()
    cleaned = cleaned.replace("20265", "2026")
    cleaned = cleaned.replace("02/092026", "02/09/2026")
    cleaned = re.sub(r'Sept\b', 'September', cleaned)
    cleaned = re.sub(r'Oct\b', 'October', cleaned)
    cleaned = re.sub(r'\s+,', ',', cleaned)
    cleaned = re.sub(r',(\d{4})', r', \1', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    # Try ISO YYYY-MM-DD
    m_iso = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})$', cleaned)
    if m_iso:
        y, m, d = int(m_iso.group(1)), int(m_iso.group(2)), int(m_iso.group(3))
        dt = datetime(y, m, d, 8, 0, 0)
        return dt.strftime("%B %d, %Y"), dt.strftime("%Y-%m-%dT%H:%M:%S")

    # Try MM/DD/YYYY
    m_slash = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', cleaned)
    if m_slash:
        m, d, y = int(m_slash.group(1)), int(m_slash.group(2)), int(m_slash.group(3))
        dt = datetime(y, m, d, 8, 0, 0)
        return dt.strftime("%B %d, %Y"), dt.strftime("%Y-%m-%dT%H:%M:%S")

    # Try Month DD, YYYY
    try:
        dt = datetime.strptime(cleaned, "%B %d, %Y")
        return dt.strftime("%B %d, %Y"), dt.strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        pass

    # Fallback search
    m_gen = re.search(r'([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})?', cleaned)
    if m_gen:
        month = m_gen.group(1)
        day = int(m_gen.group(2))
        try:
            dt = datetime.strptime(f"{month} {day}, 2026", "%B %d, %Y")
            return dt.strftime("%B %d, %Y"), dt.strftime("%Y-%m-%dT%H:%M:%S")
        except Exception:
            pass

    return "September 01, 2026", "2026-09-01T08:00:00"


def build_workflow_history(iso_date, preparer_name, preparer_role, preparer_uid, doc_type_str):
    """
    Builds the complete 3-step audit trail reflecting the official signatories:
    1. Prepared by Enforcer
    2. Verified by Jerdylene C. Tabi (Supervising EMS)
    3. Noted & Approved by Melvin C. Rada (City ENRO Head)
    """
    dt_base = datetime.fromisoformat(iso_date)
    dt_verified = dt_base + timedelta(hours=4)
    dt_approved = dt_base + timedelta(hours=8)

    trail = [
        {
            "status": "Submitted",
            "toStatus": "Submitted",
            "action": "Submitted",
            "actorName": preparer_name,
            "actorRole": preparer_role,
            "by": preparer_uid,
            "remarks": f"{doc_type_str} completed and logged by field inspection officer.",
            "timestamp": dt_base.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        },
        {
            "status": "Verified",
            "toStatus": "Verified",
            "action": "Verified",
            "actorName": "Jerdylene C. Tabi",
            "actorRole": "Supervising EMS, OIC-ESWMU",
            "by": "officer_jerdylene_tabi",
            "remarks": "Verified correct and recorded in municipal environmental compliance records.",
            "timestamp": dt_verified.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        },
        {
            "status": "Completed",
            "toStatus": "Completed",
            "action": "Completed",
            "actorName": "Melvin C. Rada",
            "actorRole": "CGDH1 - City ENRO Head",
            "by": "officer_melvin_rada",
            "remarks": "Noted and officially approved by City ENR Officer. Final accomplishment certified.",
            "timestamp": dt_approved.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        }
    ]
    return trail


# ─────────────────────────────────────────────────────────────────────────────
# 1. PARSE DOCUMENT 1: Consolidated Violations (Incidents)
# ─────────────────────────────────────────────────────────────────────────────
def parse_doc1_incidents():
    print("Parsing Document 1: Consolidated Quarterly Violations...")
    data_entries = [
        # Q1 2026
        ("Q1 2026", "Baguio", "Illegal Dumping", 1, ["2026-03-23"]),
        ("Q1 2026", "Baguio", "Open Burning of Waste", 1, ["03/18/2026"]),
        ("Q1 2026", "Ilayang Bukal", "Open Burning of Waste", 1, ["02/23/2026"]),
        ("Q1 2026", "Ilayang Bukal", "Open Burning of Waste", 2, ["03/30/2026"]),
        ("Q1 2026", "Calumpang", "Open Burning of Waste", 1, ["2026-02-19"]),
        ("Q1 2026", "Ilasan Ibaba", "Illegal Dumping", 2, ["2026-05-03"]),
        ("Q1 2026", "Ipilan", "Illegal Dumping", 1, ["02/16/2026"]),
        ("Q1 2026", "Ipilan", "Illegal Dumping", 3, ["03/23/2026"]),
        ("Q1 2026", "Isabang", "Illegal Dumping", 1, ["02/02/2026"]),
        ("Q1 2026", "Isabang", "Illegal Dumping", 2, ["03/05/2026"]),
        ("Q1 2026", "Lakawan", "Open Burning of Waste", 2, ["02/02/2026"]),
        ("Q1 2026", "Lakawan", "Open Burning of Waste", 1, ["03/05/2026"]),
        ("Q1 2026", "Lalo", "Illegal Dumping", 2, ["02/16/2026"]),
        ("Q1 2026", "Lawigue", "Illegal Dumping", 1, ["2026-07-01"]),
        ("Q1 2026", "Lita", "Open Burning of Waste", 1, ["2026-12-01"]),
        ("Q1 2026", "Mateuna", "Illegal Dumping", 1, ["01/07/2026"]),
        ("Q1 2026", "Mateuna", "Illegal Dumping", 1, ["03/05/2026"]),
        ("Q1 2026", "Mateuna", "Open Burning of Waste", 2, ["02/25/2026"]),
        ("Q1 2026", "Ibabang Nangka", "Open Burning of Waste", 1, ["03/30/2026"]),
        ("Q1 2026", "Ibabang Palale", "Illegal Dumping", 2, ["02/09/2026"]),
        ("Q1 2026", "Wakas", "Illegal Dumping", 1, ["01/02/2026"]),
        ("Q1 2026", "Wakas", "Illegal Dumping", 1, ["02/02/2026"]),
        ("Q1 2026", "Wakas", "Open Burning of Waste", 1, ["03/11/2026"]),
        ("Q1 2026", "Wakas", "Open Burning of Waste", 1, ["03/17/2026"]),
        ("Q1 2026", "Wakas", "Open Burning of Waste", 1, ["03/18/2026"]),

        # Q2 2026
        ("Q2 2026", "Baguio", "Illegal Dumping", 1, ["04/06/2026"]),
        ("Q2 2026", "Baguio", "Illegal Dumping", 1, ["04/20/2026"]),
        ("Q2 2026", "Baguio", "Illegal Dumping", 1, ["04/21/2026"]),
        ("Q2 2026", "Baguio", "Illegal Dumping", 1, ["05/05/2026"]),
        ("Q2 2026", "Baguio", "Open Burning of Waste", 1, ["4/28/2026"]),
        ("Q2 2026", "Baguio", "Open Burning of Waste", 1, ["05/09/2026"]),
        ("Q2 2026", "Baguio", "Open Burning of Waste", 1, ["06/08/2026"]),
        ("Q2 2026", "Banilad", "Open Burning of Waste", 3, ["04/17/2026"]),
        ("Q2 2026", "Calumpang", "Open Burning of Waste", 1, ["06/10/2026"]),
        ("Q2 2026", "Calumpang", "Open Burning of Waste", 2, ["06/17/2026"]),
        ("Q2 2026", "Ipilan", "Illegal Dumping", 2, ["04/27/2026"]),
        ("Q2 2026", "Ipilan", "Open Burning of Waste", 1, ["2026-09-05"]),
        ("Q2 2026", "Isabang", "Open Burning of Waste", 2, ["4/27/2026"]),
        ("Q2 2026", "Isabang", "Open Burning of Waste", 2, ["05/28/2026"]),
        ("Q2 2026", "Lakawan", "Illegal Dumping", 1, ["04/30/2026"]),
        ("Q2 2026", "Lakawan", "Open Burning of Waste", 1, ["4/30/2026"]),
        ("Q2 2026", "Lakawan", "Open Burning of Waste", 1, ["05/20/2026"]),
        ("Q2 2026", "Lalo", "Open Burning of Waste", 1, ["04/24/2026"]),
        ("Q2 2026", "Mateuna", "Illegal Dumping", 1, ["04/27/2026"]),
        ("Q2 2026", "Kanlurang Palale", "Open Burning of Waste", 1, ["2026-04-05"]),
        ("Q2 2026", "Talolong", "Open Burning of Waste", 2, ["04/21/2026"]),
        ("Q2 2026", "Wakas", "Open Burning of Waste", 1, ["4/17/2026"]),
        ("Q2 2026", "Wakas", "Open Burning of Waste", 1, ["04/20/2026"]),
        ("Q2 2026", "Wakas", "Open Burning of Waste", 2, ["04/28/2026"]),

        # Q3 2026
        ("Q3 2026", "Ipilan", "Illegal Dumping", 2, ["07/14/2026"]),
        ("Q3 2026", "Ipilan", "Illegal Dumping", 1, ["08/12/2026"]),
        ("Q3 2026", "Ipilan", "Illegal Dumping", 1, ["09/09/2026"]),
        ("Q3 2026", "Ipilan", "Illegal Dumping", 1, ["09/14/2026"]),
        ("Q3 2026", "Ipilan", "Illegal Dumping", 1, ["09/21/2026"]),
        ("Q3 2026", "Lalo", "Illegal Dumping", 1, ["2026-12-08"]),
        ("Q3 2026", "Wakas", "Illegal Dumping", 1, ["09/30/2026"])
    ]

    records = []
    item_counter = 1

    for qtr, brgy, inc_type, count, dates in data_entries:
        date_str = dates[0]
        formatted_date, iso_date = clean_date_2026(date_str)
        slug_brgy = re.sub(r'[^a-zA-Z0-9]', '', brgy).lower()
        slug_type = "dumping" if "dumping" in inc_type.lower() else "burning"
        dt_clean = iso_date[:10].replace('-', '')

        for v_idx in range(count):
            doc_id = f"inc_2026_{slug_type}_{slug_brgy}_{dt_clean}_{item_counter:03d}"
            item_counter += 1

            audit_trail = build_workflow_history(
                iso_date,
                preparer_name=REPORTER_ENFORCER["name"],
                preparer_role=REPORTER_ENFORCER["designation"],
                preparer_uid=REPORTER_ENFORCER["uid"],
                doc_type_str=f"{inc_type} citation record"
            )

            records.append({
                "id": doc_id,
                "category": "Waste Incidents",
                "subcategory": inc_type,
                "incidentType": inc_type,
                "location": f"Brgy. {brgy}, Tayabas City",
                "barangay": brgy,
                "date": formatted_date,
                "dateTime": iso_date,
                "description": f"Consolidated Quarterly Violations Report ({qtr}): Recorded violation {v_idx + 1} of {count} for {inc_type} in Brgy. {brgy}.",
                "severity": "Medium",
                "status": "completed",
                "history": audit_trail,
                "workflowHistory": audit_trail,
                "evidence": [],
                "reporter": REPORTER_ENFORCER,
                "isHistorical": True,
                "fiscalYear": 2026,
                "quarter": qtr
            })

    out_file = os.path.join(OUTPUT_DIR, "incidents_2026.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"-> Generated {len(records)} incidents in {out_file}")
    return records


# ─────────────────────────────────────────────────────────────────────────────
# 2. PARSE DOCUMENT 2: Issued Citation Tickets (82 items)
# ─────────────────────────────────────────────────────────────────────────────
def parse_doc2_citations():
    print("Parsing Document 2: Issued Citation Tickets (82 items)...")

    citations_raw = [
        (1, "000162", "August 10, 2026", "Establishment", "Section 3.10", "First Offense", "Double packaging of goods"),
        (2, "000163", "August 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Issued plastic for dry goods to customer"),
        (3, "000001", "August 12, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using 8x11 plastic for viand"),
        (4, "000002", "August 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using 8x11 plastic for viand"),
        (5, "000051", "August 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Present of styrofoam; Plastic cup; Using sando bag for charcoal; Using Plastic for tuyo"),
        (6, "000052", "August 12, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using 8x11 plastic for viand"),
        (7, "000164", "August 12, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using/displaying of sando bags"),
        (8, "000165", "August 12, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using 8x11 plastic for pancit"),
        (9, "000053", "August 13, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (10, "000054", "August 13, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (11, "000055", "August 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using Plastic Cup"),
        (12, "000056", "August 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for Pancit hab-hab"),
        (13, "000057", "August 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for fruits"),
        (14, "000058", "August 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo in selling fruits"),
        (15, "000059", "August 20, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic for fruits & vegetables"),
        (16, "000060", "August 25, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for lutong ulam"),
        (17, "000061", "August 25, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo 8x11 in selling ulam"),
        (18, "000062", "August 25, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for viand"),
        (19, "000063", "August 25, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo to dry goods"),
        (20, "000003", "Sept 7, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (21, "000004", "Sept 7, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (22, "000005", "Sept 7, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (23, "000166", "Sept 7, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (24, "000167", "Sept 7, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (25, "000168", "Sept 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (26, "000169", "Sept 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for dry goods"),
        (27, "000170", "Sept 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using black bag for laundry"),
        (28, "000171", "Sept 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for laundry"),
        (29, "000101", "Sept 10, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic cup, plastic labo"),
        (30, "000172", "Sept 15, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (31, "000173", "Sept 15, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (32, "000174", "Sept 15, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (33, "000175", "Sept 15, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic for dry goods"),
        (34, "000176", "Sept 15, 2026", "Others", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (35, "000177", "Sept 15, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Double Packaging"),
        (36, "000178", "Sept 15, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Double Packaging"),
        (37, "000179", "Sept 15, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Double Packaging for wet goods"),
        (38, "000180", "Sept 18, 2026", "Establishment", "Section 3.10", "First Offense", "Using plastic cups & plastic straw"),
        (39, "000181", "Sept 18, 2026", "Establishment", "Section 3.10", "First Offense", "Using plastic cups, plastic spoon & fork"),
        (40, "000006", "Sept 18, 2026", "Establishment", "Section 3.10", "First Offense", "Using plastic for laundry"),
        (41, "000007", "Sept 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using/display of plastic cups"),
        (42, "000008", "Sept 18, 2026", "Resident", "Section 3.3", "First Offense", "Open burning"),
        (43, "000009", "Sept 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using sando bag & disposable cups"),
        (44, "000010", "Sept 18, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using of sando bags"),
        (45, "000011", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using sando bags for dry goods"),
        (46, "000012", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using of plastic"),
        (47, "000102", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for dry goods"),
        (48, "000013", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for vegetables"),
        (49, "000014", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo"),
        (50, "000103", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo"),
        (51, "000015", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic cup & styro cup"),
        (52, "000016", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic cup"),
        (53, "000104", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo (8x11)"),
        (54, "000017", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic utensils and plastic labo"),
        (55, "000018", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic cup & plastic labo"),
        (56, "000019", "Sept 21, 2026", "Resident", "Section 3.3", "First Offense", "Open Burning"),
        (57, "000105", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using disposable plastic cup & straw"),
        (58, "000106", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo (8x11)"),
        (59, "000020", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using sando bag"),
        (60, "000064", "Sept 23, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using disposable plastic cup (No reminder to the visitors/guest)"),
        (61, "000151", "Sept 25, 2026", "Establishment", "Section 3.3", "First Offense", "Open Burning"),
        (62, "000152", "Sept 25, 2026", "Resident", "Section 3.3", "First Offense", "Open Burning"),
        (63, "000107", "Sept 28, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for viand"),
        (64, "000108", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for viand"),
        (65, "000021", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for dry goods"),
        (66, "000022", "Sept 21, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic labo for lutong ulam"),
        (67, "000023", "Sept 28, 2026", "Resident", "Section 3.3", "First Offense", "Open Burning"),
        (68, "000109", "Sept 28, 2026", "Establishment", "Section 3.3", "First Offense", "Open Burning"),
        (69, "000153", "Sept 29, 2026", "Establishment", "Section 3.6", "First Offense", "Open dumping"),
        (70, "000129", "Sept 29, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using sando bags"),
        (71, "000154", "Oct 1, 2026", "Establishment", "Section 3.1&3.11", "First Offense", "Using plastic bag for laundry clothes"),
        (72, "000024", "Oct 1, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for Laundry"),
        (73, "000025", "Oct 1, 2026", "Establishment", "Section 3.1, 3.3, 3.10&3.11", "First Offense", "Open dumping, signs of open burning"),
        (74, "000155", "Oct 1, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using sando bag, selling&displaying of styro cups"),
        (75, "000156", "Oct 1, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using sando bag and plastic for dry goods, Displaying plastic cups"),
        (76, "000130", "Oct 1, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using/displaying sando bag"),
        (77, "000131", "Oct 5, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for lutong ulam"),
        (78, "000132", "Oct 5, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for dry goods, selling plastic spoon and cups"),
        (79, "000133", "Oct 5, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for dry goods"),
        (80, "000134", "Oct 5, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic straw"),
        (81, "000026", "Oct 5, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic straw"),
        (82, "000027", "Oct 5, 2026", "Establishment", "Section 3.10&3.11", "First Offense", "Using plastic for dry goods")
    ]

    records = []
    for item in citations_raw:
        row_num, ticket_no, date_raw, category, viol, penalty, remarks = item
        formatted_date, iso_date = clean_date_2026(date_raw)

        is_resident = category.lower() == "resident" or "resident" in category.lower()
        if is_resident:
            b_type = "Individual"
        elif "eatery" in remarks.lower() or "ulam" in remarks.lower() or "pansit" in remarks.lower():
            b_type = "Restaurant/Eatery"
        else:
            b_type = "Commercial Establishment"

        doc_id = f"comp_2026_ticket_{ticket_no}"

        audit_trail = build_workflow_history(
            iso_date,
            preparer_name=REPORTER_COMPLIANCE["name"],
            preparer_role=REPORTER_COMPLIANCE["designation"],
            preparer_uid=REPORTER_COMPLIANCE["uid"],
            doc_type_str=f"Citation Ticket #{ticket_no}"
        )

        records.append({
            "id": doc_id,
            "category": "Compliance",
            "subcategory": "Plastic Bag Regulation Inspection Form",
            "ticketNo": ticket_no,
            "date": formatted_date,
            "dateTime": iso_date,
            "establishmentName": f"Commercial Establishment #{ticket_no}" if not is_resident else f"Resident / Cit. #{ticket_no}",
            "businessType": b_type,
            "compliant": False,
            "violationSections": viol,
            "infractionDetails": f"{viol}: {remarks}",
            "actionToken": "Citation Ticket",
            "offensePenalty": penalty,
            "status": "completed",
            "history": audit_trail,
            "workflowHistory": audit_trail,
            "evidence": [],
            "reporter": REPORTER_COMPLIANCE,
            "isHistorical": True,
            "fiscalYear": 2026
        })

    out_file = os.path.join(OUTPUT_DIR, "compliance_2026_citations.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"-> Generated {len(records)} citation tickets in {out_file}")
    return records


# ─────────────────────────────────────────────────────────────────────────────
# 3. PARSE DOCUMENT 3: Issued Warning Notices (486 items)
# ─────────────────────────────────────────────────────────────────────────────
def parse_doc3_warnings():
    print("Parsing Document 3: Issued Warning Notices (486 items)...")

    warnings_raw_path = os.path.join(os.path.dirname(__file__), "raw_warnings_486.json")
    if not os.path.exists(warnings_raw_path):
        print(f"Raw warnings JSON not found at {warnings_raw_path}!")
        return []

    with open(warnings_raw_path, "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    records = []

    BARANGAY_ALIASES = {
        "angeles z1": "Angeles Zone 1",
        "angeles z2": "Angeles Zone 2",
        "angeles z3": "Angeles Zone 3",
        "angeles z4": "Angeles Zone 4",
        "angustias z1": "Angustias Zone 1",
        "angustias z2": "Angustias Zone II",
        "angustias z3": "Angustias Zone III",
        "angustias z4": "Angustias Zone IV",
        "san diego z1": "San Diego Zone I",
        "san diego z2": "San Diego Zone II",
        "san diego z3": "San Diego Zone III",
        "san diego z4": "San Diego Zone IV",
        "san isidro z1": "San Isidro Zone I",
        "san isidro z2": "San Isidro Zone II",
        "san isidro z3": "San Isidro Zone III",
        "san isidro z4": "San Isidro Zone IV",
        "san roque z1": "San Roque Zone I",
        "san roque z2": "San Roque Zone II",
        "san. roque zone -2": "San Roque Zone II",
        "iba.bukal": "Bukal Ibaba",
        "ila.bukal": "Bukal Ilaya",
        "sil.katigan": "Katigan Silangan",
        "kan.katigan": "Katigan Kanluran",
        "iba.ilasan": "Ilasan Ibaba",
        "ila.ilasan": "Ilasan Ilaya",
        "iba.alsam": "Alsam Ibaba",
        "ila.alsam": "Alsam Ilaya",
        "iba.nangka": "Nangka Ibaba",
        "ibabang nangka": "Nangka Ibaba",
        "ila.nangka": "Nangka Ilaya",
        "ilayang nangka": "Nangka Ilaya",
        "ila.nanagka": "Nangka Ilaya",
        "sil.domoit": "Domoit Silangan",
        "kan.domoit": "Domoit Kanluran",
        "malao-a": "Malaoa",
        "talonglong": "Talolong",
        "mayuwi": "Mayuwi",
        "public market stall": "Poblacion",
        "public market": "Poblacion"
    }

    for item in raw_items:
        item_no = item["no"]
        date_raw = item["date"]
        raw_brgy = item["barangay"].strip()
        raw_remarks = item["remarks"].strip()

        formatted_date, iso_date = clean_date_2026(date_raw)

        clean_remarks = raw_remarks
        clean_remarks = re.sub(r'\bplastc\b', 'plastic', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bpplastic\b', 'plastic', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bplasyic\b', 'plastic', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bstarw\b', 'straw', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bsano\b', 'sando', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bpncakes\b', 'pancakes', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\businng\b', 'using', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bdiplay\b', 'display', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bdsiplaying\b', 'displaying', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bsigh cups\b', 'styro cups', clean_remarks, flags=re.IGNORECASE)
        clean_remarks = re.sub(r'\bdisposabe\b', 'disposable', clean_remarks, flags=re.IGNORECASE)

        sitio_street = ""
        m_sitio = re.search(r'(.*?)\s*\((.*?)\)', raw_brgy)
        if m_sitio:
            primary_b = m_sitio.group(1).strip()
            sitio_street = m_sitio.group(2).strip()
        else:
            primary_b = raw_brgy

        sub_match = re.search(r'(.*?)\s+(Sitio\s+.*|Purok\s+.*|Ph\s*\.?\s*\d+|Hi\s*Way|Don\s+.*|Lovely\s+Village|Calmar\s+Homes|Carmenville|Leveriza.*|Lumina|Bypass\s+Road)', primary_b, re.IGNORECASE)
        if sub_match:
            primary_b = sub_match.group(1).strip()
            sitio_street = sub_match.group(2).strip()

        lookup_key = primary_b.lower()
        if lookup_key in BARANGAY_ALIASES:
            canonical_brgy = BARANGAY_ALIASES[lookup_key]
        elif lookup_key:
            canonical_brgy = primary_b
        else:
            canonical_brgy = "Unclassified"

        if "public market" in raw_brgy.lower() or "market stall" in raw_brgy.lower():
            b_type = "Public Market Vendor"
            sitio_street = "Public Market Stall"
        elif "eatery" in clean_remarks.lower() or "ulam" in clean_remarks.lower() or "pansit" in clean_remarks.lower() or "burger" in clean_remarks.lower():
            b_type = "Restaurant/Eatery"
        elif "resident" in raw_brgy.lower() or "resident" in clean_remarks.lower():
            b_type = "Individual"
        else:
            b_type = "Commercial Establishment"

        doc_id = f"comp_2026_warning_{item_no:03d}"

        audit_trail = build_workflow_history(
            iso_date,
            preparer_name=REPORTER_COMPLIANCE["name"],
            preparer_role=REPORTER_COMPLIANCE["designation"],
            preparer_uid=REPORTER_COMPLIANCE["uid"],
            doc_type_str=f"Warning Notice #{item_no}"
        )

        records.append({
            "id": doc_id,
            "category": "Compliance",
            "subcategory": "Plastic Bag Regulation Inspection Form",
            "warningNo": item_no,
            "date": formatted_date,
            "dateTime": iso_date,
            "establishmentName": f"Commercial Stall #{item_no} ({canonical_brgy})",
            "barangay": canonical_brgy,
            "location": f"Brgy. {canonical_brgy}, Tayabas City" if canonical_brgy != "Unclassified" else "Tayabas City",
            "sitioStreet": sitio_street,
            "businessType": b_type,
            "compliant": False,
            "infractionDetails": f"Warning Notice #{item_no}: {clean_remarks}",
            "actionToken": "Written Non-Compliance Notice",
            "status": "completed",
            "history": audit_trail,
            "workflowHistory": audit_trail,
            "evidence": [],
            "reporter": REPORTER_COMPLIANCE,
            "isHistorical": True,
            "fiscalYear": 2026
        })

    out_file = os.path.join(OUTPUT_DIR, "compliance_2026_warnings.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"-> Generated {len(records)} warning notices in {out_file}")
    return records


# ─────────────────────────────────────────────────────────────────────────────
# 4. EXPORT OFFICIAL USER PROFILES
# ─────────────────────────────────────────────────────────────────────────────
def export_users():
    out_file = os.path.join(OUTPUT_DIR, "users_2026.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(USERS_2026, f, indent=2)
    print(f"-> Exported {len(USERS_2026)} official user profiles to {out_file}")


if __name__ == "__main__":
    export_users()
    parse_doc1_incidents()
    parse_doc2_citations()
    parse_doc3_warnings()
    print("All FY 2026 data successfully extracted, sanitized, and structured.")
