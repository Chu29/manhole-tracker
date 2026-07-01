# Backend curl endpoint tests

Use these commands from any shell while the backend is running.

## 1. Start the API

From the monorepo root:

```bash
npm run backend:migrate
npm run backend:dev
```

If your database has already been migrated, only run:

```bash
npm run backend:dev
```

The examples below assume the API is available at `http://localhost:3000`.

```bash
export API_URL="http://localhost:3000/api"
```

## 2. Public health check

```bash
curl -i "$API_URL/health"
```

Expected: `200 OK` with `{"status":"ok"}`.

## 3. Auth endpoints

Register a technician:

```bash
curl -i -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Technician",
    "email": "tech@example.com",
    "password": "password123"
  }'
```

Login:

```bash
curl -i -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@example.com",
    "password": "password123"
  }'
```

Save a token for authenticated requests. If you have `jq` installed:

```bash
export TOKEN="$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tech@example.com","password":"password123"}' | jq -r '.token')"
```

Without `jq`, copy the `token` value from the login response and run:

```bash
export TOKEN="paste-token-here"
```

Get the current technician:

```bash
curl -i "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

Refresh the token:

```bash
curl -i -X POST "$API_URL/auth/refresh" \
  -H "Authorization: Bearer $TOKEN"
```

Logout validates the current token, then returns success:

```bash
curl -i -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN"
```

Auth failure check:

```bash
curl -i "$API_URL/auth/me"
```

Expected: `401 Unauthorized`.

## 4. Manhole endpoints

Create a manhole:

```bash
curl -i -X POST "$API_URL/manholes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MH-001",
    "lat": 4.0511,
    "lng": 9.7679,
    "utilityType": "sewer",
    "depthMeters": 2.5,
    "photoUrl": "https://example.com/manhole.jpg",
    "installDate": "2026-06-30"
  }'
```

Save the returned manhole ID. With `jq`:

```bash
export MANHOLE_ID="$(curl -s -X POST "$API_URL/manholes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MH-002",
    "lat": 4.0520,
    "lng": 9.7685,
    "utilityType": "water",
    "depthMeters": 0,
    "installDate": "2026-06-30"
  }' | jq -r '.id')"
```

Without `jq`:

```bash
export MANHOLE_ID="paste-manhole-id-here"
```

Get nearby manholes:

```bash
curl -i "$API_URL/manholes/nearby?lat=4.0511&lng=9.7679&radius=500" \
  -H "Authorization: Bearer $TOKEN"
```

Get a manhole by ID:

```bash
curl -i "$API_URL/manholes/$MANHOLE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Patch manhole metadata:

```bash
curl -i -X PATCH "$API_URL/manholes/$MANHOLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "damaged",
    "utilityType": "water",
    "depthMeters": 0
  }'
```

Patch manhole location:

```bash
curl -i -X PATCH "$API_URL/manholes/$MANHOLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 4.0525,
    "lng": 9.7690
  }'
```

Mark a manhole inspected with the shortcut endpoint:

```bash
curl -i -X POST "$API_URL/manholes/$MANHOLE_ID/inspect" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `204 No Content`. The backend sets `last_inspected_at` from server time and `last_inspected_by` from the token.

Delete a manhole:

```bash
curl -i -X DELETE "$API_URL/manholes/$MANHOLE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `204 No Content`.

## 5. Inspection log endpoints

Create an inspection log:

```bash
curl -i -X POST "$API_URL/manholes/$MANHOLE_ID/inspections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Cover is cracked. Needs repair.",
    "photoUrl": "https://example.com/inspection.jpg"
  }'
```

List inspection logs for a manhole:

```bash
curl -i "$API_URL/manholes/$MANHOLE_ID/inspections" \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Upload endpoint

The upload route validates image files, but storage is intentionally not implemented yet. A valid image currently returns `501`.

```bash
curl -i -X POST "$API_URL/uploads/photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/absolute/path/to/photo.jpg"
```

Expected until storage is implemented: `501 Not Implemented`.

Non-image upload validation:

```bash
curl -i -X POST "$API_URL/uploads/photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/absolute/path/to/file.txt"
```

Expected: `400 Bad Request`.

## 7. Validation and error checks

Invalid latitude:

```bash
curl -i -X POST "$API_URL/manholes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BAD-LAT",
    "lat": 91,
    "lng": 9.7679,
    "utilityType": "sewer"
  }'
```

Expected: `400 Bad Request`.

Invalid utility type:

```bash
curl -i -X POST "$API_URL/manholes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BAD-UTILITY",
    "lat": 4.0511,
    "lng": 9.7679,
    "utilityType": "gas"
  }'
```

Expected: `400 Bad Request`.

Invalid status on patch:

```bash
curl -i -X PATCH "$API_URL/manholes/$MANHOLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"unknown"}'
```

Expected: `400 Bad Request`.

Partial location patch:

```bash
curl -i -X PATCH "$API_URL/manholes/$MANHOLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat":4.0525}'
```

Expected: `400 Bad Request`.

Missing manhole:

```bash
curl -i "$API_URL/manholes/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `404 Not Found`.

Unknown API route:

```bash
curl -i "$API_URL/not-a-route"
```

Expected: `404 Not Found`.
