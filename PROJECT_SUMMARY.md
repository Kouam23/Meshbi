# 🎓 Meshbi School System - Complete Project Guide

## 📁 Project Structure (Logical Organization)

Your project is NOW reorganized into **3 independent components** that work together:

```
MESHBI/
│
├─── 📱 FRONTEND (EJS + Static Assets)
│    ├── css/                     (Stylesheets)
│    ├── js/                      (Client JavaScript)
│    ├── images/                  (Images & Assets)
│    └── views/                   (EJS templates)
│        ├── login.ejs
│        ├── admin/
│        ├── students/
│        ├── teacher/
│        ├── payments/
│        └── ...
│
├─── 🔧 BACKEND (Express.js Server)
│    ├── app.js                   (Main entry point)
│    ├── package.json             (Dependencies)
│    ├── .env                     (Configuration)
│    └── src/
│        ├── database.js          (PostgreSQL pool)
│        ├── routes/              (API endpoints)
│        │   ├── auth.js
│        │   ├── students.js
│        │   ├── teacher.js
│        │   ├── payments.js
│        │   └── ...
│        ├── middleware/          (i18n, auth, etc)
│        ├── models/              (Data models)
│        └── utils/               (Helpers & translations)
│
├─── 💾 DATABASE (Schema & Scripts)
│    └── scripts/
│        ├── init_db.js           (Create schema)
│        ├── seed_users.js        (Add 6 users)
│        ├── seed_db.js           (Populate data)
│        ├── migrate_dual_role.js (Migrations)
│        └── verify_workflow.js   (Validation)
│
├─── 🌐 Deploy & Config
│    ├── docker-compose.yml       (Local Docker)
│    ├── Dockerfile               (Container)
│    ├── package.json             (Root config)
│    ├── .env                     (Secrets)
│    └── .env.example             (Template)
│
└─── 📚 Documentation
     ├── DEPLOYMENT_GUIDE.md
     ├── HEALTH_CHECK_TESTING.md
     └── PROJECT_SUMMARY.md
```

---

## 🔄 How The 3 Components Work Together

### **Frontend Layer**
- **What it is:** EJS HTML templates + CSS/JS/images in `public/`
- **Where it runs:** In the browser (rendered by Express)
- **What it does:** 
  - Users see login form, dashboards, tables
  - Send data to backend via forms and AJAX calls
  - Display results from backend API

### **Backend Layer**
- **What it is:** Node.js Express server
- **Where it runs:** On your server (locally or on Render)
- **What it does:**
  - Handles HTTP requests from frontend
  - Validates user input
  - Talks to database
  - Sends JSON responses back to frontend
  - Serves static files (CSS, images) from `public/`

### **Database Layer**
- **What it is:** PostgreSQL database
- **Where it runs:** Separate database server (local, Docker, or Render)
- **What it does:**
  - Stores all data (users, students, grades, payments)
  - Handles database queries from backend
  - Maintains data integrity with constraints
  - Stores sessions for user authentication

---

## 🚀 Deployment Path: Local → Render

### **Local Setup (Development)**
```
Your Computer
├── Frontend: EJS templates render in browser
├── Backend: Node.js running on port 3000
└── Database: PostgreSQL running on localhost:5432
         ↓ (all on one machine)
    http://localhost:3000
```

**To run locally:**
```bash
# Make sure PostgreSQL is running
npm start
```

Then visit: `http://localhost:3000`

---

### **Docker Setup (Optional Local)**
```
Your Computer (with Docker)
├── Frontend: In Node container → EJS templates
├── Backend: In Node container → Express server
└── Database: In PostgreSQL container
         ↓ (all containerized)
    http://localhost:3000
```

**To run with Docker:**
```bash
docker-compose up -d
```

---

### **Render Production Setup**
```
Render Cloud Platform
├── Frontend: EJS in Render Web Service
├── Backend: Express in Render Web Service
└── Database: Render PostgreSQL (managed service)
         ↓ (separated but connected)
    https://meshbi-app.onrender.com
```

**To deploy to Render:**
1. Push code to GitHub
2. Create PostgreSQL database on Render (get connection string)
3. Create Web Service on Render (link to GitHub repo)
4. Set environment variables in Render dashboard
5. Initialize database (run scripts locally with remote DB)
6. Test with health check endpoints

---

## ✅ Health Check Endpoints

These endpoints verify each component independently:

| Endpoint | Component | Response | Purpose |
|----------|-----------|----------|---------|
| `/health/frontend` | Frontend | HTML page | "Frontend is Working" |
| `/api/health/backend` | Backend | JSON | Status, uptime, port |
| `/api/health/database` | Database (API) | JSON | DB version, time |
| `/health/database-page` | Database (HTML) | HTML page | "Database works perfectly" |

