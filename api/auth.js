import { createServerClient } from '@supabase/ssr';
import { parseCookie as parse, stringifySetCookie } from 'cookie';
const serialize=(name,value,options)=>stringifySetCookie({name,value,...options});
import { validateSignup,checkPassword,EMAIL,publicUser,originAllowed,authError } from '../lib/auth-core.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('Vary','Cookie');res.setHeader('Content-Type','application/json; charset=utf-8');
  const send=(status,data)=>res.status(status).json(data),action=req.query?.action||'session';
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return send(405,{error:'method_not_allowed'})}
  if(req.method==='GET'&&action!=='session')return send(405,{error:'method_not_allowed'});
  if(req.method==='POST'&&(!originAllowed(req.headers.origin)||!String(req.headers['content-type']||'').includes('application/json')))return send(403,{error:'invalid_origin'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
  if(!url||!key)return send(req.method==='GET'?200:503,{configured:false,user:null,error:req.method==='POST'?'not_configured':undefined});
  let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body)}catch{return send(400,{error:'invalid_request'})}}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>12000)return send(400,{error:'invalid_request'});
  const cookies=parse(req.headers.cookie||''),outgoing=new Map();
  const client=createServerClient(url,key,{cookieOptions:{path:'/',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'},cookies:{getAll:()=>Object.entries(cookies).map(([name,value])=>({name,value})),setAll:items=>{for(const {name,value,options}of items){cookies[name]=value;outgoing.set(name,serialize(name,value,{...options,path:'/',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}))}res.setHeader('Set-Cookie',[...outgoing.values()])}}});
  const callback=(flow='confirm')=>new URL('/?flow='+flow,process.env.SITE_URL||'https://moli-orcin.vercel.app').href;
  const current=async()=>{const {data:{user},error}=await client.auth.getUser();if(error||!user)return null;const {data:profile}=await client.from('moli_profiles').select('display_name,role,teacher_status,language').eq('id',user.id).maybeSingle();return publicUser(user,profile)};
  const fail=e=>send(e?.status===429?429:400,{error:authError(e)});
  try{
    if(action==='session')return send(200,{configured:true,user:await current()});
    if(action==='signup'){
      const invalid=validateSignup(body);if(invalid)return send(400,{error:invalid});
      const {data,error}=await client.auth.signUp({email:body.email.trim().toLowerCase(),password:body.password,options:{emailRedirectTo:callback(),data:{display_name:body.name.trim(),requested_role:body.role,language:body.language==='en'?'en':'tr',guardian_confirmed:body.role==='student',notice_version:'pilot-2026-10',accepted_at:new Date().toISOString()}}});
      if(error)return fail(error);
      // Do not disclose whether the supplied address already belongs to an account.
      if(data.session){await client.auth.signOut({scope:'local'});return send(409,{error:'confirmation_required'})}
      return send(200,{ok:true,needsConfirmation:true});
    }
    if(action==='login'){
      if(!EMAIL.test(String(body.email))||typeof body.password!=='string'||body.password.length>128)return send(400,{error:'invalid_credentials'});
      const {error}=await client.auth.signInWithPassword({email:body.email.trim().toLowerCase(),password:body.password});if(error)return fail(error);
      const user=await current();if(!user||!user.emailVerified){await client.auth.signOut({scope:'local'});return send(403,{error:'email_not_confirmed'})}
      return send(200,{ok:true,user});
    }
    if(action==='forgot'||action==='resend'){
      if(!EMAIL.test(String(body.email))||String(body.email).length>254)return send(400,{error:'invalid_email'});
      const email=body.email.trim().toLowerCase();const {error}=action==='forgot'?await client.auth.resetPasswordForEmail(email,{redirectTo:callback('recovery')}):await client.auth.resend({type:'signup',email,options:{emailRedirectTo:callback()}});
      if(error?.status===429)return fail(error);return send(200,{ok:true});
    }
    if(action==='confirm'){
      let result;
      if(typeof body.code==='string'&&body.code.length<4096)result=await client.auth.exchangeCodeForSession(body.code);
      else if(typeof body.token_hash==='string'&&body.token_hash.length<4096&&['email','signup','recovery'].includes(body.type))result=await client.auth.verifyOtp({token_hash:body.token_hash,type:body.type});
      else return send(400,{error:'expired_link'});
      if(result.error)return fail(result.error);return send(200,{ok:true,user:await current()});
    }
    if(action==='logout'){const {error}=await client.auth.signOut({scope:'local'});if(error)return fail(error);return send(200,{ok:true})}
    if(action==='password'){
      const user=await current();if(!user)return send(401,{error:'session_expired'});
      if(!checkPassword(body.password))return send(400,{error:'weak_password'});
      const {error}=await client.auth.updateUser({password:body.password});if(error)return fail(error);
      await client.auth.signOut({scope:'global'});return send(200,{ok:true});
    }
    if(action==='profile'){
      const user=await current();if(!user)return send(401,{error:'session_expired'});
      if(typeof body.name!=='string'||body.name.trim().length<2||body.name.trim().length>80)return send(400,{error:'invalid_name'});
      const {error}=await client.from('moli_profiles').update({display_name:body.name.trim(),language:body.language==='en'?'en':'tr'}).eq('id',user.id);if(error)return send(400,{error:'profile_not_ready'});
      return send(200,{ok:true,user:await current()});
    }
    return send(404,{error:'unknown_action'});
  }catch{return send(503,{error:'temporarily_unavailable'})}
}
