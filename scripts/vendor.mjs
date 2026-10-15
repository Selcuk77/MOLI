import {cp,mkdir} from 'node:fs/promises';
await mkdir('public/vendor',{recursive:true});
for(const name of ['katex.mjs','katex.min.css','fonts'])await cp('node_modules/katex/dist/'+name,'public/vendor/'+name,{recursive:true});
