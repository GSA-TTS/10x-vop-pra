const fs = require("fs");
const path = require('path');
const { execFile } = require('child_process');

exports.handler = async (event) => {
    try {
        // Set the path to the `convert.sh` script
        const convertScriptPath = path.resolve(__dirname, 'node_modules/docx2pdf-converter/convert.sh');

        // Ensure the file exists
        if (!fs.existsSync(convertScriptPath)) {
            throw new Error(`Script not found at ${convertScriptPath}`);
        }

        // Input file (sent via POST request body)
        const inputFilePath = path.join('/tmp', 'input.docx');
        const outputFilePath = path.join('/tmp', 'output.pdf');

        // Save the uploaded DOCX file to /tmp
        fs.writeFileSync(inputFilePath, Buffer.from(event.body, 'base64'));

        // Run the conversion script
        await new Promise((resolve, reject) => {
            execFile(
                convertScriptPath,
                [inputFilePath, outputFilePath],
                (error, stdout, stderr) => {
                    if (error) {
                        reject(`Error during conversion: ${stderr}`);
                    } else {
                        resolve(stdout);
                    }
                }
            );
        });

        // Read the converted PDF
        const pdfBuffer = fs.readFileSync(outputFilePath);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
            },
            body: pdfBuffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};