# Verka Ferozepur — Daily Report Dashboard

Multi-department dairy dashboard for Verka Dairy, Ferozepur. Marketing, Procurement, Processing, and VAP Manufacturing teams enter daily data that syncs across all office computers.

---

## 📋 Setup Guide (One Time)

### Step 1 — Create a Firebase Project

1. Open https://console.firebase.google.com
2. Click **"Create a project"**
3. Name: `Verka Ferozepur Dashboard`
4. **Disable** Google Analytics
5. Click **"Create project"** and wait ~30 seconds

### Step 2 — Enable Firestore Database

1. In the Firebase Console, click **"Firestore Database"** (left menu)
2. Click **"Create database"**
3. Choose **"Start in test mode"**
4. Location: **asia-south1** (Mumbai)
5. Click **"Enable"**

### Step 3 — Register Web App & Get Config

1. In Firebase Console, click **⚙ Project settings** → **"Add app"** → **Web** (`</>` icon)
2. Nickname: `Verka Dashboard`
3. **Uncheck** "Firebase Hosting" (not needed)
4. Click **"Register app"**
5. Copy the `firebaseConfig` object shown — you'll need it in **Step 5**

### Step 4 — Create Database Collections

1. In Firestore Database, click **"Start collection"**
2. Collection ID: `records`
3. Document ID: click **"Auto-ID"**
4. Add field: `date` (type `string`, value `2026-06-04`)
5. Click **"Save"**
6. Repeat: create another collection called `goals` (any sample field)

### Step 5 — Configure the App

1. Open the project folder and navigate to `src/firebase-config.js`
2. Paste your `firebaseConfig` object there (replace the placeholders)
3. Save the file

### Step 6 — Build & Share

```bash
npm install
npm run build
```

Then share the `dist/` folder however you like:
- **Option A**: Upload to any web hosting (Netlify, Vercel, GitHub Pages)
- **Option B**: Open `dist/index.html` directly in a browser (works locally)
- **Option C**: Run `npx serve dist` for a quick local server

Everyone opens the same URL → data syncs automatically.

---

## 🖥️ Daily Use

| Department | What to Enter |
|---|---|
| **Marketing** | Sale value, volume, routes, institutional sale, exports, avg realization |
| **Procurement** | Milk received, fat%, SNF%, own societies, direct/market, proc rate |
| **Processing** | Milk processed, capacity, city supply, city supply cap |
| **VAP Manufacturing** | Dahi, lassi, paneer, ghee, milk powder, ice cream, kheer, rabri, kaju badam, sweets, butter, cheese |

### Navigation

| Key | Action |
|---|---|
| `Ctrl+S` | Save entry |
| `Ctrl+E` | Export Excel |
| `Ctrl+1` | Daily Entry page |
| `Ctrl+2` | MTD Summary |
| `Ctrl+3` | Analytics |
| `Ctrl+4` | History |
| `T` | Today's date |
| `?` | Keyboard shortcuts |
| `Esc` | Close modals |

---

## 📊 Excel Export

The Export button generates a professionally formatted workbook with:
- **Cover sheet**: Department-wise MTD KPIs with color-coded sections
- **Data sheet**: All daily records with grouped headers, merged cells, alternating colors

---

## 📁 Project Structure

```
src/
├── main.js              # App controller, routing, saves
├── data.js              # Data model, CRUD, aggregation
├── sync.js              # Firebase sync client
├── firebase-config.js   # ⬅️ Your Firebase config goes here
├── charts.js            # Chart.js helpers
├── export.js            # Excel export
├── import.js            # XLSX/CSV import
├── style.css            # Complete design system
└── pages/
    ├── pages.js         # Entry KPIs, Summary, Marketing, Procurement, Processing, VAP
    ├── analytics.js     # Multi-month trend charts
    ├── goals.js         # Monthly targets
    └── history.js       # Data table with sort/filter
server.js                # (Optional) local server — not needed with Firebase
```

---

## 🔧 Tech Stack

- Vanilla JS (no framework)
- Vite (build tool)
- Firebase Firestore (cloud database)
- Chart.js (charts)
- ExcelJS (Excel export)
- Tabler Icons (icons)
