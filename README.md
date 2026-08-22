# 🌐 Network Digital Twin

A full-stack web application that creates a live digital twin of a network — visualizing devices, connections, and their real-time status through an interactive topology map.

![Status](https://img.shields.io/badge/status-live-success)
![License](https://img.shields.io/badge/license-MIT-blue)

**🔗 Live Demo:** [network-digital-twin-jet.vercel.app](https://network-digital-twin-jet.vercel.app)
**🔗 API Docs:** [network-digital-twin-api.onrender.com/docs](https://network-digital-twin-api.onrender.com/docs)

> ⚠️ The backend is hosted on Render's free tier, which spins down after inactivity. The first request after idling can take up to ~50 seconds to respond while it wakes up.

---

## 📖 Overview

Network Digital Twin lets you model a network's infrastructure digitally: add routers, switches, and servers, connect them, monitor their online/offline status, and visualize the whole topology as an interactive, auto-arranged graph — all protected behind user authentication.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based Register/Login system with secure password hashing (bcrypt)
- 🖥️ **Device Management** — Add, edit, and delete devices (Router / Switch / Server)
- 🔗 **Connection Management** — Link devices together and remove connections, with automatic cleanup of orphaned connections when a device is deleted
- 📡 **Live Status Checks** — Ping-based device health checks, plus manual online/offline simulation for demo purposes
- 🗺️ **Interactive Topology** — Auto-arranged, hierarchical network graph powered by React Flow, with a live minimap and zoom/pan controls
- 📊 **Real-Time Dashboard** — Device and connection statistics that auto-refresh every 5 seconds
- 🛡️ **Rate Limiting** — Protects all sensitive endpoints against brute-force and abuse (5 req/min on auth, 30 req/min on data endpoints)
- 📱 **Responsive Design** — Fully usable on desktop, tablet, and mobile
- ⚠️ **Clear Error Handling** — Every action surfaces the real backend error message instead of a generic failure

---

## 🛠️ Tech Stack

**Backend**
- FastAPI (Python)
- PostgreSQL + SQLAlchemy ORM
- JWT Authentication (`python-jose`)
- Password hashing (`passlib` + `bcrypt`)
- Rate limiting (`slowapi`)

**Frontend**
- React (Vite)
- React Flow (`@xyflow/react`) for the topology visualization
- Vanilla CSS (custom dark theme, fully responsive)

**Deployment**
- Backend + Database: [Render](https://render.com)
- Frontend: [Vercel](https://vercel.com)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or a connection string to a remote instance)

### 1. Clone the repository
```bash
git clone https://github.com/ahmedesam2502-droid/NetworkDigitalTwin.git
cd NetworkDigitalTwin
```

### 2. Backend setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows PowerShell
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file inside `backend/` with:
```
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/network_digital_twin
JWT_SECRET_KEY=your_random_secret_key_here
```

> Generate a secure `JWT_SECRET_KEY` with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

Run the backend:
```bash
uvicorn app.main:app --reload
```
API will be available at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/` with:
```
VITE_API_URL=http://127.0.0.1:8000
```

Run the frontend:
```bash
npm run dev
```
App will be available at `http://localhost:5173`.

---

## 📡 API Reference

| Method | Endpoint | Auth Required | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/register` | ❌ | 5/min | Create a new user account |
| POST | `/login` | ❌ | 5/min | Log in and receive a JWT token |
| GET | `/me` | ✅ | — | Get the current authenticated user |
| GET | `/devices` | ❌ | — | List all devices |
| POST | `/devices` | ✅ | 30/min | Add a new device |
| GET | `/devices/{id}` | ❌ | — | Get a single device |
| PUT | `/devices/{id}` | ✅ | 30/min | Update a device |
| DELETE | `/devices/{id}` | ✅ | 30/min | Delete a device (and its connections) |
| POST | `/devices/{id}/check` | ✅ | 30/min | Ping-check a device's reachability |
| POST | `/devices/{id}/simulate` | ✅ | 30/min | Manually set a device's status |
| POST | `/devices/check-all` | ✅ | 10/min | Ping-check every device at once |
| GET | `/connections` | ❌ | — | List all connections |
| POST | `/connections` | ✅ | 30/min | Create a connection between two devices |
| DELETE | `/connections/{id}` | ✅ | 30/min | Delete a connection |
| GET | `/topology` | ❌ | — | Get full network topology (devices + connections) |
| GET | `/dashboard/stats` | ❌ | — | Get aggregate dashboard statistics |

Full interactive documentation available at [`/docs`](https://network-digital-twin-api.onrender.com/docs) (Swagger UI).

---

## 🔒 Security

- Passwords hashed with bcrypt, never stored in plain text
- JWT tokens signed with a random, environment-stored secret key (24h expiry)
- All write/delete endpoints require a valid authentication token
- Rate limiting on all sensitive endpoints (auth + data mutation)
- SQL injection protected via SQLAlchemy's ORM (no raw queries)
- CORS restricted to known frontend origins
- Secrets (`DATABASE_URL`, `JWT_SECRET_KEY`) kept out of source control via `.gitignore`

---

## 📸 Screenshots

### Login & Registration
![Login screen](screenshots/login.png)

### Dashboard & Network Topology
![Dashboard with topology](screenshots/dashboard.png)

### Adding a Device
![Add device modal](screenshots/add-device.png)

---

## 🗺️ Roadmap

- [ ] Email verification on registration
- [ ] Activity/event log for device and connection changes
- [ ] Device detail pages with historical monitoring
- [ ] Further UI polish

---

## 👤 Author

**Ahmed Essam**
GitHub: [@ahmedesam2502-droid](https://github.com/ahmedesam2502-droid)

---

## 📄 License

This project is licensed under the MIT License.
