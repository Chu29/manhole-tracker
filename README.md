# Manhole Tracker

A mobile app and backend system that helps field technicians register, locate, and inspect manholes — even in areas where road resurfacing or dirt has hidden them. It uses real-time GPS proximity sorting so the closest manhole always floats to the top, works offline, and syncs everything automatically when you're back online.

## Overview

Field crews often waste time searching for manholes that have been covered by dirt, asphalt, or debris. Manhole Tracker lets technicians register each manhole's exact GPS location during a survey, capturing photos and metadata. Later, when they return to the site, the app shows a list of all nearby manholes sorted by distance — and that list updates live as the technician moves, without any manual searching. Inspections can be logged on the spot, and everything works even without a cell signal, queuing up data until connectivity returns.

## Features

* **Real-time proximity list** – As the technician walks or drives, the list of nearby manholes automatically re-sorts by live GPS distance, keeping the nearest one at the top.
* **Offline-first with sync** – The app works fully offline using cached data. New registrations and inspections are queued locally and automatically sync when a connection is restored.
* **Inspection logging** – Log inspection notes and photos directly against a manhole, with a full inspection history visible in the detail screen.
* **Map view with filtering** – See all manholes on a map with color-coded utility types and status filters. Tap a manhole to inspect or navigate to its detail view.
* **Photo capture and upload** – Take or select photos during manhole registration or inspection, with automatic upload and local storage fallback.
* **Secure authentication** – Technician registration and login with JWT tokens and bcrypt password hashing.
## Installation

### Prerequisites

- Node.js >= 20.19.0
- PostgreSQL 12+ with the PostGIS extension enabled
- A physical device or emulator with Expo Go (the mobile app is built with Expo SDK 54)

### 1. Clone the repository

```bash
git clone git@github.com:Chu29/manhole-tracker.git
cd manhole-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the backend

Navigate to the backend directory and create an environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Fill in the values in `apps/backend/.env`. At a minimum you need:

- `DATABASE_URL` — a PostgreSQL connection string to a database where you can run `CREATE EXTENSION postgis`
- `JWT_SECRET` — a long random string for signing auth tokens

Then run the database migration and start the server:

```bash
npm run backend:migrate   # creates tables + indexes
npm run backend:dev       # starts on http://localhost:3000
```

### 4. Set up the mobile app

From the monorepo root, start the Expo development server:

```bash
npm run mobile
```

On your device, install Expo Go and scan the QR code displayed in the terminal, or connect via USB.

**Testing on a physical device**: open `apps/mobile/api/client.ts` and set `EXPO_PUBLIC_API_URL` to your computer's LAN IP (e.g. `http://192.168.1.42:3000`). Alternatively, create an `.env` file with that variable.

## Usage

**Mobile app workflow:**
1. Open the app and log in or register as a technician.
2. Use the **Register** tab to capture a manhole’s GPS location, photo, and metadata. The manhole is saved immediately — online or offline.
3. On the **Nearby** tab, the real-time proximity list shows manholes around you, sorted by distance.
4. Switch to the **Map** tab to see manholes on a satellite or map view, filter by utility type or status, and tap any marker to inspect.
5. From a manhole’s detail screen, you can edit its information and log new inspections with notes and photos.

