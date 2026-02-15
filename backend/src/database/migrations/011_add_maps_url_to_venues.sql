-- Add maps_url column to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- Populate Google Maps links for each venue
UPDATE venues SET maps_url = 'https://maps.app.goo.gl/9wo9nYkyeMEP6LTV9' WHERE name = 'Harmony Park';
UPDATE venues SET maps_url = 'https://maps.app.goo.gl/1nHAVsW8B69gTJ8g8' WHERE name = 'Aishbagh Sports Complex';
UPDATE venues SET maps_url = 'https://maps.app.goo.gl/QEUMv7Nt9tooiV18A' WHERE name = 'Central Stadium';
UPDATE venues SET maps_url = 'https://maps.app.goo.gl/LgWgpvzc34yjECzq9' WHERE name = 'Jai Prakash Park';
UPDATE venues SET maps_url = 'https://maps.app.goo.gl/7fWQskqf4zZDceiw6' WHERE name = 'Railway Sports Ground';
UPDATE venues SET maps_url = 'https://maps.app.goo.gl/kwcHK5P58KcYx1TT9' WHERE name = 'Ram Manohar Lohia Park';
