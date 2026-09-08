import { writeFile } from 'node:fs/promises';
import { skillLabLessons } from '../../supabase/functions/_shared/skill-lab/catalog.js';
const sql = skillLabLessons
  .map(
    (l) =>
      `insert into skill_lab_private.lessons(skill,module,version,content,published) values (${quote(l.skill)},${quote(l.module)},${l.version},${quote(JSON.stringify(l))}::jsonb,true) on conflict(skill,version) do nothing;`
  )
  .join('\n');
function quote(s) {
  return "'" + s.replaceAll("'", "''") + "'";
}
if (!process.argv[2]) throw new Error('Pass the path of a newly created content migration.');
await writeFile(
  process.argv[2],
  '-- Server-only lesson packs. The deployment flag stays off.\n' + sql + '\n'
);
