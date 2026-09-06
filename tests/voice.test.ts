import {expect,it,vi} from 'vitest';
import {create,project} from '../src/engine';
const {query}=vi.hoisted(()=>({query:vi.fn()}));
vi.mock('convex/browser',()=>({ConvexHttpClient:class{query=query}}));
import voice from '../api/voice';
async function request(body:unknown){
 const headers:Record<string,unknown>={};let output:unknown;
 const res={statusCode:200,setHeader:(name:string,value:unknown)=>{headers[name]=value;},end:(value:unknown)=>{output=value;}};
 await voice({method:'POST',body} as Parameters<typeof voice>[0],res as unknown as Parameters<typeof voice>[1]);
 return {status:res.statusCode,headers,output};
}
it('generates a real WAV for the authenticated current host',async()=>{
 vi.stubEnv('VITE_CONVEX_URL','https://example.convex.cloud');
 query.mockResolvedValue(project(create('ABCDE','host'),'host'));
 const result=await request({code:'ABCDE',token:'host',epoch:0});
 expect(result.status).toBe(200);expect(result.headers['Content-Type']).toBe('audio/wav');
 expect(Buffer.isBuffer(result.output)).toBe(true);
 expect((result.output as Buffer).toString('ascii',0,4)).toBe('RIFF');
 expect((result.output as Buffer).length).toBeGreaterThan(10000);
});
it('does not synthesize for a player or stale host phase',async()=>{
 query.mockResolvedValue({isHost:false});expect((await request({code:'ABCDE',token:'guest',epoch:0})).status).toBe(403);
 query.mockResolvedValue({isHost:true,epoch:3,remaining:null});expect((await request({code:'ABCDE',token:'host',epoch:2})).status).toBe(409);
});
