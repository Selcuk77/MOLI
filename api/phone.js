import {authorized,bodyOf} from '../lib/server-auth.js';
import {admin,smsEnabled,twilio} from '../lib/services.js';
export default async function handler(req,res){try{
 const auth=await authorized(req,res);if(!auth)return;if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});if(!smsEnabled())return res.status(503).json({error:'sms_not_configured'});
 const p=bodyOf(req),db=admin();if(!['send','check'].includes(p.action)||!/^\+[1-9]\d{7,14}$/.test(p.phone||''))return res.status(400).json({error:'invalid_phone'});
 const uid=auth.user.id;const {data:old}=await db.from('moli_contacts').select('*').eq('user_id',uid).maybeSingle();const now=Date.now();
 if(p.action==='send'){
 if(old?.last_sent_at&&now-+new Date(old.last_sent_at)<60000)return res.status(429).json({error:'rate_limited'});
 // Reserve a per-user hourly quota before invoking a paid external service.
 const hour=old?.last_sent_at&&now-+new Date(old.last_sent_at)<3600000;const attempts=hour?(old.attempts||0):0;if(attempts>=3)return res.status(429).json({error:'rate_limited'});
 const next={phone:p.phone,verified_at:null,last_sent_at:new Date().toISOString(),attempts:attempts+1};let reservation;
 if(old)reservation=await db.from('moli_contacts').update(next).eq('user_id',uid).eq('last_sent_at',old.last_sent_at).select('user_id').maybeSingle();else reservation=await db.from('moli_contacts').insert({user_id:uid,...next}).select('user_id').single();
 if(reservation.error||!reservation.data)return res.status(429).json({error:'rate_limited'});
 const r=await twilio(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,{To:p.phone,Channel:'sms'});if(!r.ok)return res.status(502).json({error:'verification_failed'});return res.status(200).json({ok:true});
 }
 if(!old||old.phone!==p.phone||!/^\d{4,8}$/.test(p.code||'')||now-+new Date(old.last_sent_at)>600000)return res.status(400).json({error:'invalid_verification'});
 const r=await twilio(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,{To:p.phone,Code:p.code});const result=await r.json();if(!r.ok||result.status!=='approved')return res.status(400).json({error:'invalid_verification'});
 const {error}=await db.from('moli_contacts').update({verified_at:new Date().toISOString()}).eq('user_id',uid).eq('phone',p.phone);if(error)throw error;return res.status(200).json({ok:true});
 }catch{return res.status(503).json({error:'verification_unavailable'})}}
