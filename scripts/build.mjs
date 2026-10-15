import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
for (const file of ['public/index.html','public/lesson.html','public/auth.js','public/app.js','public/teacher.html']) await access(file);
for (const file of ['public/auth.js','public/app.js','public/account.js','api/auth.js','lib/auth-core.js']) execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
await import('../api/auth.js');
JSON.parse(await readFile('vercel.json','utf8'));
console.log('MOLİ static pages and serverless authentication checked.');
