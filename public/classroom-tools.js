// Fixed classroom identities; no arbitrary names or instructions reach the tutor.
export const companions=[
 {id:'gauss',name:'Gauss',color:'#cde99f',ink:'#34532c',tr:'Örüntü avcısı',en:'Pattern finder',jokeTr:'Bir ipucu buldum! Merak etme, cebimdeki tek şey tebeşir.',jokeEn:'Found a clue! Don’t worry, the only thing up my sleeve is chalk.'},
 {id:'euler',name:'Euler',color:'#ded2fa',ink:'#59417e',tr:'Bağlantı ustası',en:'Connection maker',jokeTr:'Bu soruyla aramızdaki tek bilinmeyen, nereden başlayacağımız!',jokeEn:'The only unknown between us and this problem is where to start!'},
 {id:'einstein',name:'Einstein',color:'#ffdbab',ink:'#79502d',tr:'Meraklı kâşif',en:'Curious explorer',jokeTr:'Saçlarım biraz karışık olabilir, çözümümüz adım adım düzenli olsun!',jokeEn:'My hair may be messy, but let’s keep our reasoning tidy!'}
];
export const companionFor=id=>companions.find(c=>c.id===id)||companions[0];

export function mathFromSpeech(text,lang='tr'){
 const original=String(text).trim();let s=original.toLocaleLowerCase(lang==='tr'?'tr-TR':'en-US').replace(/[?!.]$/,'').replace(/^(cevabım|cevap|my answer is|the answer is)\s*/,'');
 const numbers=lang==='tr'?{sıfır:0,bir:1,iki:2,üç:3,dört:4,beş:5,altı:6,yedi:7,sekiz:8,dokuz:9,on:10,yirmi:20,otuz:30,kırk:40,elli:50,altmış:60,yetmiş:70,seksen:80,doksan:90}:{zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
 s=s.replace(/bölü|divided by|over/g,' / ').replace(/çarpı|times|multiplied by/g,' * ').replace(/artı|plus/g,' + ').replace(/eksi|minus/g,' - ').replace(/karekök|square root of/g,' sqrt ').replace(/virgül|point/g,' . ');
 const parts=s.split(/\s+/).filter(Boolean),out=[];let subtotal=0,total=0,have=false;
 const flush=()=>{if(have)out.push(String(total+subtotal));subtotal=0;total=0;have=false};
 for(const t of parts){if(Object.hasOwn(numbers,t)){subtotal+=numbers[t];have=true}else if(t==='yüz'||t==='hundred'){subtotal=(subtotal||1)*100;have=true}else if(t==='bin'||t==='thousand'){total+=(subtotal||1)*1000;subtotal=0;have=true}else if(t==='and'&&lang==='en')continue;else{flush();out.push(t)}}flush();
 let result=out.join(' ').replace(/sqrt\s+([+-]?\s*\d+(?:\s*\.\s*\d+)?)/g,'sqrt($1)').replace(/\s*\.\s*/g,'.');
 try{calculate(result);return result}catch{return original}
}

// Small arithmetic parser, shared by the calculator and mathematical answer input.
// Deliberately no eval, Function, property access or variable lookup.
export function calculate(source){
 const s=String(source).trim().replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/').replaceAll(',','.').replaceAll('√','sqrt').replaceAll('²','^2').replaceAll('π','pi');
 if(!s||s.length>200)throw new Error('invalid_expression');
 const tokens=s.match(/sqrt|pi|(?:\d+(?:\.\d*)?|\.\d+)|[()+*/^\-]|\S/g)||[];
 let at=0,depth=0;const take=()=>tokens[at++];
 function atom(){if(++depth>24)throw new Error('invalid_expression');let n;const t=take();if(t==='('){n=sum();if(take()!==')')throw new Error('invalid_expression')}else if(t==='sqrt'){if(take()!=='(')throw new Error('invalid_expression');n=Math.sqrt(sum());if(take()!==')')throw new Error('invalid_expression')}else if(t==='pi')n=Math.PI;else if(/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t||''))n=Number(t);else throw new Error('invalid_expression');depth--;return n}
 function power(){const n=atom();return tokens[at]==='^'?(take(),n**unary()):n}
 function unary(){if(tokens[at]==='+'){take();return unary()}if(tokens[at]==='-'){take();return -unary()}return power()}
 function product(){let n=unary();while(['*','/'].includes(tokens[at])){const op=take(),b=unary();if(op==='/'&&b===0)throw new Error('division_by_zero');n=op==='*'?n*b:n/b}return n}
 function sum(){let n=product();while(['+','-'].includes(tokens[at])){const op=take(),b=product();n=op==='+'?n+b:n-b}return n}
 const n=sum();if(at!==tokens.length||!Number.isFinite(n))throw new Error('invalid_expression');return n;
}

// A cancellable think-time gate. Silence never submits a reply or triggers an AI call.
export function thinkingTurn({seconds=10,onTick,onReady,setTimer=setTimeout,clearTimer=clearTimeout,now=Date.now}={}){
 let timer=null,active=true;const deadline=now()+seconds*1000;
 const tick=()=>{if(!active)return;const left=Math.max(0,Math.ceil((deadline-now())/1000));onTick?.(left);if(left===0){active=false;onReady?.()}else timer=setTimer(tick,250)};
 tick();return ()=>{active=false;clearTimer(timer)};
}

export function rewardSummary(s){const r=s.rewards||{points:0,correct:0,recoveries:0};const mastered=Object.values(s.units).filter(u=>u.passed).length;
 return {...r,mastered,level:1+Math.floor(r.points/100),next:100-r.points%100,badges:[
 {id:'explorer',icon:'✦',tr:'İlk keşif',en:'First discovery',earned:s.diagnostic.done,progress:s.diagnostic.answers.length,target:26},
 {id:'first',icon:'★',tr:'İlk doğru adım',en:'First correct step',earned:r.correct>=1,progress:r.correct,target:1},
 {id:'five',icon:'◆',tr:'Fikir avcısı',en:'Idea finder',earned:r.correct>=5,progress:r.correct,target:5},
 {id:'retry',icon:'↗',tr:'Yeniden denedim',en:'Tried again',earned:r.recoveries>=1,progress:r.recoveries,target:1},
 {id:'master',icon:'♜',tr:'Konu ustası',en:'Topic master',earned:mastered>=1,progress:mastered,target:1},
 {id:'ten',icon:'✧',tr:'On sağlam adım',en:'Ten strong steps',earned:r.correct>=10,progress:r.correct,target:10}
 ]};
}
