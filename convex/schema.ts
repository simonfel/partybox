import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export default defineSchema({ rooms: defineTable({code:v.string(),hostToken:v.string(),state:v.string(),expiresAt:v.number()}).index('by_code',['code']).index('by_host',['hostToken']) });
