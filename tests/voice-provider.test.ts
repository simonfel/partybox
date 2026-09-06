import {afterEach,expect,it,vi} from 'vitest';
import {elevenVoice} from '../server/voice-provider';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('does not call the provider without a configured key',async()=>{
 vi.stubEnv('ELEVENLABS_API_KEY','');const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect(await elevenVoice('hello')).toBeNull();expect(fetcher).not.toHaveBeenCalled();
});
it('uses authenticated MP3 generation and deduplicates repeated text',async()=>{
 vi.stubEnv('ELEVENLABS_API_KEY','test-only-key');
 const fetcher=vi.fn().mockResolvedValue(new Response(new Uint8Array(64),{headers:{'Content-Type':'audio/mpeg'}}));vi.stubGlobal('fetch',fetcher);
 const [a,b]=await Promise.all([elevenVoice('Unique test sentence'),elevenVoice('Unique test sentence')]);
 expect(a?.provider).toBe('elevenlabs');expect(b?.type).toBe('audio/mpeg');expect(fetcher).toHaveBeenCalledTimes(1);
 await elevenVoice('Unique test sentence');expect(fetcher).toHaveBeenCalledTimes(1);
 expect(fetcher.mock.calls[0][1].headers['xi-api-key']).toBe('test-only-key');
 expect(JSON.parse(fetcher.mock.calls[0][1].body).model_id).toBe('eleven_v3');
});
it('does not cache failed generations',async()=>{
 vi.stubEnv('ELEVENLABS_API_KEY','test-failure-key');const fetcher=vi.fn().mockResolvedValue(new Response('No credits',{status:429}));vi.stubGlobal('fetch',fetcher);
 await expect(elevenVoice('Retry test')).rejects.toThrow('429');await expect(elevenVoice('Retry test')).rejects.toThrow('429');expect(fetcher).toHaveBeenCalledTimes(2);
});
