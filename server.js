/**
 * Rideau Canal Skateway — Dashboard Backend
 * Node.js + Express server that reads from Azure Cosmos DB
 */

require("dotenv").config();
const express    = require("express");
const { CosmosClient } = require("@azure/cosmos");
const path       = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Cosmos DB setup ───────────────────────────────────────────────────────────
const cosmosClient = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database     = cosmosClient.database("RideauCanalDB");
const container    = database.container("SensorAggregations");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── GET /api/latest  →  Most recent aggregation for each location ─────────────
app.get("/api/latest", async (req, res) => {
  try {
    const locations = ["Dow's Lake", "Fifth Avenue", "NAC"];
    const results   = [];

    for (const location of locations) {
      const { resources } = await container.items
        .query({
          query: "SELECT TOP 1 * FROM c WHERE c.location = @loc ORDER BY c._ts DESC",
          parameters: [{ name: "@loc", value: location }],
        })
        .fetchAll();

      if (resources.length > 0) results.push(resources[0]);
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching latest data:", err.message);
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
});

// ── GET /api/history  →  Last hour of aggregations for trend charts ───────────
app.get("/api/history", async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { resources } = await container.items
      .query({
          query: "SELECT * FROM c WHERE c.windowEnd >= @cutoff",
        parameters: [{ name: "@cutoff", value: oneHourAgo }],
      })
      .fetchAll();
      resources.sort((a, b) => new Date(a.windowEnd) - new Date(b.windowEnd));

    res.json(resources);
  } catch (err) {
    console.error("Error fetching history:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ── Serve index.html for all other routes (SPA fallback) ─────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Rideau Canal Dashboard running at http://localhost:${PORT}`);
});