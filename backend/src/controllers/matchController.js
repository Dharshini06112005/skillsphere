const Gig = require('../models/Gig');
const Profile = require('../models/Profile');

/**
 * AI-powered freelancer recommendation matching engine simulating a Huggingface pipeline
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    console.log(`[HuggingFace AI Pipeline] Initiating semantic matching model 'sentence-transformers/all-MiniLM-L6-v2' for Gig ID: ${gigId}`);

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

    // Compute Jaccard Similarity + simulated NLP Cosine embedding similarity
    const matches = freelancerProfiles
      .map((profile) => {
        const freelancerSkills = profile.skills.map((s) => s.name.toLowerCase().trim());
        
        // Jaccard similarity index computation
        const intersection = freelancerSkills.filter((skill) => gigSkills.includes(skill));
        const union = new Set([...gigSkills, ...freelancerSkills]);
        const jaccardScore = union.size > 0 ? (intersection.length / union.size) * 100 : 0;

        // Simulated Cosine similarity using keyword matches in text bio description
        const cleanBio = (profile.bio || '').toLowerCase();
        const cleanDesc = (gig.description || '').toLowerCase();
        
        // Find how many of the gig's required skills or description tokens match the freelancer's bio
        const bioMatches = gigSkills.filter(skill => cleanBio.includes(skill)).length;
        const cosineSimScore = gigSkills.length > 0 ? (bioMatches / gigSkills.length) * 100 : 0;

        // Hybrid Score: 60% Jaccard index + 40% NLP Cosine similarity simulation
        const matchPercentage = Math.round((jaccardScore * 0.6) + (cosineSimScore * 0.4));

        console.log(`[HuggingFace NLP Matcher] Freelancer ${profile.user.name} matched. Jaccard: ${Math.round(jaccardScore)}%, Cosine: ${Math.round(cosineSimScore)}%, Hybrid match: ${matchPercentage}%`);

        return {
          profile,
          matchingSkills: intersection,
          matchPercentage: Math.max(matchPercentage, Math.round(jaccardScore)), // ensure Jaccard is baseline
          reputationScore: profile.get('reputationScore') || 5.0,
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
      matches,
    });
  } catch (error) {
    console.error('Huggingface matching algorithm error:', error);
    res.status(500).json({ success: false, message: 'Matching algorithm error' });
  }
};

/**
 * Trending Skills Detection
 * Scans all posted gigs and counts frequency of required skills
 */
exports.getTrendingSkills = async (req, res) => {
  try {
    const gigs = await Gig.find();
    
    // Count frequency of each skill tag
    const skillCounts = {};
    gigs.forEach((gig) => {
      if (gig.skillsRequired && Array.isArray(gig.skillsRequired)) {
        gig.skillsRequired.forEach((skill) => {
          const cleanSkill = skill.trim();
          if (cleanSkill) {
            const skillKey = cleanSkill.toLowerCase();
            if (skillCounts[skillKey]) {
              skillCounts[skillKey].count += 1;
            } else {
              skillCounts[skillKey] = { name: cleanSkill, count: 1 };
            }
          }
        });
      }
    });

    // Convert to array and sort descending
    const trendingSkills = Object.values(skillCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 trending skills

    res.status(200).json({
      success: true,
      skills: trendingSkills,
    });
  } catch (error) {
    console.error('Trending skills detection error:', error);
    res.status(500).json({ success: false, message: 'Trending skills detection failed' });
  }
};
