// Mock Database using JSON objects
const mockDB = {
  organizations: [
    {
      id: '1',
      name: 'TechCorp Solutions',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'InnovateNow Inc',
      createdAt: '2024-02-01T00:00:00Z'
    }
  ],

  users: [
    {
      id: '1',
      orgId: '1',
      name: 'Aisha Kumar',
      email: 'aisha@techcorp.com',
      role: 'Engineering Manager'
    },
    {
      id: '2',
      orgId: '1',
      name: 'Deepak Singh',
      email: 'deepak@techcorp.com',
      role: 'Backend Engineer'
    },
    {
      id: '3',
      orgId: '2',
      name: 'Samir Patel',
      email: 'samir@innovatenow.com',
      role: 'Scrum Master'
    },
    {
      id: '4',
      orgId: '2',
      name: 'Neha Sharma',
      email: 'neha@innovatenow.com',
      role: 'Developer'
    }
  ],

  meetings: [
    {
      id: '1',
      orgId: '1',
      title: 'Daily Standup - Sprint 24',
      date: '2024-07-20T09:00:00Z',
      transcript: `Aisha (Engineering Manager): Good morning, team. Quick stand‑up today.
Deepak (Backend Engineer): Yesterday I finished integrating the payment gateway; today I'll write unit tests. No blockers.
Maria (Frontend Engineer): API latency issue resolved. Action: I'll refactor the checkout UI by EOD Friday.
Rahul (QA Analyst): Regression suite is 60% done; I'll complete it today.`,
      parsedData: null,
      createdAt: '2024-07-20T09:00:00Z'
    },
    {
      id: '2',
      orgId: '1',
      title: 'Onboarding Flow Finalization',
      date: '2024-07-21T11:00:00Z',
      transcript: `Priya (Product Manager): Our goal is to finalize the onboarding flow this week.
Kunal (UX Designer): I'll revise the welcome screen illustrations by Thursday.
Isha (Frontend Engineer): I'll implement Kunal's design updates and push to staging by Friday.
Nikhil (Backend Engineer): Need to update the user-creation endpoint for the new data fields.
Tara (QA): I'll prepare test cases for the onboarding flow and start testing Monday.`,
      parsedData: null,
      createdAt: '2024-07-21T11:00:00Z'
    },
    {
      id: '3',
      orgId: '2',
      title: 'Sprint Retrospective - Q2',
      date: '2024-07-22T14:00:00Z',
      transcript: `Samir (Scrum Master): Let's begin the sprint retro. What went well?
Neha (Developer): Pair programming sessions were effective.
Vivek (Developer): We need better code review turnaround. Action: I'll draft a checklist for reviewers by next Tuesday.
Alka (QA): Automation coverage improved but we still missed edge cases. I will add 10 new tests by Thursday.
Ravi (DevOps): Deployment times increased; I'll optimize Docker images before next sprint.`,
      parsedData: null,
      createdAt: '2024-07-22T14:00:00Z'
    },
    {
      id: '4',
      orgId: '2',
      title: 'Client Pain Point Discovery',
      date: '2024-07-23T10:00:00Z',
      transcript: `Jordan (Account Executive): Thanks for meeting, team. Goal: identify client's pain points.
Akira (Prospect CTO): We're struggling with onboarding speed.
Jordan: Action Item: I'll send a tailored proposal by Wednesday.
Maya (Solutions Architect): I'll prepare an ROI estimate and architecture diagram for review by Friday.
Akira: We'll share our current user metrics tomorrow.`,
      parsedData: null,
      createdAt: '2024-07-23T10:00:00Z'
    },
    {
      id: '5',
      orgId: '1',
      title: 'Q3 Strategic Planning',
      date: '2024-07-24T16:00:00Z',
      transcript: `Rohan (CEO): Q3 focus is customer retention and AI expansion.
Vidya (VP Engineering): We'll double inference capacity. Action: investigate GPU cluster options and present plan by Aug‑10.
Leena (Marketing Lead): Launch retention campaign. I'll draft messaging by Aug‑05.
Girish (Customer Success): Need playbooks for upselling existing clients. I'll compile best practices by Aug‑12.
Anil (Finance): Allocate budget for AI infra; I'll release figures by Aug‑02.`,
      parsedData: null,
      createdAt: '2024-07-24T16:00:00Z'
    }
  ]
};

// Helper functions to simulate database operations
const dbHelpers = {
  // Organizations
  getOrganizations: () => mockDB.organizations,
  getOrganizationById: (id) => mockDB.organizations.find(org => org.id === id),

  // Users  
  getUsersByOrgId: (orgId) => mockDB.users.filter(user => user.orgId === orgId),
  getUserById: (id) => mockDB.users.find(user => user.id === id),

  // Meetings
  getMeetingsByOrgId: (orgId) => mockDB.meetings.filter(meeting => meeting.orgId === orgId),
  getMeetingById: (id) => mockDB.meetings.find(meeting => meeting.id === id),
  updateMeeting: (id, updates) => {
    const meeting = mockDB.meetings.find(m => m.id === id);
    if (meeting) {
      Object.assign(meeting, updates);
      return meeting;
    }
    return null;
  },

  // Add new meeting
  addMeeting: (meetingData) => {
    const newId = String(mockDB.meetings.length + 1);
    const newMeeting = {
      id: newId,
      ...meetingData,
      createdAt: new Date().toISOString()
    };
    mockDB.meetings.push(newMeeting);
    return newMeeting;
  }
};

module.exports = { mockDB, dbHelpers };