# SplitMate 💸

SplitMate is a modern, full-stack, **Offline-First** mobile and web application designed to help friends and groups easily log shared expenses, distribute bills equally, and instantly track exactly who owes what. 

## Features
- **True Offline Capability:** Fully functional without an internet connection! The app caches your data and seamlessly syncs to the backend when you regain connectivity.
- **Group Management:** Create groups, set unique currencies, and invite friends.
- **Expense Timeline:** Log exact expenses tied directly to specific group members.
- **Dynamic Split Engine:** Automatically distribute and calculate equal bill distribution among selected members.
- **Interactive Settlement:** Per-expense precise settlement tracker. Mark individual friends as "Settled" with a single click.
- **Sleek UI:** Smooth micro-animations, glassmorphism design elements, and an immersive dark mode experience.
- **Cross-Platform:** Available as a responsive web app and a native Android `.apk` via Capacitor.

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js, Express (Serverless Compatible)
- **Database:** MongoDB Atlas
- **Mobile Bridge:** Capacitor
- **Styling:** Vanilla CSS, Tailwind, Lucide React Icons

## Getting Started Locally

### Prerequisites
- Node.js installed
- A MongoDB cluster/connection URI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd SplitMate
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   - Create a file named `.env` in the root of the directory.
   - Add your secure MongoDB Connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
   PORT=3000
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```
   *The app will automatically launch the Express server and Vite frontend concurrently.*

## Generating the Android Mobile App (.apk)

SplitMate uses Capacitor to wrap the web experience into a native Android app.

1. Create a `.env.production` file and set your live API URL (e.g. your Vercel URL):
   ```env
   VITE_API_URL=https://your-live-domain.vercel.app
   ```
2. Build the web assets and sync to the Android folder:
   ```bash
   npm run build
   npx cap sync
   ```
3. Open Android Studio and compile the `.apk`:
   ```bash
   npx cap open android
   ```
   *In Android Studio: Click Build > Build Bundle(s) / APK(s) > Build APK(s).*

## Vercel Deployment

SplitMate is strictly engineered to deploy seamlessly on Vercel's Free Tier using **Serverless Functions**.

1. Connect your GitHub repository to Vercel.
2. In the Vercel deployment settings, add the `MONGODB_URI` environment variable.
3. Click **Deploy**. Vercel will automatically route all `/api/*` traffic to the backend, and serve your React app simultaneously!
