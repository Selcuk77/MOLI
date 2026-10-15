import {createServerClient} from '@supabase/ssr';
import {parseCookie,stringifySetCookie} from 'cookie';
import {originAllowed} from './auth-core.js';
export async function authorized(req,res,{cron=false}={}){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Vary','Cookie');
 if(cron){if(!process.env.CRON_SECRET||req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`){res.status(401).json({error:'unauthorized'});return null}return {cron:true}}
 if(!['GET','POST'].includes(req.method)){res.status(405).json({error:'method_not_allowed'});return null}
 if(req.method==='POST'&&(!originAllowed(req.headers.origin)||!String(req.headers['content-type']||'').includes('application/json'))){res.status(403).json({error:'invalid_origin'});return null}
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;if(!url||!key){res.status(503).json({error:'not_configured'});return null}
 const cookies=parseCookie(req.headers.cookie||''),out=new Map();const client=createServerClient(url,key,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll:()=>Object.entries(cookies).map(([name,value])=>({name,value})),setAll:items=>{for(const {name,value,options} of items){cookies[name]=value;out.set(name,stringifySetCookie({name,value,...options,path:'/',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}))}res.setHeader('Set-Cookie',[...out.values()])}}});
 const {data:{user},error}=await client.auth.getUser();if(error||!user?.email_confirmed_at){res.status(401).json({error:'session_expired'});return null}return {client,user};
}
export function bodyOf(req,max=10000){let p=req.body||{};if(typeof p==='string')p=JSON.parse(p);if(!p||typeof p!=='object'||Array.isArray(p)||JSON.stringify(p).length>max)throw new Error('invalid_request');return p}
