# Rideau Canal Dashboard

Real-time web dashboard for the Rideau Canal Skateway monitoring system. Displays live ice conditions and safety status for three locations.

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and paste your Cosmos DB primary connection string.

### 3. Run locally
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000)

## Features
- **3 location cards** — Dow's Lake, Fifth Avenue, NAC
- **Safety badges** — Safe / Caution / Unsafe with colour coding
- **Overall system status** — shown in header
- **Auto-refresh** — every 30 seconds
- **Historical charts** — ice thickness and surface temperature for the last hour

## Deployment to Azure App Service
1. In Azure Portal, create an App Service (Node 18 LTS, Linux)
2. Go to **Configuration → Application Settings** and add `COSMOS_CONNECTION_STRING`
3. Deploy with VS Code Azure extension, GitHub Actions, or zip deploy:
```bash
zip -r app.zip . --exclude "node_modules/*" --exclude ".env"
az webapp deploy --resource-group YOUR_RG --name YOUR_APP_NAME --src-path app.zip
```