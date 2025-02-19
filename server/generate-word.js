require('dotenv').config();
const { 
    S3Client, 
    PutObjectCommand, 
    ListObjectsV2Command, 
    DeleteObjectCommand,
    GetObjectCommand 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Configure S3
function configureS3() {
    console.log('Starting S3 configuration...');
    
    try {
        const vcapServices = process.env.VCAP_SERVICES;
        console.log('VCAP_SERVICES raw:', vcapServices);
        
        if (!vcapServices) {
            throw new Error('VCAP_SERVICES environment variable is missing');
        }

        const parsedServices = JSON.parse(vcapServices);
        // Update this line to show the full object structure
        console.log('Parsed VCAP_SERVICES:', JSON.stringify(parsedServices, null, 2));
        
        if (!parsedServices.s3 || !parsedServices.s3[0]) {
            throw new Error('S3 service configuration not found in VCAP_SERVICES');
        }

        const s3Config = parsedServices.s3[0].credentials;

        // Get base endpoint and ensure it has https://
        let endpoint = s3Config.fips_endpoint || s3Config.endpoint;
        if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
            endpoint = `https://${endpoint}`;
        }

        // Log the config (but remove sensitive data)
        console.log('S3 Configuration:', JSON.stringify({
            endpoint: s3Config.fips_endpoint || s3Config.endpoint,
            region: s3Config.region,
            bucket: s3Config.bucket
        }, null, 2));

        return {
            client: new S3Client({
                endpoint: endpoint,
                region: s3Config.region,
                credentials: {
                    accessKeyId: s3Config.access_key_id,
                    secretAccessKey: s3Config.secret_access_key,
                },
                forcePathStyle: true
            }),
            bucketName: s3Config.bucket,
        };
    } catch (error) {
        console.error('Error configuring S3:', error);
        throw error;
    }
}

const { client: s3Client, bucketName } = configureS3();

// Function to add robots.txt
async function addRobotsTxt(s3Client, bucketName) {
    const robotsContent = `User-agent: *
Disallow: /uploads/`;
    
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'robots.txt',
        Body: robotsContent,
        ContentType: 'text/plain'
    });
    
    await s3Client.send(command);
}

// Initialize S3 security
async function initializeS3Security() {
    try {
        await addRobotsTxt(s3Client, bucketName);
        console.log('Added robots.txt to bucket');
    } catch (error) {
        console.error('Error adding robots.txt:', error);
    }
}

// Function to clean up old files
async function cleanupOldFiles(s3Client, bucketName) {
    try {
        console.log('Starting cleanup of old files...');
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'uploads/'
        });

        const response = await s3Client.send(command);
        if (!response.Contents) return;

        const now = new Date();
        const oneDayInMs = 24 * 60 * 60 * 1000;

        for (const object of response.Contents) {
            if (object.LastModified && (now.getTime() - new Date(object.LastModified).getTime()) > oneDayInMs) {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: object.Key
                }));
                console.log(`Deleted old file: ${object.Key}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
}

// Upload to S3
async function uploadToS3(bucketName, key, body) {
    console.log('Attempting to upload to S3...', { bucketName, key });

    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body,
            ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ACL: 'public-read',
            CacheControl: 'no-cache, no-store, must-revalidate'
        });

        await s3Client.send(command);
        const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: key });
        const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 24 * 60 * 60 });

        console.log('Generated signed URL:', signedUrl);
        return signedUrl;
    } catch (error) {
        console.error('S3 upload error details:', error);
        throw error;
    }
}

// Initialize security when module is loaded
initializeS3Security().catch(console.error);

module.exports = async (req, res) => {
    try {
        console.log('Starting document generation...');
        const formData = req.body;

        // Load Word template
        const templatePath = path.join(__dirname, '../_includes/theme/templates/ICR-Template_A11-Section-280-Clearance-v5-13-24.docx');
        console.log('Template path:', templatePath);

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at path: ${templatePath}`);
        }
        const templateContent = fs.readFileSync(templatePath, 'binary');

        // Initialize Docxtemplater
        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Map form data to template placeholders
        const fieldMapping = {
            title: formData.title || '',
            purpose: formData.purpose || '',
            customerResearch: formData.customerResearch || '',
            customerFeedback: formData.customerFeedback || '',
            usabilityTesting: formData.usabilityTesting || '',
            surveyResultsYes: formData.surveyResultsYes || '',
            surveyResultsNo: formData.surveyResultsNo || '',
            notASurvey: formData.notASurvey || '',
            webBased: formData.webBased || '',
            telephone: formData.telephone || '',
            inPerson: formData.inPerson || '',
            mail: formData.mail || '',
            other: formData.other || '',
            collectInfoFrom: formData.collectInfoFrom || '',
            respondentProvideInfo: formData.respondentProvideInfo || '',
            activityLookLike: formData.activityLookLike || '',
            questionList: formData.questionList || '',
            activityTiming: formData.activityTiming || '',
            incentiveYes: formData.incentiveYes || '',
            incentiveNo: formData.incentiveNo || '',
            incentiveDescription: formData.incentiveDescription || '',
            burdenEstimates: formData.burdenEstimates || [],
            totalNumberOfRespondents: formData.totalNumberOfRespondents || 0,
            totalParticipationTime: formData.totalParticipationTime || 0,
            totalAnnualBurdenHours: formData.totalAnnualBurdenHours || 0,
            name: formData.name || '',
            email: formData.email || '',
        };

        // Render the template with the provided data
        try {
            doc.render(fieldMapping);
        } catch (error) {
            throw new Error(`Failed to render the document: ${error.message}`);
        }

        // Generate the document as a Buffer
        const documentBuffer = doc.getZip().generate({ type: 'nodebuffer' });

        // Upload the document to S3
        const fileName = `ICR-Template-${Date.now()}.docx`;
        console.log('Preparing to upload to S3:', fileName);

        const fileUrl = await uploadToS3(bucketName, `uploads/${fileName}`, documentBuffer);
        
        if (!fileUrl) {
            throw new Error('File URL not generated after S3 upload');
        }

        // Log success
        console.log('Document processed successfully');
        console.log('Generated File URL:', fileUrl);

        // Respond with the S3 file URL
        return res.status(200).json({ 
            success: true,
            fileUrl: fileUrl,
            filename: fileName
        });
    } catch (error) {
        console.error('Error in generate-word:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to process the request',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};