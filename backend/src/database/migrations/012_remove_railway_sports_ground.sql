-- Remove Railway Sports Ground venue and its fields
DELETE FROM fields WHERE venue_id = (SELECT id FROM venues WHERE name = 'Railway Sports Ground');
DELETE FROM venues WHERE name = 'Railway Sports Ground';
