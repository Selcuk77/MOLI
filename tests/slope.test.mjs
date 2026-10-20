import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import * as engine from '../public/slope-engine.js';
import {math,fraction} from '../public/math.js';
async function boot(saved=new Map()){
 const {document}=parseHTML(await readFile(new URL('../public/slope.html',import.meta.url),'utf8'));
 const ctx=vm.createContext({...engine,math,fraction,document,createValley:()=>({render(){},stop(){},resetCamera(){}}),window:{addEventListener(){}},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},location:{search:'',pathname:'/slope'},history:{replaceState(){}},URLSearchParams,Date,Number,String,Array,Object,Math,JSON,URL,Blob,setTimeout(){}});
 const src=(await readFile(new URL('../public/slope.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');vm.runInContext(src,ctx);
 return {document,run:s=>vm.runInContext(s,ctx),saved};
}
test('3D pilot requires the scene experiment and distinct measurements before ratio discovery',async()=>{
 const {run,document,saved}=await boot();
 run("answer('B yolu')");assert.equal(run('accepted'),false);assert.match(document.querySelector('#feedback').textContent,/yatay/);
 run("answer('A yolu')");document.querySelector('#next').onclick();
 run("answer('Yatay mesafeleri farklı')");document.querySelector('#next').onclick();
 run("answer('Dikliği azalıyor')");assert.equal(run('accepted'),false);
 document.querySelector('#run').value='12';document.querySelector('#run').oninput();run("answer('Dikliği azalıyor')");assert.equal(run('accepted'),true);document.querySelector('#next').onclick();
 assert.equal(run('scene.runA'),8);assert.equal(document.querySelector('#next').hidden,true);
 document.querySelector('#sample').onclick();document.querySelector('#sample').onclick();assert.equal(run('samples.length'),1);
 for(const t of ['50','80']){document.querySelector('#position').value=t;document.querySelector('#position').oninput();document.querySelector('#sample').onclick()}
 assert.equal(run('samples.length'),3);assert.equal(run('accepted'),true);
 const resumed=await boot(saved);assert.equal(resumed.run('stage'),3);assert.equal(resumed.run('samples.length'),3);assert.equal(resumed.document.querySelector('#next').hidden,false);
 document.querySelector('#next').onclick();run("answer('0,5')");assert.equal(run('accepted'),true);assert(!document.querySelector('#blackboard').innerHTML.includes('katex-error'));
 document.querySelector('#next').onclick();run("answer('B yolu')");document.querySelector('#next').onclick();assert.equal(run('stage'),6);assert.equal(document.querySelector('#answer-form').hidden,true);
 assert(run('transcript.length')>10);document.querySelector('#height').value='6';document.querySelector('#height').oninput();assert.match(document.querySelector('#blackboard').textContent,/6/);
 document.querySelector('#language').onclick();assert.match(document.querySelector('#prompt').textContent,/One ratio/);assert(!document.body.textContent.includes('undefined'));
 document.querySelector('#restart').onclick();assert.equal(run('stage'),0);assert.equal(run('samples.length'),0);
});
test('measurement values express vertical and horizontal change from the fixed path origin',()=>{
 const scene=engine.initialScene();scene.runA=8;assert.deepEqual(engine.measurements(scene,.5),{x:4,y:2});assert.equal(engine.classify('ratio','1/2'),true);assert.equal(engine.classify('ratio','2'),false);assert.equal(engine.classify('mission','Path B'),true);
});