**Use these to verify deployment success!**

---

## 🔐 Security: Secrets Management

### What should be in `.env`:
- ✅ Database credentials (password, host, user)
- ✅ Application secret keys
- ✅ API tokens
- ✅ Environment flags (NODE_ENV)

### What `.env` and `.env.example` do:
- ✅ `.env` — Your actual secrets (add to `.gitignore`)
- ✅ `.env.example` — Template without secrets (safe to commit)

### How Render handles secrets:
- ❌ Never put `.env` file in GitHub
- ✅ Render dashboard has "Environment" tab
- ✅ Set variables there → Render injects at runtime
- ✅ Your app reads from `process.env` automatically

---

## 🎯 Initial Setup Steps

### Step 1: Local Development
```bash
# Install dependencies
npm install

# Initialize local database schema
npm run init-db

# Seed 6 default users
node src/scripts/seed_users.js

# Start the app
npm start
```

Visit: `http://localhost:3000/login`  
Login with: `loic.admin@meshbi.com` / `Loic@Admin2026`

---

### Step 2: Deploy to Render
```bash
# 1. Create PostgreSQL on Render (get connection string)
# 2. Create Web Service on Render (link GitHub)
# 3. Add environment variables
# 4. Initialize remote database (from local):

$env:DB_HOST="dpg-xxx.render.com"
$env:DB_USER="meshbi"
$env:DB_PASSWORD="[from-render]"
$env:DB_PORT="5432"
$env:DB_NAME="meshbi_school"
npm run init-db
node src/scripts/seed_users.js
```

---

## 🔗 Connection Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  USER BROWSER                                               │
│  Visits: https://meshbi-app.onrender.com                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ (1) HTTP Request
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  RENDER WEB SERVICE (Backend + Frontend)                    │
│  ├── Express.js server (app.js)                            │
│  ├── EJS template rendering                                 │
│  ├── Static files serving (public/)                        │
│  └── Route handlers (src/routes/)                          │
└──────────┬───────────────────────────────────────────┬──────┘
           │ (2) HTML/CSS/JS Response              │ (3) Query
           │                                       ↓
           ↓                               ┌──────────────────┐
    ┌──────────────┐                      │ RENDER PostgreSQL │
    │  User Browser │                      │ (Managed Service) │
    │  Displays UI  │                      │ meshbi_school DB │
    └──────────────┘                      └──────────────────┘
                                                    │
                                          (4) Data returned
                                                    │
                                          ┌─────────┘
                                          │
                                    ┌─────┴──────┐
                                    │ Express    │
                                    │ Processes  │
                                    │ Response   │
                                    └────────────┘
```

---

## ❓ FAQ

### Q: What's the difference between local and Render?
**A:** Same code, different infrastructure:
- **Local:** PostgreSQL at `localhost:5432`
- **Render:** PostgreSQL at `dpg-xxx.render.com:5432`  
- Both are identical PostgreSQL databases, just hosted differently

### Q: Do I need Docker to deploy?
**A:** No. Docker is optional for:
- Local development convenience
- Testing containerization locally

Render builds Docker images automatically—you don't need to submit one.

### Q: What if I mess up the database?
**A:** Easy to fix:
```bash
# Re-initialize (deletes old data):
npm run init-db

# Re-seed users:
node src/scripts/seed_users.js
```

### Q: How do I add more users?
**A:** Edit `src/scripts/seed_users.js`:
```javascript
const users = [
    { name: 'Your Name', email: 'email@domain.com', password: 'Password123', role: 'teacher', secondary_role: null },
    // Add more...
];
```

Then run: `node src/scripts/seed_users.js`

---

## 🛠️ Useful Commands

```bash
# Development
npm start                          # Start local server
npm run init-db                    # Initialize database schema
node src/scripts/seed_users.js    # Add default users

# Testing
curl http://localhost:3000/api/health/backend    # Backend check
curl http://localhost:3000/health/database-page  # Database check

# Docker (optional)
docker-compose up -d               # Start with Docker
docker-compose down                # Stop
docker-compose logs -f backend     # View logs
```

---

## 🎉 Summary

Your **Meshbi School System** is:
- ✅ Fully functional locally
- ✅ Ready to deploy on Render
- ✅ Has health checks for testing
- ✅ Uses PostgreSQL for data persistence
- ✅ Supports multiple user roles
- ✅ Multi-language (English/French)
- ✅ Audit logging for all actions
- ✅ Mobile responsive

**Next step:** Deploy to Render using the steps in `DEPLOYMENT_GUIDE.md` 🚀
