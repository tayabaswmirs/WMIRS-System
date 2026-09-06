/**
 * Official Philippine Standard Geographic Code (PSGC: 045647000)
 * 66 Barangays of the City of Tayabas, Province of Quezon.
 */
export const TAYABAS_BARANGAYS = [
  "Alitao",
  "Alsam Ibaba",
  "Alsam Ilaya",
  "Alupay",
  "Angeles Zone 1",
  "Angeles Zone 2",
  "Angeles Zone 3",
  "Angeles Zone 4",
  "Angustias Zone 1",
  "Angustias Zone II",
  "Angustias Zone III",
  "Angustias Zone IV",
  "Anos",
  "Ayaas",
  "Baguio",
  "Banilad",
  "Bukal Ibaba",
  "Bukal Ilaya",
  "Calantas",
  "Calumpang",
  "Camaysa",
  "Dapdap",
  "Domoit Kanluran",
  "Domoit Silangan",
  "Gibanga",
  "Ibas",
  "Ilasan Ibaba",
  "Ilasan Ilaya",
  "Ipilan",
  "Isabang",
  "Katigan Kanluran",
  "Katigan Silangan",
  "Lakawan",
  "Lalo",
  "Lawigue",
  "Lita",
  "Malaoa",
  "Masin",
  "Mate",
  "Mateuna",
  "Mayuwi",
  "Nangka Ibaba",
  "Nangka Ilaya",
  "Opias",
  "Palale Ibaba",
  "Palale Ilaya",
  "Palale Kanluran",
  "Palale Silangan",
  "Pandakaki",
  "Pook",
  "Potol",
  "San Diego Zone I",
  "San Diego Zone II",
  "San Diego Zone III",
  "San Diego Zone IV",
  "San Isidro Zone I",
  "San Isidro Zone II",
  "San Isidro Zone III",
  "San Isidro Zone IV",
  "San Roque Zone I",
  "San Roque Zone II",
  "Talolong",
  "Tamlong",
  "Tongko",
  "Valencia",
  "Wakas"
];

/**
 * Geographic Center of Tayabas City (near San Miguel Archangel Basilica / City Hall)
 */
export const TAYABAS_CENTER = [14.0251, 121.5933];

/**
 * Bounding Box for Tayabas City ENRO Jurisdiction
 * [[South-West Lat/Lng], [North-East Lat/Lng]]
 */
export const TAYABAS_BOUNDS = [
  [13.9300, 121.5000],
  [14.1500, 121.7000]
];

/**
 * Validates if coordinates fall within the Tayabas City boundary envelope.
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export const isWithinTayabas = (lat, lng) => {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return (
    lat >= TAYABAS_BOUNDS[0][0] &&
    lat <= TAYABAS_BOUNDS[1][0] &&
    lng >= TAYABAS_BOUNDS[0][1] &&
    lng <= TAYABAS_BOUNDS[1][1]
  );
};

/**
 * Composes a full descriptive address from barangay and specific street/sitio.
 * 
 * @param {string} barangay - Canonical Barangay name
 * @param {string} [sitioStreet] - Specific location / street / landmark
 * @returns {string}
 */
export const formatFullAddress = (barangay, sitioStreet) => {
  const parts = [];
  if (sitioStreet && sitioStreet.trim()) {
    parts.push(sitioStreet.trim());
  }
  if (barangay && barangay.trim()) {
    parts.push(`Brgy. ${barangay.trim()}`);
  }
  parts.push("Tayabas City");
  return parts.join(", ");
};

/**
 * Resolves a canonical barangay name from any record (structured or legacy).
 * Matches case-insensitively and handles common prefixes ("Brgy.", "Barangay").
 * 
 * @param {object} item - Incident or Monitoring record
 * @returns {string} Canonical barangay or "Unclassified"
 */
export const resolveBarangay = (item) => {
  if (!item) return "Unclassified";

  // 1. Exact match on structured barangay field
  if (item.barangay && typeof item.barangay === "string") {
    const directMatch = TAYABAS_BARANGAYS.find(
      (b) => b.toLowerCase() === item.barangay.trim().toLowerCase()
    );
    if (directMatch) return directMatch;
  }

  // 2. Best-effort fuzzy match against raw legacy text
  const rawString = [
    item.barangay,
    item.location,
    item.locationMarker,
    item.stationId
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!rawString.trim()) return "Unclassified";

  // Prioritize longer barangay names to prevent partial substring collisions
  const sortedByLength = [...TAYABAS_BARANGAYS].sort((a, b) => b.length - a.length);
  const found = sortedByLength.find((b) => rawString.includes(b.toLowerCase()));

  return found || item.barangay || item.location || "Unclassified";
};

