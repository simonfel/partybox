import {readdirSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo=process.argv[2];
if(!repo||!/^[-\w.]+\/[-\w.]+$/.test(repo))throw new Error('Usage: npm run issues:publish -- owner/repo');
const directory=fileURLToPath(new URL('../docs/issues/',import.meta.url));
const existing=new Set(JSON.parse(execFileSync('gh',['issue','list','--repo',repo,'--state','all','--limit','1000','--json','title'],{encoding:'utf8'})).map(i=>i.title));
for(const file of readdirSync(directory).filter(f=>f.endsWith('.md')).sort()){
 const path=`${directory}/${file}`;const title=readFileSync(path,'utf8').split('\n')[0].replace(/^# /,'');
 if(existing.has(title)){console.log(`Exists: ${title}`);continue;}
 console.log(execFileSync('gh',['issue','create','--repo',repo,'--title',title,'--body-file',path],{encoding:'utf8'}).trim());
 existing.add(title);
}
