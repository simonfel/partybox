import { makeFunctionReference } from 'convex/server';
import type { Command,View } from './engine';
export const api={
 create:makeFunctionReference<'mutation',{token:string},string>('rooms:createRoom'),
 join:makeFunctionReference<'mutation',{code:string;token:string;name:string},string>('rooms:join'),
 view:makeFunctionReference<'query',{code:string;token:string},View|null>('rooms:view'),
 act:makeFunctionReference<'mutation',{code:string;token:string;epoch:number;command:Exclude<Command,{type:'join'}>},null>('rooms:act'),
};
