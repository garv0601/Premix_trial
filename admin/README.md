# ANNAPURNA Admin Panel

This is the administrative dashboard for Maa's Kitchen. It is built as a separate application from the main customer-facing website to ensure security and maintainability.

## Project Structure

The admin panel is located in the `admin/` directory:

```
admin/
├── frontend/  # React/Vite admin dashboard (Port 3001)
└── backend/   # Placeholder for future server-side admin logic
```

## How to Run the Admin Frontend

The Admin Frontend is a React application built with Vite. It runs independently of the main customer-facing website.

1. **Open a terminal** and navigate to the admin frontend directory:
   ```bash
   cd admin/frontend
   ```

2. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3001`

*(Note: The main customer-facing website runs on port 3000, and the admin panel runs on port 3001 to avoid conflicts).*

## About the Admin Backend

Currently, the `admin/backend/` folder is empty.

For the initial phases of development, the Admin Frontend is designed to connect **directly to Supabase** (acting as a Backend-as-a-Service) using the Supabase Javascript Client. 

The data you currently see in the Dashboard, Orders, and Products pages is powered by local mock data within the `src/services/` folder. This is intentionally designed so that in the next phase, these mock service functions can be swapped out for real Supabase queries without having to rebuild the UI.

If complex server-side operations (like generating PDF invoices, bulk processing, or cron jobs) are required in the future, they will be built inside the `admin/backend/` directory using Node.js/Express. **You do not need to start the admin backend right now.**
