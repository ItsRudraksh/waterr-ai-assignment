const express = require('express');
const { dbHelpers } = require('../data/mockDB');
const router = express.Router();

// Simple auth stub - in real app this would validate credentials
router.post('/login', (req, res) => {
  const { email, orgId } = req.body;

  if (!email || !orgId) {
    return res.status(400).json({ error: 'Email and orgId required' });
  }

  // Find user by email and orgId
  const users = dbHelpers.getUsersByOrgId(orgId);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const organization = dbHelpers.getOrganizationById(orgId);

  // In real app, generate actual JWT token
  const mockToken = `mock-jwt-token-${user.id}`;

  res.json({
    success: true,
    token: mockToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    organization: {
      id: organization.id,
      name: organization.name
    }
  });
});

// Get current user info
router.get('/me', (req, res) => {
  const user = dbHelpers.getUserById(req.userId);
  const organization = dbHelpers.getOrganizationById(req.orgId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    organization: {
      id: organization.id,
      name: organization.name
    }
  });
});

module.exports = router;