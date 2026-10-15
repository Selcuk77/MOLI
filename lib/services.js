import {createClient} from '@supabase/supabase-js';
export const admin=()=>process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
export const reminderEnabled=()=>process.env.REMINDERS_ENABLED==='true'&&!!process.env.CRON_SECRET&&!!process.env.SUPABASE_SERVICE_ROLE_KEY;
export const smsEnabled=()=>reminderEnabled()&&!!process.env.TWILIO_ACCOUNT_SID&&!!process.env.TWILIO_AUTH_TOKEN&&!!process.env.TWILIO_VERIFY_SERVICE_SID&&!!process.env.TWILIO_FROM;
export async function twilio(url,body){return fetch(url,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.TWILIO_ACCOUNT_SID+':'+process.env.TWILIO_AUTH_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),signal:AbortSignal.timeout(12000)})}
