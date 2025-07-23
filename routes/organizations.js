const express = require('express');
const { dbHelpers } = require('../data/mockDB');
const router = express.Router();

// Get all organizations (for demo/admin purposes)
router.get('/', (req, res) => {
  const organizations = dbHelpers.getOrganizations();
  res.json({ organizations });
});

// Get current organization details
router.get('/current', (req, res) => {
  const organization = dbHelpers.getOrganizationById(req.orgId);

  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const users = dbHelpers.getUsersByOrgId(req.orgId);
  const meetings = dbHelpers.getMeetingsByOrgId(req.orgId);

  res.json({
    organization: {
      ...organization,
      userCount: users.length,
      meetingCount: meetings.length
    },
    users,
    stats: {
      totalMeetings: meetings.length,
      parsedMeetings: meetings.filter(m => m.parsedData).length,
      unparsedMeetings: meetings.filter(m => !m.parsedData).length,
      totalUsers: users.length
    }
  });
});

// Get organization users
router.get('/users', (req, res) => {
  const users = dbHelpers.getUsersByOrgId(req.orgId);
  res.json({ users });
});

module.exports = router;