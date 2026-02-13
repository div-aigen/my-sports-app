CREATE TABLE IF NOT EXISTS fields (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  sport_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(venue_id, sport_type, field_name)
);

CREATE INDEX IF NOT EXISTS idx_fields_venue_id ON fields(venue_id);
CREATE INDEX IF NOT EXISTS idx_fields_sport_type ON fields(sport_type);
CREATE INDEX IF NOT EXISTS idx_fields_venue_sport ON fields(venue_id, sport_type);

-- Harmony Park: Cricket, Football, Pickleball, Basketball (8 fields)
INSERT INTO fields (venue_id, sport_type, field_name) VALUES
  (1, 'Cricket', 'Cricket Field 1'),
  (1, 'Cricket', 'Cricket Field 2'),
  (1, 'Football', 'Football Field 1'),
  (1, 'Football', 'Football Field 2'),
  (1, 'Pickleball', 'Pickleball Court 1'),
  (1, 'Pickleball', 'Pickleball Court 2'),
  (1, 'Basketball', 'Basketball Court 1'),
  (1, 'Basketball', 'Basketball Court 2');

-- Central Stadium: Cricket, Football, Tennis, Basketball (8 fields)
INSERT INTO fields (venue_id, sport_type, field_name) VALUES
  (2, 'Cricket', 'Cricket Field 1'),
  (2, 'Cricket', 'Cricket Field 2'),
  (2, 'Football', 'Football Field 1'),
  (2, 'Football', 'Football Field 2'),
  (2, 'Tennis', 'Tennis Court 1'),
  (2, 'Tennis', 'Tennis Court 2'),
  (2, 'Basketball', 'Basketball Court 1'),
  (2, 'Basketball', 'Basketball Court 2');

-- Jai Prakash Park: Football, Badminton, Basketball (6 fields)
INSERT INTO fields (venue_id, sport_type, field_name) VALUES
  (3, 'Football', 'Football Field 1'),
  (3, 'Football', 'Football Field 2'),
  (3, 'Badminton', 'Badminton Court 1'),
  (3, 'Badminton', 'Badminton Court 2'),
  (3, 'Basketball', 'Basketball Court 1'),
  (3, 'Basketball', 'Basketball Court 2');

-- Ram Manohar Lohia Park: Cricket, Football, Volleyball (6 fields)
INSERT INTO fields (venue_id, sport_type, field_name) VALUES
  (4, 'Cricket', 'Cricket Field 1'),
  (4, 'Cricket', 'Cricket Field 2'),
  (4, 'Football', 'Football Field 1'),
  (4, 'Football', 'Football Field 2'),
  (4, 'Volleyball', 'Volleyball Court 1'),
  (4, 'Volleyball', 'Volleyball Court 2');

-- Railway Sports Ground: Cricket, Football, Tennis (6 fields)
INSERT INTO fields (venue_id, sport_type, field_name) VALUES
  (5, 'Cricket', 'Cricket Field 1'),
  (5, 'Cricket', 'Cricket Field 2'),
  (5, 'Football', 'Football Field 1'),
  (5, 'Football', 'Football Field 2'),
  (5, 'Tennis', 'Tennis Court 1'),
  (5, 'Tennis', 'Tennis Court 2');

-- Aishbagh Sports Complex: Badminton, Basketball, Volleyball (6 fields)
INSERT INTO fields (venue_id, sport_type, field_name) VALUES
  (6, 'Badminton', 'Badminton Court 1'),
  (6, 'Badminton', 'Badminton Court 2'),
  (6, 'Basketball', 'Basketball Court 1'),
  (6, 'Basketball', 'Basketball Court 2'),
  (6, 'Volleyball', 'Volleyball Court 1'),
  (6, 'Volleyball', 'Volleyball Court 2');

COMMENT ON TABLE fields IS 'Stores individual fields/courts for each sport at each venue';
COMMENT ON COLUMN fields.field_name IS 'Human-readable name like "Football Field 1" or "Tennis Court A"';
