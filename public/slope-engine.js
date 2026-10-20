// Authored Socratic pilot. No model-generated grading or mastery claims.
export const stages=['observe','reason','experiment','measure','ratio','mission','complete'];
export const initialScene=()=>({height:4,runA:6,runB:12,position:.5});
export function measurements(scene,t=scene.position){return {x:+(scene.runA*t).toFixed(2),y:+(scene.height*t).toFixed(2)}}
export function classify(stage,value){const s=String(value).toLocaleLowerCase('tr-TR').replaceAll(',','.');
 if(stage==='observe')return /(^a$|a yolu|path a|soldaki|sol yol)/.test(s);
 if(stage==='reason')return /yatay|mesafe|uzun|horizontal|distance|run|shorter/.test(s);
 if(stage==='experiment')return /azal|daha az|decreas|less|gentler/.test(s);
 if(stage==='ratio')return /(^|[^\d])(0\.5|1\s*\/\s*2|½)([^\d]|$)|yarı|half/.test(s);
 if(stage==='mission')return /(^b$|b yolu|path b)/.test(s);
 return false;
}
export function ready(stage,evidence){return stage==='experiment'?evidence.stretched:stage==='measure'?evidence.samples>=3:true}
