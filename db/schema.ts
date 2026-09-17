import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const simulationRuns=sqliteTable('simulation_runs',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),state:text('state').notNull(),version:integer('version').notNull().default(0),updated:integer('updated').notNull()
},table=>[index('idx_simulation_runs_owner_updated').on(table.owner,table.updated)]);
export const authRateLimits=sqliteTable('auth_rate_limits',{
 key:text('key').primaryKey(),hits:integer('hits').notNull(),expires:integer('expires').notNull()
},table=>[index('idx_auth_rate_expires').on(table.expires)]);
export const adminSessions=sqliteTable('admin_sessions',{
 tokenHash:text('token_hash').primaryKey(),expires:integer('expires').notNull(),credentialTag:text('credential_tag').notNull()
},table=>[index('idx_admin_session_expires').on(table.expires)]);
