"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
// Supabase client with service role key for server-side storage operations
exports.supabase = env_1.env.SUPABASE_URL && env_1.env.SUPABASE_SERVICE_ROLE_KEY
    ? (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;
