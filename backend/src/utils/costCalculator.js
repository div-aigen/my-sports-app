/**
 * Calculate cost per person for a session
 * @param {number} totalCost - Total cost of the session
 * @param {number} participantCount - Number of participants
 * @returns {number} Cost per person
 */
function calculateCostPerPerson(totalCost, participantCount) {
  if (participantCount === 0) return 0;
  return parseFloat((totalCost / participantCount).toFixed(2));
}

module.exports = {
  calculateCostPerPerson,
};
