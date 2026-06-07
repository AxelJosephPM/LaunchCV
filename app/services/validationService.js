function validate(profile) {
  const warnings = [];
  const p = profile.personal || {};

  if (!p.firstName || !p.lastName) warnings.push('Full name is missing.');
  if (!p.headline) warnings.push('Headline / job title is missing.');
  if (!p.email) warnings.push('Email address is not set.');
  if (!p.location) warnings.push('Location is missing.');
  if (!profile.summary) warnings.push('Professional summary is empty.');
  if (!profile.education || profile.education.length === 0) warnings.push('No education entries found.');
  if (!profile.experience || profile.experience.length === 0) warnings.push('No experience entries found.');
  if (!profile.skills || profile.skills.length === 0) warnings.push('No skills listed.');

  return warnings;
}

module.exports = { validate };
