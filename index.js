const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { readFileSync } = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Rate limiter: caps each client to 100 requests per 15 minutes.
// In-memory store, fine for a single-machine demo (not for a multi-instance deployment).
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests, please try again later."
    }
});

// Middleware
app.use(cors()); // allows pages from other repos/origins to fetch this API
app.use(express.json());
app.use(limiter);

// Load demo data once at startup
const dataPath = path.join(__dirname, 'data', 'data.json');
const { destinations } = JSON.parse(readFileSync(dataPath, 'utf-8'));

// GET /api/health - check that the API is running
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "API is live and running!"
    });
});

// GET /api/destinations - list all destinations, with optional filters
// query params: ?country=Malaysia  ?region=Asia  ?minRating=6
app.get('/api/destinations', (req, res) => {
    const { country, region, minRating } = req.query;
    let results = destinations;

    if (country) {
        results = results.filter(d => d.country.toLowerCase() === country.toLowerCase());
    }
    if (region) {
        results = results.filter(d => d.region.toLowerCase() === region.toLowerCase());
    }
    if (minRating) {
        results = results.filter(d => d.rating >= Number(minRating));
    }

    res.status(200).json({
        status: "success",
        count: results.length,
        data: results
    });
});

// GET /api/destinations/search?q=keyword - search by name, country, or tag
app.get('/api/destinations/search', (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({
            status: "error",
            message: "Query parameter 'q' is required, e.g. /api/destinations/search?q=dubai"
        });
    }

    const keyword = q.toLowerCase();
    const results = destinations.filter(d =>
        d.name.toLowerCase().includes(keyword) ||
        d.country.toLowerCase().includes(keyword) ||
        d.tags.some(tag => tag.toLowerCase().includes(keyword))
    );

    res.status(200).json({
        status: "success",
        count: results.length,
        data: results
    });
});

// GET /api/destinations/random - get a single random destination
app.get('/api/destinations/random', (req, res) => {
    const destination = destinations[Math.floor(Math.random() * destinations.length)];

    res.status(200).json({
        status: "success",
        data: destination
    });
});

// GET /api/destinations/:id - get a single destination by id
app.get('/api/destinations/:id', (req, res) => {
    const id = Number(req.params.id);
    const destination = destinations.find(d => d.id === id);

    if (!destination) {
        return res.status(404).json({
            status: "error",
            message: `No destination found with id ${id}`
        });
    }

    res.status(200).json({
        status: "success",
        data: destination
    });
});

// GET /api/stats - aggregate demo stats across all destinations
app.get('/api/stats', (req, res) => {
    const totalDestinations = destinations.length;
    const totalHalalRestaurants = destinations.reduce((sum, d) => sum + d.halalRestaurants, 0);
    const averageRating = Number(
        (destinations.reduce((sum, d) => sum + d.rating, 0) / totalDestinations).toFixed(2)
    );
    const withPrayerFacilities = destinations.filter(d => d.prayerFacilities).length;

    res.status(200).json({
        status: "success",
        data: {
            totalDestinations,
            totalHalalRestaurants,
            averageRating,
            withPrayerFacilities
        }
    });
});

// Fallback for unmatched routes
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Route not found. See README.md for available endpoints."
    });
});

// Start listening for requests
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
