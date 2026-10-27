# 🍽️ DirectDine — Restaurant Direct Ordering SaaS

Zero-commission direct food ordering infrastructure built with **Node.js, Express, PostgreSQL (with embedded PGlite engine), Next.js, and Socket.io**.

---

## 🚀 Quick Access URLs (Local Development)

| Service / Page | URL | Description |
|---|---|---|
| **Landing Page** | [http://localhost:3001](http://localhost:3001) | Platform overview, demo links & live WhatsApp bot simulator |
| **Spice Garden Menu** | [http://localhost:3001/spice-garden](http://localhost:3001/spice-garden) | Direct mobile-first customer storefront & ordering |
| **Chai & Bites Menu** | [http://localhost:3001/chai-and-bites](http://localhost:3001/chai-and-bites) | Second demo restaurant storefront |
| **Partner Dashboard** | [http://localhost:3001/dashboard](http://localhost:3001/dashboard) | Live orders board, sound alert, prep timer, stock 86 toggle |
| **Super Admin Panel** | [http://localhost:3001/admin](http://localhost:3001/admin) | Restaurant onboarding wizard, automated QR generator |
| **Backend REST API** | [http://localhost:5001/health](http://localhost:5001/health) | Express API & WebSocket server |

---

## 🔑 Demo Credentials

### 1. Restaurant Owner Dashboard (`/dashboard`)
- **Phone:** `+919876543210`
- **Password:** `spice123`
- **Restaurant:** Spice Garden

### 2. Super Admin Portal (`/admin`)
- **Phone:** `+919999999999`
- **Password:** `admin123`

### 3. Customer OTP Login (Checkout)
- **Demo OTP:** `123456` (or any 6 digits in development)

### 4. Active Demo Coupons
- `WELCOME10`: 10% OFF up to ₹100
- `FLAT50`: Flat ₹50 OFF on orders above ₹300

---

## 🏗️ 4-Part Architecture Workflow

### Part 1: Restaurant Onboarding (Admin)
- Super Admin logs in at `/admin`
- Onboards new restaurant: Name, Slug, WhatsApp Business phone, Address, Delivery radius (km), Fee, Min order, Timing
- System automatically generates:
  - Branded Storefront URL: `http://localhost:3001/[slug]`
  - High-resolution QR Code (ready for printing on tables, packaging & flyers)
  - Direct WhatsApp link: `https://wa.me/91XXXXXXXXXX?text=Hi`

### Part 2: Customer Flow
- **Raasta A (Direct Link / QR):** Customer visits `/[slug]`. Can filter pure veg / non-veg, select portion sizes (Half/Full), add spicy dips, enter cooking notes.
- **Raasta B (WhatsApp Bot):** Customer messages "Hi" to the bot. Bot instantly replies with menu link, reorder options, or status.
- **Checkout:** 1-tap OTP verification, auto-filled returning address, coupon application, loyalty points redemption, UPI/Card/COD payment selection.
- **Confirmation:** Confetti celebration and automatic redirect to live tracking page (`/track/[token]`).

### Part 3: Restaurant Kitchen Operations
- Live orders appear on the dashboard (`/dashboard`) with real-time sound chimes.
- 1-click **Accept** with customizable prep timer (15 min, 25 min, 40 min).
- 1-click **Reject** with cancellation reason and auto-refund trigger.
- Status progression: `Accepted` ➔ `Preparing` ➔ `Ready` ➔ `Out for Delivery` (assign rider name & phone) ➔ `Delivered`.
- Instant 86 item stock toggle (turn dishes on/off when ingredients run out).

### Part 4: Retention & Post-Delivery
- Order Delivered notification triggered on WhatsApp.
- Post-delivery rating page (`/rate/[token]`): 5-star rating and feedback review.
- Automatic credit of 50 bonus loyalty points upon feedback submission.
- Automated reorder option available on next WhatsApp chat.

---

## 🛠️ Running Locally

```bash
# 1. Backend Server (Port 5001)
cd backend
npm install
npm run db:init   # Creates tables and seeds initial demo restaurants
npm start

# 2. Frontend Application (Port 3001)
cd frontend
npm install
npm run dev
```

---

## 📱 Meta WhatsApp Cloud API Setup & Live Testing

The backend includes a dual-mode WhatsApp engine:
- **Mock Mode (Default):** Logs messages to terminal and database table `whatsapp_messages` without needing a Meta account.
- **Live Mode:** Dispatches real WhatsApp messages via Meta Graph Cloud API (`https://graph.facebook.com/v21.0/{phone_number_id}/messages`).

### Step 1: Get Meta Cloud API Credentials (Free)
1. Go to [developers.facebook.com](https://developers.facebook.com) and create or open your Meta App.
2. Under "Add products to your app", select **WhatsApp**.
3. Under **WhatsApp > API Setup**:
   - Copy the **Phone number ID** ➔ paste as `WHATSAPP_PHONE_NUMBER_ID` in `backend/.env`.
   - Copy the **Temporary access token** (or create a permanent System User Token in Business Settings) ➔ paste as `WHATSAPP_ACCESS_TOKEN` in `backend/.env`.
   - In the **To** dropdown, click "Manage phone numbers" and add your own personal WhatsApp phone number to receive test messages.

### Step 2: Configure Webhook (For Incoming Messages & Bot Replies)
For local testing, expose port 5001 using ngrok:
```bash
npx ngrok http 5001
```
Copy the HTTPS URL generated (e.g. `https://abc-123.ngrok-free.app`).

In Meta Developer Portal:
1. Go to **WhatsApp > Configuration**.
2. Click **Edit** next to Webhook:
   - **Callback URL:** `https://your-ngrok-url.ngrok-free.app/api/whatsapp/webhook`
   - **Verify Token:** `food-app-wa-verify-token` (must match `WHATSAPP_VERIFY_TOKEN` in `.env`)
3. Click **Verify and Save**.
4. In Webhook fields table, click **Manage** and subscribe to **messages**.

### Step 3: Test Live From Your Phone!
1. Send a WhatsApp message (e.g. `"Hi"`) from your verified phone number to Meta's test WhatsApp phone number.
2. The bot will automatically respond:
   - Reply `"biryani"` ➔ Bot searches menu and returns matching dishes with prices & order link.
   - Reply `"2"` ➔ Bot sends full digital menu categories and direct URL.
   - Reply `"3"` ➔ Bot returns active order live GPS tracking link.
   - Reply `"1"` ➔ Bot generates 1-tap reorder cart link.
3. When you place an order on the website, both the customer and restaurant owner receive instant WhatsApp alerts!

### Step 4: Test via Terminal CLI Tool
You can also trigger bot responses or test live sending directly from terminal:
```bash
# Test Bot intelligence locally:
node backend/scripts/test-whatsapp.js bot "Hi" 9876543210
node backend/scripts/test-whatsapp.js bot "biryani" 9876543210
node backend/scripts/test-whatsapp.js bot "3" 9876543210

# Test Live Message dispatch to your real phone number:
node backend/scripts/test-whatsapp.js live 9198XXXXXXXX "Hello! DirectDine Bot test message."
```

---

## 🚀 Production Deployment Options

### Option 1: 1-Click Deploy on Render (Recommended)
This repository includes a pre-configured `render.yaml` Blueprint.
1. Push this project to your GitHub repository.
2. In Render ([render.com](https://render.com)), click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically provision:
   - Managed PostgreSQL database (`directdine-db`).
   - Node.js Express backend with WebSockets (`directdine-backend`).
   - Next.js frontend (`directdine-frontend`).
5. On the first start, the backend automatically initializes all tables and seed data!
6. Add your `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in Backend Environment Variables.
7. Configure Meta Webhook URL to: `https://your-backend.onrender.com/api/whatsapp/webhook`.

### Option 2: Docker Compose (VPS / DigitalOcean / AWS / Coolify)
The project includes production Dockerfiles and root `docker-compose.yml`:
```bash
# Build and run Postgres + Backend + Frontend in background
docker compose up -d --build

# View container logs
docker compose logs -f backend
```
Containers started:
- `directdine-db`: PostgreSQL 16 on port `5432`
- `directdine-backend`: Express + WebSockets on port `5001`
- `directdine-frontend`: Next.js on port `3000`

### Option 3: Railway / Vercel / Supabase
- **Database:** Create a free PostgreSQL instance on [Supabase](https://supabase.com) or [Neon](https://neon.tech). Copy the `DATABASE_URL`.
- **Backend:** Deploy `backend` folder to Railway or Render. Set `USE_POSTGRES=true` and `DATABASE_URL=...`.
- **Frontend:** Deploy `frontend` folder to Vercel. Set `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`.

