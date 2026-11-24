-- Requests sent before moodboard reviews stored a moodboard copy without its id.
UPDATE "ProjectRequest" AS r
SET "briefSnapshot" = jsonb_set(r."briefSnapshot", '{moodboard,id}', to_jsonb(b."moodboardId"))
FROM "Brief" AS b
WHERE r."briefId" = b."id"
  AND b."moodboardId" IS NOT NULL
  AND jsonb_typeof(r."briefSnapshot"->'moodboard') = 'object'
  AND NOT (r."briefSnapshot"->'moodboard' ? 'id');