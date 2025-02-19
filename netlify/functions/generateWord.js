const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Parse form data from the event body (JSON format)
    const formData = JSON.parse(event.body);

    // Load your Word template file
    const templatePath = path.join(
      process.cwd(),
      'netlify/functions/templates/ICR-Template_A11-Section-280-Clearance-v5-13-24.docx'
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at path: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'binary');

    // Load the template content into PizZip
    const zip = new PizZip(content);

    // Create a new document from the template
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // Utility function to handle '✓' or ' ' for boolean fields
    const setBooleanValue = (value, targetValue) => (value === targetValue ? '✓' : ' ');

    // Calculate totals for the burden estimates
    const totalNumberOfRespondents = formData.burdenEstimates.reduce((sum, row) => sum + Number(row.numberOfRespondents || 0), 0);
    const totalParticipationTime = formData.burdenEstimates.reduce((sum, row) => sum + Number(row.participationTime || 0), 0);
    const totalAnnualBurdenHours = formData.burdenEstimates.reduce((sum, row) => sum + Number(row.annualBurdenHours || 0), 0);

    // Configuration for mapping form fields to template placeholders
    const fieldMapping = {
      title: formData.title,
      purpose: formData.purpose,
      customerResearch: setBooleanValue(formData.radioSelection, 'Customer research (interview, focus groups, surveys)'),
      customerFeedback: setBooleanValue(formData.radioSelection, 'Customer feedback survey'),
      usabilityTesting: setBooleanValue(formData.radioSelection, 'Usability testing of products or services'),
      surveyResultsYes: setBooleanValue(formData.surveyResults, 'Yes'),
      surveyResultsNo: setBooleanValue(formData.surveyResults, 'No'),
      notASurvey: setBooleanValue(formData.surveyResults, 'Not a survey'),
      webBased: formData.checkboxes.includes('Web-based or social media') ? '✓' : ' ',
      telephone: formData.checkboxes.includes('Telephone') ? '✓' : ' ',
      inPerson: formData.checkboxes.includes('In-person') ? '✓' : ' ',
      mail: formData.checkboxes.includes('Mail') ? '✓' : ' ',
      other: formData.checkboxes.includes('Other') ? '✓' : ' ',
      collectInfoFrom: formData.collectInfoFrom,
      respondentProvideInfo: formData.respondentProvideInfo,
      activityLookLike: formData.activityLookLike,
      questionList: formData.questionList,
      activityTiming: formData.activityTiming,
      incentiveYes: setBooleanValue(formData.incentiveOptions, 'Yes'),
      incentiveNo: setBooleanValue(formData.incentiveOptions, 'No'),
      incentiveDescription: formData.incentiveDescription,
      burdenEstimates: formData.burdenEstimates.map(row => ({
        categoryOfRespondents: row.categoryOfRespondents,
        numberOfRespondents: row.numberOfRespondents,
        participationTime: row.participationTime,
        annualBurdenHours: row.annualBurdenHours,
      })),
      totalNumberOfRespondents,
      totalParticipationTime,
      totalAnnualBurdenHours,
      name: formData.name,
      email: formData.email,
    };

    // Compile and render the document
    doc.render(fieldMapping);

    // Generate the filled document as a buffer
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

    // Return the document for download
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="filled_template.docx"',
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate Word document.', details: error.message }),
    };
  }
};
