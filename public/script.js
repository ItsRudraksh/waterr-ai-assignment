document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loadingSpinner = document.getElementById('loadingSpinner');
  const orgSelect = document.getElementById('orgSelect');
  const switchOrgBtn = document.getElementById('switchOrgBtn');
  const currentUser = document.getElementById('currentUser');
  const exportAllBtn = document.getElementById('exportAllBtn');
  const totalMeetings = document.getElementById('totalMeetings');
  const parsedMeetings = document.getElementById('parsedMeetings');
  const totalUsers = document.getElementById('totalUsers');
  const totalActions = document.getElementById('totalActions');
  const refreshBtn = document.getElementById('refreshBtn');
  const addMeetingBtn = document.getElementById('addMeetingBtn');
  const meetingsGrid = document.getElementById('meetingsGrid');
  const meetingModal = document.getElementById('meetingModal');
  const closeModal = document.getElementById('closeModal');
  const modalTitle = document.getElementById('modalTitle');
  const transcriptText = document.getElementById('transcriptText');
  const parseBtn = document.getElementById('parseBtn');
  const reparseBtn = document.getElementById('reparseBtn');
  const parsedContent = document.getElementById('parsedContent');
  const exportMeetingBtn = document.getElementById('exportMeetingBtn');
  const addMeetingModal = document.getElementById('addMeetingModal');
  const closeAddModal = document.getElementById('closeAddModal');
  const addMeetingForm = document.getElementById('addMeetingForm');
  const cancelAddBtn = document.getElementById('cancelAddBtn');
  const toastContainer = document.getElementById('toastContainer');

  // API Configuration
  const API_BASE_URL = '/api';
  let currentOrgId = '1';
  let currentMeetingId = null;

  // Utility Functions
  const showLoader = (show) => {
    loadingSpinner.style.display = show ? 'flex' : 'none';
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const getApiHeaders = () => ({
    'Content-Type': 'application/json',
    'x-org-id': currentOrgId,
  });

  // Fetch and Render Functions
  const fetchDashboardData = async () => {
    showLoader(true);
    try {
      const [orgRes, meetingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/organizations/current`, { headers: getApiHeaders() }),
        fetch(`${API_BASE_URL}/meetings`, { headers: getApiHeaders() }),
      ]);

      if (!orgRes.ok || !meetingsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const { organization, stats } = await orgRes.json();
      const { meetings } = await meetingsRes.json();

      updateDashboardStats(stats, organization);
      renderMeetings(meetings);
      updateCurrentUser(organization);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      showLoader(false);
    }
  };

  const updateDashboardStats = (stats, organization) => {
    totalMeetings.textContent = stats.totalMeetings;
    parsedMeetings.textContent = stats.parsedMeetings;
    totalUsers.textContent = stats.totalUsers;
    const totalActionItems = stats.totalActionItems || 0;
    totalActions.textContent = totalActionItems;
  };

  const renderMeetings = (meetings) => {
    meetingsGrid.innerHTML = '';
    if (meetings.length === 0) {
      meetingsGrid.innerHTML = '<p>No meetings found for this organization.</p>';
      return;
    }
    meetings.forEach((meeting) => {
      const meetingCard = document.createElement('div');
      meetingCard.className = 'meeting-card';
      meetingCard.dataset.id = meeting.id;
      meetingCard.innerHTML = `
        <div class="meeting-card-header">
          <h3>${meeting.title}</h3>
          <span class="meeting-date">${new Date(meeting.date).toLocaleDateString()}</span>
        </div>
        <div class="meeting-card-body">
          <p>Status: <span class="status ${meeting.isParsed ? 'parsed' : 'unparsed'}">${meeting.isParsed ? 'Parsed' : 'Unparsed'}</span></p>
          <p>Participants: ${meeting.participantCount}</p>
          <p>Action Items: ${meeting.actionItemCount}</p>
        </div>
        <div class="meeting-card-footer">
          <button class="btn btn-secondary btn-sm view-details-btn">View Details</button>
        </div>
      `;
      meetingsGrid.appendChild(meetingCard);
    });
  };

  const updateCurrentUser = (organization) => {
    currentUser.textContent = `Org: ${organization.name}`;
  };

  const fetchMeetingDetails = async (meetingId) => {
    showLoader(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, { headers: getApiHeaders() });
      if (!res.ok) {
        throw new Error('Failed to fetch meeting details');
      }
      const { meeting } = await res.json();
      currentMeetingId = meeting.id;
      openMeetingModal(meeting);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      showToast('Failed to load meeting details', 'error');
    } finally {
      showLoader(false);
    }
  };

  // Modal Handling
  const openMeetingModal = (meeting) => {
    modalTitle.textContent = meeting.title;
    transcriptText.textContent = meeting.transcript;
    if (meeting.parsedData) {
      renderParsedData(meeting.parsedData);
      parseBtn.style.display = 'none';
      reparseBtn.style.display = 'inline-block';
    } else {
      parsedContent.innerHTML = '<p class="no-data">No parsed data available. Click "Parse Transcript" to extract structured information.</p>';
      parseBtn.style.display = 'inline-block';
      reparseBtn.style.display = 'none';
    }
    meetingModal.style.display = 'block';
  };

  const closeMeetingModal = () => {
    meetingModal.style.display = 'none';
    currentMeetingId = null;
  };

  const renderParsedData = (data) => {
    parsedContent.innerHTML = `
      <h4>Summary</h4>
      <p>${data.summary}</p>
      <h4>Participants (${data.participants.length})</h4>
      <ul>
        ${data.participants.map(p => `<li>${p.name} (${p.role})</li>`).join('')}
      </ul>
      <h4>Action Items (${data.actionItems.length})</h4>
      <ul>
        ${data.actionItems.map(item => `<li><b>${item.assignee}:</b> ${item.task} ${item.dueDate ? `(Due: ${item.dueDate})` : ''}</li>`).join('')}
      </ul>
    `;
  };

  const openAddMeetingModal = () => {
    addMeetingForm.reset();
    addMeetingModal.style.display = 'block';
  };

  const closeAddMeetingModal = () => {
    addMeetingModal.style.display = 'none';
  };

  // Event Listeners
  switchOrgBtn.addEventListener('click', () => {
    currentOrgId = orgSelect.value;
    fetchDashboardData();
    showToast(`Switched to organization ${orgSelect.options[orgSelect.selectedIndex].text}`);
  });

  refreshBtn.addEventListener('click', fetchDashboardData);

  addMeetingBtn.addEventListener('click', openAddMeetingModal);

  meetingsGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-details-btn')) {
      const meetingCard = e.target.closest('.meeting-card');
      fetchMeetingDetails(meetingCard.dataset.id);
    }
  });

  closeModal.addEventListener('click', closeMeetingModal);
  closeAddModal.addEventListener('click', closeAddMeetingModal);
  cancelAddBtn.addEventListener('click', closeAddMeetingModal);

  window.addEventListener('click', (e) => {
    if (e.target === meetingModal) {
      closeMeetingModal();
    }
    if (e.target === addMeetingModal) {
      closeAddMeetingModal();
    }
  });

  parseBtn.addEventListener('click', async () => {
    if (!currentMeetingId) return;
    showLoader(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meetings/${currentMeetingId}/parse`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to parse transcript');
      }
      const { meeting } = await res.json();
      openMeetingModal(meeting);
      fetchDashboardData();
      showToast('Transcript parsed successfully');
    } catch (error) {
      console.error('Error parsing transcript:', error);
      showToast('Failed to parse transcript', 'error');
    } finally {
      showLoader(false);
    }
  });

  reparseBtn.addEventListener('click', async () => {
    if (!currentMeetingId) return;
    showLoader(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meetings/${currentMeetingId}/reparse`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to re-parse transcript');
      }
      const { meeting } = await res.json();
      openMeetingModal(meeting);
      fetchDashboardData();
      showToast('Transcript re-parsed successfully');
    } catch (error) {
      console.error('Error re-parsing transcript:', error);
      showToast('Failed to re-parse transcript', 'error');
    } finally {
      showLoader(false);
    }
  });

  addMeetingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('meetingTitle').value;
    const transcript = document.getElementById('meetingTranscript').value;
    const date = document.getElementById('meetingDate').value;

    showLoader(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ title, transcript, date }),
      });
      if (!res.ok) {
        throw new Error('Failed to add meeting');
      }
      closeAddMeetingModal();
      fetchDashboardData();
      showToast('Meeting added successfully');
    } catch (error) {
      console.error('Error adding meeting:', error);
      showToast('Failed to add meeting', 'error');
    } finally {
      showLoader(false);
    }
  });

  exportMeetingBtn.addEventListener('click', async () => {
    if (!currentMeetingId) return;
    window.open(`${API_BASE_URL}/meetings/${currentMeetingId}/export/excel?orgId=${currentOrgId}`, '_blank');
  });

  exportAllBtn.addEventListener('click', async () => {
    window.open(`${API_BASE_URL}/meetings/export/excel?orgId=${currentOrgId}`, '_blank');
  });

  // Initial Load
  fetchDashboardData();
});