import {apply} from '../../public/learning-core.js';
import {lessonCheck} from '../../public/lesson-checks.js';
export function advance(s,id){const q=lessonCheck(id,s.units[id].slide);if(q)apply(s,'lesson-check',{topic:id,id:q.id,value:q.answer});apply(s,'next-slide',{topic:id})}
