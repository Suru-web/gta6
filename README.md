# 🌴 Help a Brother Out to Play GTA 6 🎮

> **"Rockstar waited 12+ years. My bank balance is ₹0. Help a brother get a PS5 & GTA VI on launch day."**

A high-performance, neon-drenched Vice City themed crowdfunding website designed specifically for deployment on **Vercel**. Donors can contribute ₹1 to ₹100 via direct UPI QR codes or mobile UPI intents, enter their names, and earn eternal glory on the **Hall of Legends** carousel and live marquee with authentic GTA memes and sound effects.

---

## ⚡ Highlights & Features

- **Vice City 80s / GTA VI Aesthetic**: Neon pink (`#ff007f`), cyan (`#00f0ff`), deep Miami violet, retro synthwave grid, and custom bold typography.
- **Dynamic UPI Payment & QR Code**:
  - Dynamically encodes the selected donation amount (₹1, ₹10, ₹25, ₹50, ₹69, ₹100, or custom) into the UPI URL (`upi://pay?pa=...&am=...`).
  - Mobile 1-click button to launch Google Pay, PhonePe, Paytm, or BHIM directly.
  - Interactive QR customizer: Upload your own static QR code or change your UPI ID directly from the UI or config.
- **The Meme Vault**:
  - **"PLEASE BROTHER"** beggar section with cat memes, Bernie Sanders, Gigachad rules, and an interactive "Desperate Reason Generator 🎲".
  - **"THANK YOU / YOU ARE GREAT"** celebration modal with confetti explosion, GTA *Mission Passed! Respect +* audio fanfare, and Gigachad memes.
- **Live Donor Feed & Carousel**:
  - Infinite auto-scrolling top marquee ticker displaying recent donations.
  - Interactive **Hall of Legends** carousel with filtering (*All Legends*, *Top Chads*, *Recent*).
  - Target tracker: **₹69,900** progress bar with milestone checkpoints (HDMI Cable ➔ Controller ➔ PS5 ➔ GTA VI Steelbook Pre-order).
- **Easter Eggs & Audio**:
  - Interactive GTA Cheat Code Terminal (`HESOYAM`, `BAGUVIX`, `SEAWAYS`, etc.).
  - Web Audio API synthesized 8-bit sound effects (coin sounds, mission passed chords, cheat confirmation tone) — **zero external audio dependencies, zero 404s**.
  - Sound mute/unmute toggle.

---

## 🚀 How the Database Works on Vercel

Vercel serverless functions have a read-only filesystem except `/tmp` (which resets on cold starts). This project handles database persistence seamlessly:

1. **Zero-Config Default (Out of the Box)**:
   - Seeded with classic GTA donor data (`src/data/seed-donations.json`).
   - Writes to `/tmp/gta6_donations.json` on Vercel without throwing `EROFS` errors.
   - Synchronizes with browser `localStorage`, ensuring donors always see their contributions in real time.
2. **Permanent Production Cloud Storage (1-Click Free)**:
   - Built-in support for **Upstash Redis** (10,000 commands/day free forever).
   - In your Vercel Dashboard, go to **Storage ➔ Upstash Redis** (or sign up at [upstash.com](https://upstash.com)).
   - Add the two environment variables in Vercel:
     ```env
     UPSTASH_REDIS_REST_URL="https://...upstash.io"
     UPSTASH_REDIS_REST_TOKEN="..."
     ```
   - All donations are now permanently saved to cloud storage across all Vercel edge/serverless instances!

---

## 🛠️ Deploying to Vercel

### Option 1: Via GitHub & Vercel Dashboard (Recommended)
1. Initialize your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: initial commit for GTA 6 help website"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will build and deploy the Next.js app in seconds!

### Option 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## ⚙️ Customizing Your UPI ID & QR Code

### Method A: Through the Website (No code changes needed!)
1. Open the website.
2. Click the **Gear icon (⚙️)** in the top right navbar or the **"Configure UPI / QR"** button in the footer.
3. Enter your real UPI ID (e.g., `yourname@okhdfcbank` or `9876543210@paytm`) and Payee Name, or upload your static UPI QR image.
4. Click **Save Changes** — it saves to your browser!

### Method B: In Code (Permanent for all visitors)
Open [`src/config/site.ts`](file:///Users/suraj/.Projects/gta6-help/src/config/site.ts) and edit:
```ts
export const SITE_CONFIG = {
  defaultUpiId: "yourrealname@okhdfcbank", // <-- Replace with your real UPI ID
  defaultPayeeName: "Your Name",           // <-- Replace with your name
  defaultNote: "GTA6 Game Fund",
  targetAmount: 69900,                    // Target amount in INR
  ...
};
```

---

## 💻 Local Development

```bash
# Using bun (recommended)
bun install
bun run dev

# Or using npm
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