/**
 * Approximate geographic centroid coordinates [lat, lng] for each of the 66 barangays of Tayabas City.
 */
export const TAYABAS_BARANGAY_COORDINATES = {
  "Alitao": [14.04610, 121.53740],
  "Alsam Ibaba": [14.01924, 121.63259],
  "Alsam Ilaya": [14.04650, 121.63482],
  "Alupay": [14.05549, 121.61038],
  "Angeles Zone 1": [14.02450, 121.59400],
  "Angeles Zone 2": [14.02386, 121.59326],
  "Angeles Zone 3": [14.02520, 121.59550],
  "Angeles Zone 4": [14.02610, 121.59680],
  "Angustias Zone 1": [14.02580, 121.59200],
  "Angustias Zone II": [14.02685, 121.59124],
  "Angustias Zone III": [14.02780, 121.59080],
  "Angustias Zone IV": [14.02887, 121.59027],
  "Anos": [13.99135, 121.56823],
  "Ayaas": [14.02712, 121.60744],
  "Baguio": [14.01517, 121.58608],
  "Banilad": [14.00800, 121.55800],
  "Bukal Ibaba": [14.00668, 121.56791],
  "Bukal Ilaya": [14.01327, 121.53767],
  "Calantas": [14.02045, 121.55575],
  "Calumpang": [13.97589, 121.55687],
  "Camaysa": [14.04089, 121.57762],
  "Dapdap": [14.05628, 121.56393],
  "Domoit Kanluran": [13.97452, 121.58304],
  "Domoit Silangan": [13.97163, 121.59411],
  "Gibanga": [14.02526, 121.51626],
  "Ibas": [14.05753, 121.58367],
  "Ilasan Ibaba": [14.06351, 121.63433],
  "Ilasan Ilaya": [14.06366, 121.63439],
  "Ipilan": [14.03015, 121.57402],
  "Isabang": [13.96345, 121.56541],
  "Katigan Kanluran": [14.04448, 121.61738],
  "Katigan Silangan": [14.05450, 121.62242],
  "Lakawan": [14.01227, 121.62021],
  "Lalo": [14.04101, 121.57077],
  "Lawigue": [14.02491, 121.65422],
  "Lita": [14.01810, 121.59885],
  "Malaoa": [14.00781, 121.57893],
  "Masin": [14.05199, 121.63804],
  "Mate": [14.00364, 121.63578],
  "Mateuna": [14.02092, 121.60577],
  "Mayuwi": [13.96606, 121.57690],
  "Nangka Ibaba": [13.99371, 121.62504],
  "Nangka Ilaya": [14.00800, 121.62800],
  "Opias": [14.03032, 121.59555],
  "Palale Ibaba": [14.04696, 121.67381],
  "Palale Ilaya": [14.05190, 121.65736],
  "Palale Kanluran": [14.04034, 121.65281],
  "Palale Silangan": [14.07652, 121.68624],
  "Pandakaki": [13.99456, 121.62610],
  "Pook": [14.04853, 121.59653],
  "Potol": [13.99912, 121.57331],
  "San Diego Zone I": [14.02475, 121.59228],
  "San Diego Zone II": [14.02739, 121.59371],
  "San Diego Zone III": [14.02850, 121.59420],
  "San Diego Zone IV": [14.02980, 121.59500],
  "San Isidro Zone I": [14.02284, 121.58826],
  "San Isidro Zone II": [14.02400, 121.58900],
  "San Isidro Zone III": [14.02472, 121.58936],
  "San Isidro Zone IV": [14.02550, 121.59000],
  "San Roque Zone I": [14.02521, 121.59159],
  "San Roque Zone II": [14.02620, 121.59250],
  "Talolong": [14.07804, 121.61703],
  "Tamlong": [14.07240, 121.60851],
  "Tongko": [13.98418, 121.61108],
  "Valencia": [14.07217, 121.65128],
  "Wakas": [13.99958, 121.60651]
};

/**
 * Returns centroid coordinates for a given barangay name.
 * 
 * @param {string} barangay - Canonical barangay name
 * @returns {[number, number]} [lat, lng]
 */
export const getBarangayCoordinates = (barangay) => {
  if (!barangay) return TAYABAS_CENTER;
  return TAYABAS_BARANGAY_COORDINATES[barangay] || TAYABAS_CENTER;
};

