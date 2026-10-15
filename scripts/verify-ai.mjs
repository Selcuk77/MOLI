// Operator-only build check: fixed mathematics prompt, no student or account data.
if(process.env.AI_VERIFY_ON_BUILD==='true'&&process.env.AI_MODEL){
 const {generateText,Output,jsonSchema}=await import('ai');
 try{
  const {output}=await generateText({model:process.env.AI_MODEL,output:Output.object({schema:jsonSchema({type:'object',additionalProperties:false,properties:{speech:{type:'string'},math:{type:'string'}},required:['speech','math']})}),instructions:'You are a Turkish Grade 8 mathematics teacher. Answer the exact question briefly. Return a natural-language spoken explanation and one short TeX formula for a classroom board. No personal data is involved.',prompt:'Bir bütünün iki eş parçadan biri matematikte nasıl gösterilir? Açıklamada kesri sözcüklerle söyle.',maxRetries:0,maxOutputTokens:1500,abortSignal:AbortSignal.timeout(30000)});
  if(!output?.speech||!output?.math)throw new Error('missing_output');
  console.log('MOLI_AI_CHECK_OK '+JSON.stringify({model:process.env.AI_MODEL,speech:output.speech,math:output.math}));
 }catch(e){const status=e?.statusCode||e?.status||e?.cause?.statusCode;console.log('MOLI_AI_CHECK_ACTION_REQUIRED '+JSON.stringify({status:status||null,code:status===402?'credits_required':status===403?'activation_required':status===401?'authentication_required':'provider_unavailable'}));}
}
