const Gig = require('../models/Gig');
const Profile = require('../models/Profile');

/**
 * AI-powered freelancer recommendation matching engine
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    const gigSkills = gig.skillsRequired.map((s) => s.toLowerCase().trim());
    if (gigSkills.length === 0) {
      return res.status(200).json({ success: true, matches: [] });
    }

    // Retrieve all active freelancers with their profile details
    const profiles = await Profile.find()
      .populate({
        path: 'user',
        match: { role: 'freelancer', status: 'active' },
      })
      .exec();

    // Filter out profiles whose user population failed (non-freelancer or suspended)
    const freelancerProfiles = profiles.filter((p) => p.user !== null);

    // Compute Jaccard Similarity index score for each freelancer
    const matches = freelancerProfiles
      .map((profile) => {
        const freelancerSkills = profile.skills.map((s) => s.name.toLowerCase().trim());
        
        // Find intersection of skills
        const intersection = freelancerSkills.filter((skill) => gigSkills.includes(skill));
        
        // Find union of skills
        const union = new Set([...gigSkills, ...freelancerSkills]);

        // Jaccard similarity coefficient: Intersection / Union
        const similarityScore = union.size > 0 ? (intersection.length / union.size) * 100 : 0;

        return {
          profile,
          matchingSkills: intersection,
          matchPercentage: Math.round(similarityScore),
          reputationScore: profile.get('reputationScore') || 5.0, // fallback
        };
      })
      // Filter out freelancers with 0% match to keep recommendations relevant
      .filter((match) => match.matchPercentage > 0)
      // Sort matches by percentage descending, sub-sorted by reputation score descending
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return b.reputationScore - a.reputationScore;
      })
      .slice(0, 5); // return top 5 recommendations

    res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error('Skill similarity recommendation engine error:', error);
    res.status(500).json({ success: false, message: 'Matching algorithm error' });
  }
};
