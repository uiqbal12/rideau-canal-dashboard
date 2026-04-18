# API Documentation — Rideau Canal Dashboard

Base URL: `http://localhost:3000` (local) or your Azure App Service URL

---

## GET /api/health
Returns server status.

**Response:**
```json
{ "status": "ok", "timestamp": "2025-01-15T14:30:00.000Z" }
```

---

## GET /api/latest
Returns the most recent 5-minute aggregation for each of the 3 locations.

**Response (array of 3 objects):**
```json
[
  {
    "id": "Dow's Lake-2025-01-15T14:30:00.000Z",
    "location": "Dow's Lake",
    "windowEnd": "2025-01-15T14:30:00.000Z",
    "avgIceThickness": 31.4,
    "minIceThickness": 29.2,
    "maxIceThickness": 33.6,
    "avgSurfaceTemp": -3.8,
    "minSurfaceTemp": -4.5,
    "maxSurfaceTemp": -3.1,
    "maxSnowAccumulation": 4.2,
    "avgExternalTemp": -7.6,
    "readingCount": 30,
    "safetyStatus": "Safe"
  },
  ...
]
```

**Safety Status Values:**
- `Safe` — avgIceThickness ≥ 30cm AND avgSurfaceTemp ≤ -2°C
- `Caution` — avgIceThickness ≥ 25cm AND avgSurfaceTemp ≤ 0°C
- `Unsafe` — all other conditions

---

## GET /api/history
Returns all aggregations from the last hour (for trend charts).

**Response:** Array of aggregation objects ordered by `windowEnd` ascending.

**Use case:** Feed into Chart.js time-series charts to show trends over the past 60 minutes.