import {authorized,bodyOf} from '../lib/server-auth.js';
import {reminderEnabled,smsEnabled} from '../lib/services.js';
import {initial,apply,diagnosticQuestion,unitQuestion,publicQuestion,correct} from '../public/learning-core.js';
export default async function handler(req,res){
 try{const auth=await authorized(req,res);if(!auth)return;const {client,user}=auth;const p=req.method==='POST'?bodyOf(req):{};
 const {data:profile}=await client.from('moli_profiles').select('role,language').eq('id',user.id).single();if(profile?.role!=='student')return res.status(403).json({error:'student_required'});
 let {data:row,error}=await client.from('moli_learning').select('state,revision').eq('user_id',user.id).maybeSingle();if(error)return res.status(503).json({error:'learning_setup_required'});
 if(!row){const {error:e}=await client.from('moli_learning').insert({user_id:user.id,state:initial(),revision:0});if(e)return res.status(409).json({error:'reload_required'});row={state:initial(),revision:0}}
 const state=row.state,lang=(p.language||req.query?.language)==='en'?'en':(p.language||req.query?.language)==='tr'?'tr':profile.language||'tr';let feedback=null;
 if(req.method==='POST'){
 if(p.revision!==row.revision)return res.status(409).json({error:'reload_required'});
 if(['diagnostic','answer'].includes(p.action)){if(typeof p.value!=='string'||p.value.length>200||typeof(p.reason||'')!=='string'||(p.reason||'').length>1500)return res.status(400).json({error:'invalid_answer'});const q=p.action==='diagnostic'?diagnosticQuestion(state,lang):unitQuestion(state,p.topic,lang);if(q){const ok=correct(q,p.value);feedback={correct:ok,hint:q.hint,...(p.action==='answer'&&state.units[p.topic]?.mode!=='test'?{expected:q.answer}:{})}}}
 if(p.action==='minutes'){const last=state.lastMinuteAt||0;if(Date.now()-last<55000)return res.status(429).json({error:'rate_limited'});state.lastMinuteAt=Date.now()}
 apply(state,p.action,p,lang);
 const {data:updated,error:e}=await client.from('moli_learning').update({state,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('revision',row.revision).select('revision').maybeSingle();if(e)return res.status(503).json({error:'save_failed'});if(!updated)return res.status(409).json({error:'reload_required'});row.revision=updated.revision;
 }
 // The client gets saved results, but never the answer to the active question.
 const safe=JSON.parse(JSON.stringify(state));const dq=state.diagnostic.done?null:publicQuestion(diagnosticQuestion(state,lang));const questions=Object.fromEntries(Object.keys(state.units).map(id=>[id,publicQuestion(unitQuestion(state,id,lang))]));
 const {data:contact}=await client.from('moli_contacts').select('phone,verified_at').eq('user_id',user.id).maybeSingle();
 return res.status(200).json({state:safe,revision:row.revision,diagnosticQuestion:dq,questions,feedback,capabilities:{cloud:true,ai:!!process.env.AI_MODEL,email:reminderEnabled()&&!!process.env.RESEND_API_KEY&&!!process.env.REMINDER_FROM,sms:smsEnabled(),phoneVerified:!!contact?.verified_at,phone:contact?.phone||null}});
 }catch(e){return res.status(400).json({error:['locked','stale_question','practice_required','invalid_plan','invalid_step'].includes(e.message)?e.message:'invalid_request'})}
}
