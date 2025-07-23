const express = require('express');
const { dbHelpers } = require('../data/mockDB');
const { parseTranscript } = require('../services/parser');
const { exportToExcel, exportToCSV } = require('../services/export');
const router = express.Router();

// Get all meetings for current organization
router.get('/', (req, res) => {
  const meetings = dbHelpers.getMeetingsByOrgId(req.orgId);

  res.json({
    meetings: meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      createdAt: meeting.createdAt,
      isParsed: !!meeting.parsedData,
      participantCount: meeting.parsedData ? meeting.parsedData.participants.length : 0,
      actionItemCount: meeting.parsedData ? meeting.parsedData.actionItems.length : 0
    }))
  });
});

// Get specific meeting details
router.get('/:id', (req, res) => {
  const meeting = dbHelpers.getMeetingById(req.params.id);

  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  // Check if meeting belongs to current organization
  if (meeting.orgId !== req.orgId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ meeting });
});

// Parse meeting transcript using AIMLAPI
router.post('/:id/parse', async (req, res) => {
  try {
    const meeting = dbHelpers.getMeetingById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check if meeting belongs to current organization
    if (meeting.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`🔄 Parsing transcript for meeting ${meeting.id}: ${meeting.title}`);

    // Parse transcript using AIMLAPI
    const parsedData = await parseTranscript(meeting.transcript);

    // Update meeting with parsed data
    const updatedMeeting = dbHelpers.updateMeeting(req.params.id, {
      parsedData,
      lastParsed: new Date().toISOString()
    });

    console.log(`✅ Successfully parsed meeting ${meeting.id}`);
    console.log(`📊 Found ${parsedData.participants.length} participants, ${parsedData.actionItems.length} action items`);

    res.json({
      success: true,
      message: 'Transcript parsed successfully',
      meeting: updatedMeeting,
      parsedData
    });

  } catch (error) {
    console.error('❌ Error parsing transcript:', error);
    res.status(500).json({
      error: 'Failed to parse transcript',
      details: error.message
    });
  }
});

// Re-parse meeting transcript
router.post('/:id/reparse', async (req, res) => {
  try {
    const meeting = dbHelpers.getMeetingById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.orgId !== req.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`🔄 Re-parsing transcript for meeting ${meeting.id}: ${meeting.title}`);

    // Re-parse transcript
    const parsedData = await parseTranscript(meeting.transcript);

    // Update meeting with new parsed data
    const updatedMeeting = dbHelpers.updateMeeting(req.params.id, {
      parsedData,
      lastParsed: new Date().toISOString()
    });

    console.log(`✅ Successfully re-parsed meeting ${meeting.id}`);

    res.json({
      success: true,
      message: 'Transcript re-parsed successfully',
      meeting: updatedMeeting,
      parsedData
    });

  } catch (error) {
    console.error('❌ Error re-parsing transcript:', error);
    res.status(500).json({
      error: 'Failed to re-parse transcript',
      details: error.message
    });
  }
});

// Export parsed data to Excel
router.get('/:id/export/excel', async (req, res) => {
  try {
    const meeting = dbHelpers.getMeetingById(req.params.id);

    if (!meeting || meeting.orgId !== req.orgId) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (!meeting.parsedData) {
      return res.status(400).json({ error: 'Meeting not yet parsed' });
    }

    const excelBuffer = await exportToExcel([meeting]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${meeting.title.replace(/[^a-z0-9]/gi, '_')}_parsed.xlsx"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// Export all organization meetings to Excel
router.get('/export/excel', async (req, res) => {
  try {
    const meetings = dbHelpers.getMeetingsByOrgId(req.orgId);
    const parsedMeetings = meetings.filter(m => m.parsedData);

    if (parsedMeetings.length === 0) {
      return res.status(400).json({ error: 'No parsed meetings to export' });
    }

    const excelBuffer = await exportToExcel(parsedMeetings);
    const orgName = dbHelpers.getOrganizationById(req.orgId).name;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${orgName.replace(/[^a-z0-9]/gi, '_')}_meetings_export.xlsx"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// Add new meeting
router.post('/', (req, res) => {
  const { title, transcript, date } = req.body;

  if (!title || !transcript) {
    return res.status(400).json({ error: 'Title and transcript are required' });
  }

  const newMeeting = dbHelpers.addMeeting({
    orgId: req.orgId,
    title,
    transcript,
    date: date || new Date().toISOString(),
    parsedData: null
  });

  res.status(201).json({
    success: true,
    message: 'Meeting created successfully',
    meeting: newMeeting
  });
});

module.exports = router;