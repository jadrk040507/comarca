ALTER TABLE cms_updates ADD COLUMN metadata TEXT NOT NULL DEFAULT '{}';
CREATE INDEX cms_updates_module_created ON cms_updates(module, created DESC);
