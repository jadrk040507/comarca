CREATE TABLE cms_updates (id TEXT PRIMARY KEY, permission TEXT NOT NULL, module TEXT NOT NULL, record_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX cms_updates_permission_created ON cms_updates(permission, created DESC);
