const XLSX = require('xlsx');
const { dbHelpers } = require('../data/mockDB');

/**
 * Export parsed meeting data to Excel format
 * @param {Array} meetings - Array of meeting objects with parsed data
 * @returns {Buffer} Excel file buffer
 */
async function exportToExcel(meetings) {
  try {
    console.log(`📊 Exporting ${meetings.length} meetings to Excel...`);

    // Create new workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Meeting Summary
    const summaryData = meetings.map(meeting => {
      const org = dbHelpers.getOrganizationById(meeting.orgId);
      return {
        'Meeting ID': meeting.id,
        'Organization': org ? org.name : 'Unknown',
        'Meeting Title': meeting.title,
        'Date': new Date(meeting.date).toLocaleDateString(),
        'Participants Count': meeting.parsedData ? meeting.parsedData.participants.length : 0,
        'Action Items Count': meeting.parsedData ? meeting.parsedData.actionItems.length : 0,
        'Summary': meeting.parsedData ? meeting.parsedData.summary : 'Not parsed',
        'Last Parsed': meeting.lastParsed ? new Date(meeting.lastParsed).toLocaleString() : 'Never'
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Meeting Summary');

    // Sheet 2: All Participants
    const participantsData = [];
    meetings.forEach(meeting => {
      if (meeting.parsedData && meeting.parsedData.participants) {
        const org = dbHelpers.getOrganizationById(meeting.orgId);
        meeting.parsedData.participants.forEach(participant => {
          participantsData.push({
            'Meeting ID': meeting.id,
            'Organization': org ? org.name : 'Unknown',
            'Meeting Title': meeting.title,
            'Meeting Date': new Date(meeting.date).toLocaleDateString(),
            'Participant Name': participant.name,
            'Role': participant.role,
            'Mentions': participant.mentions || 1
          });
        });
      }
    });

    if (participantsData.length > 0) {
      const participantsSheet = XLSX.utils.json_to_sheet(participantsData);
      XLSX.utils.book_append_sheet(workbook, participantsSheet, 'Participants');
    }

    // Sheet 3: All Action Items
    const actionItemsData = [];
    meetings.forEach(meeting => {
      if (meeting.parsedData && meeting.parsedData.actionItems) {
        const org = dbHelpers.getOrganizationById(meeting.orgId);
        meeting.parsedData.actionItems.forEach(item => {
          actionItemsData.push({
            'Meeting ID': meeting.id,
            'Organization': org ? org.name : 'Unknown',
            'Meeting Title': meeting.title,
            'Meeting Date': new Date(meeting.date).toLocaleDateString(),
            'Assignee': item.assignee,
            'Task Description': item.task,
            'Due Date': item.dueDate || 'Not specified',
            'Priority': item.priority || 'medium',
            'Status': item.status || 'pending'
          });
        });
      }
    });

    if (actionItemsData.length > 0) {
      const actionItemsSheet = XLSX.utils.json_to_sheet(actionItemsData);
      XLSX.utils.book_append_sheet(workbook, actionItemsSheet, 'Action Items');
    }

    // Sheet 4: Raw Transcripts
    const transcriptsData = meetings.map(meeting => {
      const org = dbHelpers.getOrganizationById(meeting.orgId);
      return {
        'Meeting ID': meeting.id,
        'Organization': org ? org.name : 'Unknown',
        'Meeting Title': meeting.title,
        'Date': new Date(meeting.date).toLocaleDateString(),
        'Raw Transcript': meeting.transcript
      };
    });

    const transcriptsSheet = XLSX.utils.json_to_sheet(transcriptsData);
    XLSX.utils.book_append_sheet(workbook, transcriptsSheet, 'Raw Transcripts');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });

    console.log('✅ Excel export completed successfully');
    return excelBuffer;

  } catch (error) {
    console.error('❌ Error creating Excel export:', error);
    throw error;
  }
}

/**
 * Export parsed meeting data to CSV format
 * @param {Array} meetings - Array of meeting objects with parsed data
 * @returns {String} CSV content as string
 */
async function exportToCSV(meetings) {
  try {
    console.log(`📊 Exporting ${meetings.length} meetings to CSV...`);

    // Flatten all data into a single CSV structure
    const csvData = [];

    meetings.forEach(meeting => {
      const org = dbHelpers.getOrganizationById(meeting.orgId);
      const orgName = org ? org.name : 'Unknown';

      if (meeting.parsedData) {
        // Add participants
        meeting.parsedData.participants.forEach(participant => {
          csvData.push({
            'Type': 'Participant',
            'Meeting ID': meeting.id,
            'Organization': orgName,
            'Meeting Title': meeting.title,
            'Meeting Date': new Date(meeting.date).toLocaleDateString(),
            'Name': participant.name,
            'Role/Task': participant.role,
            'Due Date': '',
            'Priority': '',
            'Status': '',
            'Mentions': participant.mentions || 1
          });
        });

        // Add action items
        meeting.parsedData.actionItems.forEach(item => {
          csvData.push({
            'Type': 'Action Item',
            'Meeting ID': meeting.id,
            'Organization': orgName,
            'Meeting Title': meeting.title,
            'Meeting Date': new Date(meeting.date).toLocaleDateString(),
            'Name': item.assignee,
            'Role/Task': item.task,
            'Due Date': item.dueDate || '',
            'Priority': item.priority || 'medium',
            'Status': item.status || 'pending',
            'Mentions': ''
          });
        });
      }
    });

    // Convert to CSV
    if (csvData.length === 0) {
      throw new Error('No data to export');
    }

    // Create CSV header
    const headers = Object.keys(csvData[0]);
    let csvContent = headers.join(',') + '\n';

    // Add CSV rows
    csvData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV values
        if (value.toString().includes(',') || value.toString().includes('"')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value.toString();
      });
      csvContent += values.join(',') + '\n';
    });

    console.log('✅ CSV export completed successfully');
    return csvContent;

  } catch (error) {
    console.error('❌ Error creating CSV export:', error);
    throw error;
  }
}

/**
 * Generate export statistics
 * @param {Array} meetings - Array of meeting objects
 * @returns {Object} Export statistics
 */
function generateExportStats(meetings) {
  const stats = {
    totalMeetings: meetings.length,
    parsedMeetings: 0,
    totalParticipants: 0,
    totalActionItems: 0,
    organizationsIncluded: new Set(),
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  meetings.forEach(meeting => {
    stats.organizationsIncluded.add(meeting.orgId);

    const meetingDate = new Date(meeting.date);
    if (!stats.dateRange.earliest || meetingDate < stats.dateRange.earliest) {
      stats.dateRange.earliest = meetingDate;
    }
    if (!stats.dateRange.latest || meetingDate > stats.dateRange.latest) {
      stats.dateRange.latest = meetingDate;
    }

    if (meeting.parsedData) {
      stats.parsedMeetings++;
      stats.totalParticipants += meeting.parsedData.participants.length;
      stats.totalActionItems += meeting.parsedData.actionItems.length;
    }
  });

  stats.organizationsIncluded = stats.organizationsIncluded.size;

  return stats;
}

module.exports = {
  exportToExcel,
  exportToCSV,
  generateExportStats
};