CREATE TABLE cms_grants (email TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('reader','editor')), modules TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE cms_invitations (hash TEXT PRIMARY KEY, email TEXT NOT NULL, role TEXT NOT NULL, modules TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
CREATE INDEX cms_invitations_email ON cms_invitations(email);
