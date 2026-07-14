# workshop-03-demo-api

A simple demo REST API built with Express, created for a workshop that teaches non-developers how a front-end page (in another repo/project) can connect to and display data from an API.

> **Note:** The destinations, ratings, and figures in `data/data.json` are fictional sample data for teaching purposes only. They are not CrescentRating's real GMTI ratings or research data.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```
2. Start the server:
   ```
   npm start
   ```
3. The API will be available at `http://localhost:3000`.

CORS is enabled, so pages served from a different origin (e.g. a separate repo running on another port) can fetch data from this API directly in the browser. There is no authentication — every endpoint is open, but requests are rate-limited (see [Rate Limiting](#rate-limiting) below).

## Endpoints

### `GET /api/health`
Check that the API is running.

**Example response:**
```json
{
  "status": "success",
  "message": "API is live and running!"
}
```

### `GET /api/destinations`
List all destinations. Supports optional filtering via query parameters.

| Query param | Type   | Example                          | Description                          |
|-------------|--------|-----------------------------------|---------------------------------------|
| `country`   | string | `?country=Malaysia`                | Filter by exact country name          |
| `region`    | string | `?region=Asia`                     | Filter by region                      |
| `minRating` | number | `?minRating=6`                     | Only destinations rated this or higher |

**Example:** `GET /api/destinations?region=Asia&minRating=6`

**Example response:**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    { "id": 1, "name": "Kuala Lumpur", "country": "Malaysia", "region": "Asia", "rating": 7, "...": "..." }
  ]
}
```

### `GET /api/destinations/random`
Get a single random destination. Useful for demoing the API with a "surprise me" button.

**Example response:**
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "Dubai",
    "country": "United Arab Emirates",
    "region": "Middle East",
    "rating": 7,
    "halalRestaurants": 1800,
    "prayerFacilities": true,
    "description": "A modern Muslim-friendly hub offering luxury travel experiences with extensive halal dining and prayer facilities.",
    "bestSeason": "Winter",
    "tags": ["luxury", "shopping", "family"]
  }
}
```

### `GET /api/destinations/:id`
Get a single destination by its `id`.

**Example:** `GET /api/destinations/1`

**Example response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Kuala Lumpur",
    "country": "Malaysia",
    "region": "Asia",
    "rating": 7,
    "halalRestaurants": 1250,
    "prayerFacilities": true,
    "description": "A leading Muslim-friendly destination known for its halal food scene, mosques, and family-friendly attractions.",
    "bestSeason": "Year-round",
    "tags": ["shopping", "food", "family"]
  }
}
```

Returns `404` if no destination matches the id.

### `GET /api/destinations/search?q=keyword`
Search destinations by name, country, or tag.

**Example:** `GET /api/destinations/search?q=food`

Returns `400` if the `q` parameter is missing.

### `GET /api/stats`
Get aggregate statistics across all destinations.

**Example response:**
```json
{
  "status": "success",
  "data": {
    "totalDestinations": 8,
    "totalHalalRestaurants": 9000,
    "averageRating": 5.88,
    "withPrayerFacilities": 7
  }
}
```

## Rate Limiting

There's no authentication on this API — every endpoint is open. Instead, `express-rate-limit` caps each client to **100 requests per 15 minutes**, tracked by IP address using an in-memory store (see `index.js`). This is sufficient for a single-machine demo but won't share state across multiple server instances.

If a client exceeds the limit, they'll get:
```json
{
  "status": "error",
  "message": "Too many requests, please try again later."
}
```
with a `429` status code. `RateLimit-*` response headers are included on every request so clients can see their remaining quota.

## Connecting from Another Repo/Page

Since CORS is enabled, any HTML page or front-end app can call this API directly with `fetch`:

```html
<script>
  fetch("http://localhost:3000/api/destinations")
    .then(response => response.json())
    .then(result => {
      console.log(result.data); // array of destinations
    })
    .catch(error => console.error("Failed to fetch destinations:", error));
</script>
```

Make sure this API server is running (`npm start`) before loading a page that fetches from it.