**Backend API**: you can test endpoints directly with cURL. A complete set of examples is available in the [curl endpoints documentation](https://github.com/Chu29/manhole-tracker/blob/main/apps/backend/curl-endpoints.md).

## Technologies Used

| Technology | Use |
|---|---|
| [React Native](https://reactnative.dev/) | Mobile UI framework |
| [Expo](https://expo.dev/) (SDK 54) | Build and development toolchain |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based routing and navigation |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) | Backend REST API |
| [PostgreSQL](https://www.postgresql.org/) + [PostGIS](https://postgis.net/) | Geospatial database |
| [JWT](https://jwt.io/) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Authentication |
| [Axios](https://axios-http.com/) | HTTP client |
| [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo) | Network status detection |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Offline cache and queue storage |

## API Documentation

All endpoints that require authentication expect a `Bearer <token>` header.

Base URL: `http://localhost:3000/api`

### Authentication

#### POST /auth/register

**Description**: Register a new technician account.

**Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Response** `201`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "technician": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "orgId": null,
    "role": "technician",
    "createdAt": "2026-07-04T12:00:00.000Z"
  }
}
```

**Errors**:
- 400 – Missing required fields or password < 8 characters
- 409 – Email already registered

---

#### POST /auth/login

**Description**: Authenticate and receive a JWT.

**Request**:
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Response** `200`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "technician": { ... }
}
```

**Errors**:
- 400 – Missing email or password
- 401 – Invalid credentials

---

#### GET /auth/me

**Description**: Get the currently authenticated technician's profile.

**Response** `200`:
```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "orgId": null,
  "role": "technician",
  "createdAt": "2026-07-04T12:00:00.000Z"
}
```

**Errors**:
- 401 – Missing or invalid token

---

#### POST /auth/logout

**Description**: Acknowledge logout (stateless; client should discard the token).

**Response** `200`:
```json
{
  "message": "Logout successful"
}
```

**Errors**:
- 401 – Invalid token

---

#### POST /auth/refresh

**Description**: Issue a new token for the authenticated technician.

**Response** `200`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors**:
- 401 – Invalid token

---

### Manholes (all require authentication)

#### POST /manholes

**Description**: Register a new manhole with GPS coordinates and metadata.

**Request**:
```json
{
  "code": "MH-0042",
  "lat": 40.7128,
  "lng": -74.0060,
  "utilityType": "sewer",
  "depthMeters": 2.5,
  "photoUrl": "https://storage.example.com/photo.jpg",
  "installDate": "2026-07-01"
}
```

**Response** `201`:
```json
{
  "id": "uuid",
  "code": "MH-0042",
  "lat": 40.7128,
  "lng": -74.0060,
  "utilityType": "sewer",
  "depthMeters": 2.5,
  "status": "active",
  "photoUrl": "https://storage.example.com/photo.jpg",
  "installDate": "2026-07-01",
  "lastInspectedAt": null,
  "lastInspectedBy": null,
  "createdAt": "2026-07-04T12:00:00.000Z"
}
```

**Errors**:
- 400 – lat/lng missing or invalid (must be valid latitude/longitude), unknown utility type
- 401 – Missing/invalid token

---

#### GET /manholes/nearby

**Description**: Find manholes within a given radius of a location, sorted by distance.

**Query params**:
- `lat` (required) – latitude
- `lng` (required) – longitude
- `radius` (optional) – search radius in meters (default: 200, max: 50000)

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "code": "MH-0042",
    "lat": 40.7128,
    "lng": -74.0060,
    "utilityType": "sewer",
    "status": "active",
    "distanceMeters": 12.3,
    "photoUrl": "...",
    "depthMeters": 2.5,
    "installDate": "2026-07-01",
    "lastInspectedAt": null,
    "lastInspectedBy": null,
    "createdAt": "2026-07-04T12:00:00.000Z"
  }
]
```

**Errors**:
- 400 – Missing lat/lng, radius not a positive number
- 401 – Missing/invalid token

---

#### GET /manholes/:id

**Description**: Get full details for a single manhole.

**Response** `200`: same shape as the create response.

**Errors**:
- 401 – Missing/invalid token
- 404 – Manhole not found

---

#### PATCH /manholes/:id

**Description**: Update one or more fields of a manhole (including moving its location). Provide only the fields you want to change.

**Request** (example):
```json
{
  "status": "damaged",
  "lat": 40.7130,
  "lng": -74.0065
}
```

**Response** `200`: the updated manhole object.

**Errors**:
- 400 – Invalid utility type, status, or lat/lng not provided together
- 401 – Missing/invalid token
- 404 – Manhole not found

---

#### DELETE /manholes/:id

**Description**: Delete a manhole record.

**Response** `204` (no content).

**Errors**:
- 401 – Missing/invalid token
- 404 – Manhole not found

---

#### POST /manholes/:id/inspect

**Description**: Mark a manhole as inspected right now by the authenticated technician. Sets `last_inspected_at` and `last_inspected_by`.

**Response** `204` (no content).

**Errors**:
- 401 – Missing/invalid token
- 404 – Manhole not found

---

### Inspections (all require authentication)

#### POST /manholes/:id/inspections

**Description**: Log a detailed inspection with notes and an optional photo.

**Request**:
```json
{
  "notes": "Cover is cracked, needs replacement",
  "photoUrl": "https://storage.example.com/inspection1.jpg"
}
```

**Response** `201`:
```json
{
  "id": "uuid",
  "manholeId": "uuid",
  "technicianId": "uuid",
  "notes": "Cover is cracked, needs replacement",
  "photoUrl": "https://storage.example.com/inspection1.jpg",
  "createdAt": "2026-07-04T13:00:00.000Z"
}
```

**Errors**:
- 401 – Missing/invalid token
- 404 – Manhole not found

---

#### GET /manholes/:id/inspections

**Description**: List all inspections for a manhole, newest first.

**Response** `200`: array of inspection objects (same shape as above).

**Errors**:
- 401 – Missing/invalid token
- 404 – Manhole not found

---

#### GET /manholes/:id/inspections/:inspectionId

**Description**: Get a single inspection record.

**Response** `200`: inspection object.

**Errors**:
- 404 – Inspection not found

---

#### PATCH /manholes/:id/inspections/:inspectionId

**Description**: Update the notes and/or photo of an inspection.

**Request**:
```json
{
  "notes": "Updated notes",
  "photoUrl": "https://example.com/new_photo.jpg"
}
```

**Response** `204` (no content).

**Errors**:
- 401 – Missing/invalid token
- 404 – Inspection not found

---

#### DELETE /manholes/:id/inspections/:inspectionId

**Description**: Delete an inspection record.

**Response** `204` (no content).

**Errors**:
- 401 – Missing/invalid token
- 404 – Inspection not found

---

### Uploads (authenticated)

#### POST /uploads/photo

**Description**: Upload an image file (multipart form data) and receive a URL. The file is stored locally by default; cloud storage providers can be wired in later.

**Request**: multipart form with field `photo` containing an image file (max 10 MB).

**Response** `200`:
```json
{
  "photoUrl": "http://localhost:3000/uploads/abc123.jpg"
}
```

**Errors**:
- 400 – No file, file too large, or not an image
- 401 – Missing/invalid token

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string with PostGIS extension |
| `JWT_SECRET` | Yes | Secret key for signing JSON Web Tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (e.g. `7d`, default `7d`) |
| `CLOUDINARY_URL` | No | Cloudinary connection string (if using Cloudinary for uploads) |

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to fork the repository and open a pull request. Make sure to follow the existing code style and include tests where applicable.

## Author

- **Chu Abuemkeze**
  - LinkedIn: [https://linkedin.com/in/chu-abuemkeze](https://linkedin.com/in/chu-abuemkeze)
  - X (Twitter): [https://x.com/unku_chu](https://x.com/unku_chu)

## Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-2F6791?style=for-the-badge&logo=postgis&logoColor=white)](https://postgis.net/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)