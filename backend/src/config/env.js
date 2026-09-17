/**
 * ANNAPURNA Backend — Environment Bootstrap
 *
 * Must be the FIRST import in server.js. ES module imports are hoisted and
 * evaluated before any other top-level code in the importing file, so calling
 * dotenv.config() from inside server.js (after its own import statements) runs
 * too late — modules like config/cashfree.js and config/supabase.js read
 * process.env at import time and would otherwise always see undefined values.
 */
import dotenv from 'dotenv';

dotenv.config();
