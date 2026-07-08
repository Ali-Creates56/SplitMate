# SplitMate 💸

SplitMate is a modern, full-stack web application designed to help friends and groups easily log shared expenses, distribute bills equally, and instantly track exactly who owes what. 

## Features
- **Group Management:** Create groups and invite friends.
- **Expense Timeline:** Log exact expenses tied directly to specific group members.
- **Dynamic Split Engine:** Automatically distribute and calculate equal bill distribution among selected members.
- **Interactive Settlement:** Per-expense precise settlement tracker. Mark individual friends as "Settled" with a single click.
- **Sleek UI:** Smooth micro-animations, glassmorphism design elements, and an immersive dark mode experience.

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Styling:** Vanilla CSS, Tailwind, Lucide React Icons

## Getting Started Locally

### Prerequisites
- Node.js installed
- A MongoDB cluster/connection URI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd SplitMate-main
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   - Create a file named `.env` in the root of the directory.
   - Use the `.env.example` file as a blueprint. 
   - Add your own secure MongoDB Connection string and a custom JWT secret:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
   JWT_SECRET=my_custom_secret_key
   PORT=3000
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```
   *The app will automatically launch the Express server and Vite frontend concurrently.*
