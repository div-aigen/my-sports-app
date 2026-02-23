const venueBackgrounds = {
  'Yolo Sports Arena': '/images/venues/yolo_gaming_arena.png',
  'Puff N Play Sports Arena': '/images/venues/aishbagh_sports_complex.jpg',
  'D & C Sports Turf': '/images/venues/central_stadium.png',
  'The Urban Turf': '/images/venues/jai_pakash_park.png',
  'Dugout Sports Arena': '/images/venues/ram_manohar.png',
};

export const getVenueBackground = (locationAddress) => {
  if (!locationAddress) return null;
  for (const [venueName, imagePath] of Object.entries(venueBackgrounds)) {
    if (locationAddress.includes(venueName)) return imagePath;
  }
  return null;
};
