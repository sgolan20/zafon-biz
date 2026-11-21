-- Business photos stored in R2 (bucket zafon-biz-media). Columns hold the
-- object key, e.g. "businesses/<id>/cover-<rand>.webp"; NULL = no photo.
ALTER TABLE businesses ADD COLUMN cover_key TEXT;
ALTER TABLE businesses ADD COLUMN logo_key TEXT;
