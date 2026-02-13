CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) DEFAULT 'Lucknow',
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

-- Populate with existing venues from mobile app
INSERT INTO venues (name, address, description) VALUES
  ('Harmony Park', 'Harmony Park, Lucknow', 'Multi-sport park with Cricket, Football, Pickleball, Basketball'),
  ('Central Stadium', 'Central Stadium, Lucknow', 'Major stadium with Cricket, Football, Tennis, Basketball'),
  ('Jai Prakash Park', 'Jai Prakash Park, Lucknow', 'Community park with Football, Badminton, Basketball'),
  ('Ram Manohar Lohia Park', 'Ram Manohar Lohia Park, Lucknow', 'Sports park with Cricket, Football, Volleyball'),
  ('Railway Sports Ground', 'Railway Sports Ground, Lucknow', 'Railway ground with Cricket, Football, Tennis'),
  ('Aishbagh Sports Complex', 'Aishbagh Sports Complex, Lucknow', 'Indoor/outdoor complex with Badminton, Basketball, Volleyball');

COMMENT ON TABLE venues IS 'Stores venue/location information for sports facilities';
