import {authorized} from '../lib/server-auth.js';
import {admin,reminderEnabled,smsEnabled,twilio} from '../lib/services.js';
import {nextSessions} from '../public/learning-core.js';
export default async function handler(req,res){try{
 if(!await authorized(req,res,{cron:true}))return;if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'method_not_allowed'});if(!reminderEnabled())return res.status(503).json({error:'reminders_not_configured'});const db=admin();if(!db)return res.status(503).json({error:'not_configured'});
 const now=new Date();let sent=0,failed=0;let offset=0;
 for(;;){const {data:rows,error}=await db.from('moli_learning').select('user_id,state').order('user_id').range(offset,offset+99);if(error)throw error;if(!rows.length)break;
 for(const row of rows){const plan=row.state.plan;if(!plan||(!plan.email&&!plan.sms))continue;let sessions;try{sessions=nextSessions(plan,now,1)}catch{continue}const when=sessions[0];if(!when)continue;const until=+new Date(when)-+now;
 // A once-per-minute scheduler dispatches between 10 and 9 minutes before start.
 if(until>600000||until<=540000)continue;
 const {data:{user},error:ue}=await db.auth.admin.getUserById(row.user_id);if(ue||!user?.email_confirmed_at)continue;
 const {data:profile}=await db.from('moli_profiles').select('language').eq('id',row.user_id).single();const en=profile?.language==='en';const time=new Intl.DateTimeFormat(en?'en-GB':'tr-TR',{timeZone:plan.zone,hour:'2-digit',minute:'2-digit'}).format(new Date(when));const link=new URL('/learn#plan',process.env.SITE_URL||'https://moli-orcin.vercel.app').href;
 const text=en?`Your MOLI study session starts at ${time} (${plan.zone}). Ready for a small step together? ${link} Manage reminders in My study plan.`:`MOLİ çalışma saatin ${time} (${plan.zone}). Birlikte küçük bir adım atmaya hazır mısın? ${link} Hatırlatmaları Çalışma planım bölümünden yönetebilirsin.`;
 for(const channel of ['email','sms']){if(!plan[channel])continue;if(channel==='email'&&(!process.env.RESEND_API_KEY||!process.env.REMINDER_FROM))continue;if(channel==='sms'&&!smsEnabled())continue;
 const id=`${row.user_id}:${when}:${channel}`;const {error:claimError}=await db.from('moli_deliveries').insert({id,user_id:row.user_id,channel,status:'claimed'});if(claimError)continue;
 try{let response;if(channel==='email'){response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:process.env.REMINDER_FROM,to:[user.email],subject:en?'MOLI · Your study session starts soon':'MOLİ · Çalışma saatin yaklaşıyor',text}),signal:AbortSignal.timeout(12000)})}
 else{const {data:contact}=await db.from('moli_contacts').select('phone,verified_at').eq('user_id',row.user_id).single();if(!contact?.verified_at){await db.from('moli_deliveries').update({status:'skipped_unverified'}).eq('id',id);continue}response=await twilio(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,{From:process.env.TWILIO_FROM,To:contact.phone,Body:text})}
 if(!response.ok)throw new Error('delivery_failed');await db.from('moli_deliveries').update({status:'accepted'}).eq('id',id);sent++;
 }catch{await db.from('moli_deliveries').update({status:'failed_or_unknown'}).eq('id',id);failed++}
 }
 }offset+=rows.length;if(rows.length<100)break}
 return res.status(200).json({accepted:sent,failed});
 }catch{return res.status(503).json({error:'reminder_run_failed'})}}
