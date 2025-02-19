require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const generateWord = require('./server/generate-word'); 
const RateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Enable 'trust proxy' for proxies like Cloud.gov
app.set('trust proxy', 1);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '_site')));
app.use('/uploads', express.static(path.join(__dirname, '_site/uploads')));

// Rate limiter middleware
const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
});

// Configure MySQL pool
function getDbConfig() {
    // Check if we're running locally
    if (process.env.NODE_ENV === 'development') {
        console.log('Using local database configuration');
        
        // Ensure all credentials come from environment variables
        if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD) {
            throw new Error('Local database configuration environment variables are missing');
        }
        
        return {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
        };
    }

    // Cloud.gov production settings
    if (!process.env.VCAP_SERVICES) {
        throw new Error('VCAP_SERVICES environment variable is missing in production');
    }

    try {
        const vcapServices = process.env.VCAP_SERVICES;
        const parsedServices = JSON.parse(vcapServices);
        
        if (!parsedServices['aws-rds'] || !parsedServices['aws-rds'][0]) {
            throw new Error('Database service configuration not found in VCAP_SERVICES');
        }

        const credentials = parsedServices['aws-rds'][0].credentials;
        
        if (!credentials) {
            throw new Error('Database credentials not found in VCAP_SERVICES');
        }

        // Only log non-sensitive configuration data
        console.log('Using Cloud.gov database configuration');

        return {
            host: credentials.host,
            port: credentials.port,
            database: credentials.db_name,
            user: credentials.username,
            password: credentials.password
        };
    } catch (error) {
        console.error('Error configuring database:', error);
        throw error;
    }
}

const pool = mysql.createPool(getDbConfig());

// Routes
app.post('/generate-word', limiter, async (req, res) => {
    console.log('POST /generate-word received');
    console.log('Request body:', req.body);
  
    try {
        await generateWord(req, res);
    } catch (error) {
        console.error('Error in /generate-word:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to generate the document.',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.post('/save-progress', limiter, async (req, res) => {
    try {
        const { token, formData } = req.body;
        
        // Ensure formData is stringified properly
        const formDataString = typeof formData === 'string' ? formData : JSON.stringify(formData);
        
        if (!token) {
            // New session
            const newToken = uuidv4();
            await pool.execute(
                'INSERT INTO form_progress (token, form_data) VALUES (?, ?)',
                [newToken, formDataString]
            );
            res.json({ token: newToken });
        } else {
            // Update existing session
            await pool.execute(
                'UPDATE form_progress SET form_data = ?, last_updated = CURRENT_TIMESTAMP WHERE token = ?',
                [formDataString, token]
            );
            res.json({ token });
        }
    } catch (error) {
        console.error('Error saving progress:', error);
        console.error('Form data received:', req.body);  // Add this for debugging
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// Add the S3 test endpoint here
app.get('/test-s3', async (req, res) => {
    try {
        const { client: s3Client, bucketName } = configureS3();
        
        const testFile = Buffer.from('Hello World');
        const testKey = `test-${Date.now()}.txt`;
        
        const uploadResult = await uploadToS3(bucketName, testKey, testFile);
        
        res.json({
            success: true,
            message: 'Test file uploaded successfully',
            fileUrl: uploadResult
        });
    } catch (error) {
        console.error('S3 test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/load-progress/:token', limiter, async (req, res) => {
    try {
        const { token } = req.params;
        const [rows] = await pool.execute(
            'SELECT form_data FROM form_progress WHERE token = ?',
            [token]
        );
        
        if (rows.length === 0) {
            res.status(404).json({ error: 'Session not found' });
        } else {
            // Safely parse the JSON
            try {
                const formData = typeof rows[0].form_data === 'string' 
                    ? JSON.parse(rows[0].form_data)
                    : rows[0].form_data;
                res.json(formData);
            } catch (parseError) {
                console.error('Error parsing form data:', parseError);
                console.error('Raw form data:', rows[0].form_data);
                res.status(500).json({ error: 'Invalid form data format' });
            }
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        res.status(500).json({ error: 'Failed to load progress' });
    }
});

// Fallback route
app.use((req, res) => {
    res.status(404).send({ error: 'Route not found.' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});