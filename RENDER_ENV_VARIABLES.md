# 🔐 RENDER ENVIRONMENT VARIABLES - QUICK REFERENCE

## What to Enter in Render Dashboard

When setting up your Web Service on Render, you'll need to add these environment variables:

---

## PostgreSQL Connection String (Example)
```
postgres://meshbi:abc123xyz@dpg-c4m5n2bv.render.com:5432/meshbi_school
```

---

## Extract These Values & Add to Render:

### 1️⃣ Extract from Connection String
```
postgres://meshbi:abc123xyz@dpg-c4m5n2bv.render.com:5432/meshbi_school
          └────┬────┘└───┬──┘│└──────────┬──────────┘│└┬┘└─────┬──────┘
          User  Password │   │   Hostname  │       Port  │   Database
                         │   │             │            │
```

### 2️⃣ Copy These into Render Dashboard

| Variable Name | Value | Example |
|---|---|---|
| `NODE_ENV` | `production` | `production` |
| `DB_HOST` | Hostname from connection string | `dpg-c4m5n2bv.render.com` |
| `DB_PORT` | Always `5432` | `5432` |
| `DB_NAME` | Database name | `meshbi_school` |
| `DB_USER` | User from connection string | `meshbi` |
| `DB_PASSWORD` | Password from connection string | `abc123xyz` |

---

## Where to Find Connection String on Render

1. Open your PostgreSQL database on Render
2. Click **"Connections"** tab
3. Copy the **"External Database URL"**
4. It looks like:
   ```
   postgres://user:password@host.render.com:port/database
   ```

---

## When Setting Up Web Service in Render:

### Build Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables (Add these):
```
NODE_ENV=production
DB_HOST=dpg-xxxxx.render.com
DB_PORT=5432
DB_NAME=meshbi_school
DB_USER=meshbi
DB_PASSWORD=xxxxxxxxxx
```

---

## Verification

After deployment, test these URLs:

```
https://meshbi-app.onrender.com/health/frontend
https://meshbi-app.onrender.com/api/health/backend
https://meshbi-app.onrender.com/api/health/database
https://meshbi-app.onrender.com/login
```

---

## Errors & Solutions

| Error | Solution |
|-------|----------|
| "Cannot connect to database" | Check DB_HOST, DB_PORT, DB_PASSWORD are correct |
| "Column does not exist" | Tables not created - run: `npm run init-db` |
| "No such table: users" | Users not seeded - run: `node database/scripts/seed_users.js` |
| "502 Bad Gateway" | Check Render logs - usually database connection issue |

---

## Password Security Tips

- **Don't share** your connection string with anyone
- **Don't commit** `.env` files to GitHub
- **Always use** Render Environment Variables
- **Rotate passwords** regularly in production

---

## Success Indicators

✅ Web Service shows "Live" (green)
✅ PostgreSQL shows "Available" (green)
✅ /health/frontend returns HTML page
✅ /api/health/backend returns JSON
✅ /api/health/database returns healthy status
✅ Can login with loic.admin@meshbi.com / Loic@Admin2026
