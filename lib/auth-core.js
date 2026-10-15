export const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function checkPassword(value){return typeof value==='string'&&value.length>=10&&value.length<=128&&/\p{L}/u.test(value)&&/\d/.test(value)}
export function validateSignup(body){
  if(!['student','teacher'].includes(body.role))return 'invalid_role';
  if(typeof body.email!=='string'||body.email.length>254||!EMAIL.test(body.email))return 'invalid_email';
  if(typeof body.name!=='string'||body.name.trim().length<2||body.name.trim().length>80)return 'invalid_name';
  if(!checkPassword(body.password))return 'weak_password';
  if(body.accepted!==true)return 'accept_required';
  if(body.role==='student'&&body.guardian!==true)return 'guardian_required';
  if(body.website)return 'invalid_request';
  return null;
}
export function publicUser(user,profile){return {id:user.id,email:user.email,name:profile?.display_name||'MOLİ',role:profile?.role==='teacher'?'teacher':'student',teacherStatus:profile?.teacher_status||null,language:profile?.language==='en'?'en':'tr',profileReady:!!profile,emailVerified:!!user.email_confirmed_at}}
export function originAllowed(origin,env=process.env){
  const configured=env.SITE_URL||'https://moli-orcin.vercel.app';
  try{return [new URL(configured).origin,env.VERCEL_URL?'https://'+env.VERCEL_URL:null,...(env.NODE_ENV!=='production'?['http://localhost:3000','http://localhost:8000']:[])].includes(new URL(origin).origin)}catch{return false}
}
export function authError(error){
  const code=error?.code;
  if(error?.status===429||/rate_limit|over_email_send_rate_limit|over_request_rate_limit/.test(code||''))return 'rate_limited';
  if(code==='email_not_confirmed')return 'email_not_confirmed';
  if(code==='invalid_credentials')return 'invalid_credentials';
  if(code==='weak_password')return 'weak_password';
  if(code==='same_password')return 'same_password';
  if(code==='otp_expired'||code==='flow_state_expired'||code==='flow_state_not_found'||code==='bad_code_verifier')return 'expired_link';
  return 'request_failed';
}
