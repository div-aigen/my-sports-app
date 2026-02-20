const venueBackgrounds = {
  'Harmony Park': '/images/venues/yolo_gaming_arena.png',
  'Aishbagh Sports Complex': '/images/venues/aishbagh_sports_complex.jpg',
  'Central Stadium': '/images/venues/central_stadium.png',
  'Jai Prakash Park': '/images/venues/jai_pakash_park.png',
  'Ram Manohar Lohia Park': '/images/venues/ram_manohar.png',
};

export const getVenueBackground = (locationAddress) => {
  if (!locationAddress) return null;
  for (const [venueName, imagePath] of Object.entries(venueBackgrounds)) {
    if (locationAddress.includes(venueName)) return imagePath;
  }
  return null;
};
