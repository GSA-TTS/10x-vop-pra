let currentStep = 0;
const steps = document.querySelectorAll(".step");
const stepIndicators = document.querySelectorAll(".usa-step-indicator__segment");
const currentStepNumber = document.getElementById("current-step-number");
const currentStepText = document.getElementById("current-step-text");
const fileInput = document.getElementById('attachments');
const fileListDiv = document.getElementById('file-list');
let uploadedFiles = [];
let documentBlobUrl = null; 
const burdenEstimates = [];
let formToken = null;
const AUTOSAVE_DELAY = 1000; // 1 second
let autosaveTimeout = null;
let isSubmitting = false; 

function showStep(step) {
    steps.forEach((element,index) => {
        element.style.display=index===step? "block":"none";
    });

    stepIndicators.forEach((element,index) => {
        if(index<step) {
            element.classList.add("usa-step-indicator__segment--complete");
            element.classList.remove("usa-step-indicator__segment--current");
        } else if(index===step) {
            element.classList.add("usa-step-indicator__segment--current");
            element.classList.remove("usa-step-indicator__segment--complete");
        } else {
            element.classList.remove("usa-step-indicator__segment--complete","usa-step-indicator__segment--current");
        }
    });

    const currentStepElement=steps[step];
    const stepTitle=currentStepElement.dataset.stepTitle||"Details of information collection";

    currentStepNumber.textContent=step+1;
    currentStepText.textContent=stepTitle;
}

function validateStep(step) {
    let isValid = true;
    const stepElement = steps[step];
    const inputs = stepElement.querySelectorAll("input, textarea, select");
    let firstInvalidField = null;

    // Remove previous error messages
    function cleanupErrors(input, parentContainer) {
        const existingError = parentContainer.querySelector(".error-message");
        if (existingError) existingError.remove();

        parentContainer.classList.remove("usa-input--error");
        input.classList.remove("usa-input--error");
    }

    // Helper to add error messages
    function showErrorMessage(input, message) {
        const parentContainer = input.closest(".usa-fieldset") || input.parentElement;
        cleanupErrors(input, parentContainer);

        const errorElement = document.createElement("div");
        errorElement.className = "error-message usa-error-message";
        errorElement.textContent = message;

        parentContainer.classList.add("usa-input--error");
        parentContainer.appendChild(errorElement);

        if (!firstInvalidField) {
            firstInvalidField = input; // Set the first invalid field
        }
    }

    // Helper to validate radio and checkbox groups
    function validateGroup(groupInputs, parentContainer, message) {
        const isChecked = Array.from(groupInputs).some((el) => el.checked);

        if (!isChecked) {
            showErrorMessage(groupInputs[0], message);
            return false;
        }
        return true;
    }

    inputs.forEach((input) => {
        const parentContainer = input.closest(".usa-fieldset") || input.parentElement;
        cleanupErrors(input, parentContainer);

        // Required fields (text, textarea, select)
        if (input.hasAttribute("required") && !input.value.trim()) {
            if (input.name === "incentiveDescription") {
                showErrorMessage(input, "Please describe the incentive.");
            } else {
                showErrorMessage(input, "This field is required.");
            }
            isValid = false;
        }
    });

    // Validate radio and checkbox groups
    const radioGroups = [...new Set(Array.from(inputs).filter(input => input.type === "radio").map(input => input.name))];
    radioGroups.forEach((name) => {
        const groupInputs = stepElement.querySelectorAll(`input[name="${name}"]`);
        if (groupInputs.length) {
            const parentContainer = groupInputs[0].closest(".usa-fieldset") || groupInputs[0].parentElement;
            if (!validateGroup(groupInputs, parentContainer, "Please select an option.")) {
                isValid = false;
            }
        }
    });

    const checkboxGroups = [...new Set(Array.from(inputs).filter(input => input.type === "checkbox").map(input => input.name))];
    checkboxGroups.forEach((name) => {
        const groupInputs = stepElement.querySelectorAll(`input[name="${name}"]`);
        if (groupInputs.length) {
            const parentContainer = groupInputs[0].closest(".usa-fieldset") || groupInputs[0].parentElement;
            if (!validateGroup(groupInputs, parentContainer, "Please select at least one option.")) {
                isValid = false;
            }
        }
    });

    document.querySelectorAll('input[name="incentiveOptions"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            const textarea = document.getElementById("incentiveDescription");
            
            if (e.target.value === "Yes") {
                textarea.setAttribute("required", "true");
            } else {
                textarea.removeAttribute("required");
            }
        });
    });

    // Special validation logic for Step 3: Burden estimates
    if (step === 2) { // Assuming step 3 is at index 2
        const categories = stepElement.querySelectorAll('input[name="category"]:checked');
        if (!categories.length) {
            const container = stepElement.querySelector(".usa-fieldset");
            showErrorMessage(container, "Please select at least one category.");
            isValid = false;
        } else {
            categories.forEach((category) => {
                const numberField = stepElement.querySelector(`#numberOfRespondents-${category.value}`);
                const timeField = stepElement.querySelector(`#participationTime-${category.value}`);
                if (!numberField.value.trim() || isNaN(numberField.value) || Number(numberField.value) <= 0) {
                    showErrorMessage(numberField, "Please enter a valid number of respondents.");
                    isValid = false;
                }
                if (!timeField.value.trim() || isNaN(timeField.value) || Number(timeField.value) <= 0) {
                    showErrorMessage(timeField, "Please enter a valid participation time.");
                    isValid = false;
                }
            });
        }
    }

    // Scroll to the first invalid field, if any
    if (!isValid && firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalidField.focus(); // Optionally, focus the invalid field
    }

    return isValid;
}

function toggleCategoryInputs(category, isChecked) {
    const container = document.getElementById(`${category}-inputs`);
    if (isChecked) {
        container.style.display = "block";
    } else {
        container.style.display = "none";
        // Remove the estimate for this category
        const index = burdenEstimates.findIndex(e => e.categoryOfRespondents === category);
        if (index > -1) {
            burdenEstimates.splice(index, 1);
        }
        
        // Clear the input values
        const numberField = document.querySelector(`#numberOfRespondents-${category}`);
        const timeField = document.querySelector(`#participationTime-${category}`);
        if (numberField) numberField.value = '';
        if (timeField) timeField.value = '';
    }
}

function updateBurdenEstimate(category) {
    const numberOfRespondents = parseFloat(document.querySelector(`#numberOfRespondents-${category}`).value) || 0;
    const participationTime = parseFloat(document.querySelector(`#participationTime-${category}`).value) || 0;

    const annualBurdenHours = (numberOfRespondents * participationTime) / 60;
    
    // Round to exactly 2 decimal places
    const roundedBurdenHours = Number(Math.round(annualBurdenHours + 'e2') + 'e-2');

    // Find existing estimate or create new one
    let estimate = burdenEstimates.find(e => e.categoryOfRespondents === category);
    if (!estimate) {
        estimate = {
            categoryOfRespondents: category,
            numberOfRespondents: 0,
            participationTime: 0,
            annualBurdenHours: 0
        };
        burdenEstimates.push(estimate);
    }

    // Update the values
    estimate.numberOfRespondents = numberOfRespondents;
    estimate.participationTime = participationTime;
    estimate.annualBurdenHours = roundedBurdenHours;

    // Trigger autosave
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(saveProgress, AUTOSAVE_DELAY);
}

document.querySelectorAll(".category-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
        const category = e.target.value;
        toggleCategoryInputs(category, e.target.checked);
    });
});

document.querySelectorAll(".dynamic-input").forEach((input) => {
    input.addEventListener("input", (e) => {
        const category = e.target.dataset.category;
        updateBurdenEstimate(category);
    });
});

function nextStep() {
    validateStep(currentStep);

    if (validateStep(currentStep)) {
        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
        }
    }
}

function previousStep() {
    if(currentStep>0) {
        currentStep--;
        showStep(currentStep);
    }
}

async function saveProgress() {
    const form = document.getElementById('wizardForm');
    const data = {
        formFields: {},
        currentStep,
        burdenEstimates: Array.from(burdenEstimates), // Convert to regular array
        checkboxes: Array.from(form.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value),
        radioSelections: {}
    };
    
    // Get all form field values
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        data.formFields[key] = value;
    }

    // Get radio selections
    ['radioSelection', 'surveyResults', 'incentiveOptions'].forEach(name => {
        const selected = form.querySelector(`input[name="${name}"]:checked`);
        if (selected) {
            data.radioSelections[name] = selected.value;
        }
    });

    try {
        const response = await fetch('https://pra-app-sweet-kudu-cz.app.cloud.gov/save-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: formToken,
                formData: data
            })
        });

        const result = await response.json();
        
        if (!formToken) {
            formToken = result.token;
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('session', formToken);
            window.history.pushState({}, '', newUrl);
        }
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

async function loadProgress(token) {
    try {
        const response = await fetch(`https://pra-app-sweet-kudu-cz.app.cloud.gov/load-progress/${token}`);
        if (!response.ok) throw new Error('Failed to load progress');
        
        const data = await response.json();
        formToken = token;

        const form = document.getElementById('wizardForm');
        
        // Restore form fields
        if (data.formFields) {
            Object.entries(data.formFields).forEach(([key, value]) => {
                const input = form.elements[key];
                if (input) {
                    input.value = value;
                }
            });
        }

        // Restore checkboxes
        if (data.checkboxes) {
            data.checkboxes.forEach(value => {
                const checkbox = form.querySelector(`input[type="checkbox"][value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    // Trigger change event for any dependent UI updates
                    const event = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(event);
                }
            });
        }

        // Restore radio selections
        if (data.radioSelections) {
            Object.entries(data.radioSelections).forEach(([name, value]) => {
                const radio = form.querySelector(`input[name="${name}"][value="${value}"]`);
                if (radio) {
                    radio.checked = true;
                    // Trigger change event for any dependent UI updates
                    const event = new Event('change', { bubbles: true });
                    radio.dispatchEvent(event);
                }
            });
        }

        // Restore burden estimates
        if (data.burdenEstimates && Array.isArray(data.burdenEstimates)) {
            burdenEstimates.length = 0;
            data.burdenEstimates.forEach(estimate => burdenEstimates.push(estimate));
            
            // Restore UI state for burden estimates
            data.burdenEstimates.forEach(estimate => {
                if (estimate.categoryOfRespondents) {
                    const checkbox = form.querySelector(`input[type="checkbox"][value="${estimate.categoryOfRespondents}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        toggleCategoryInputs(estimate.categoryOfRespondents, true);
                        
                        const numberField = document.querySelector(`#numberOfRespondents-${estimate.categoryOfRespondents}`);
                        const timeField = document.querySelector(`#participationTime-${estimate.categoryOfRespondents}`);
                        
                        if (numberField) numberField.value = estimate.numberOfRespondents;
                        if (timeField) timeField.value = estimate.participationTime;
                    }
                }
            });

            document.querySelectorAll(".dynamic-input").forEach((input) => {
                input.addEventListener("input", (e) => {
                    const category = e.target.dataset.category;
                    updateBurdenEstimate(category);
                });
                // Add change event listener as well
                input.addEventListener("change", (e) => {
                    if (autosaveTimeout) clearTimeout(autosaveTimeout);
                    autosaveTimeout = setTimeout(saveProgress, AUTOSAVE_DELAY);
                });
            });
        }

        // Restore current step
        if (typeof data.currentStep === 'number') {
            currentStep = data.currentStep;

            if (data.currentStep === steps.length - 1) {
                currentStep = data.currentStep - 1;
            } else {
                currentStep = data.currentStep;
            }

            showStep(currentStep);

            // Scroll to the wizard section
            const wizardSection = document.querySelector('.icr-form-builder-section');
            if (wizardSection) {
                wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Add autosave functionality
function setupAutosave() {
    const form = document.getElementById('wizardForm');
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            if (autosaveTimeout) clearTimeout(autosaveTimeout);
            autosaveTimeout = setTimeout(saveProgress, AUTOSAVE_DELAY);
        });
    });
}

// Show the first step on page load
document.addEventListener("DOMContentLoaded",() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');

    if (sessionToken) {
        loadProgress(sessionToken).then(() => {
            // Scroll after loading progress
            const wizardSection = document.querySelector('.icr-form-builder-section');
            if (wizardSection) {
                wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    } else {
        showStep(currentStep);
    }

    setupAutosave();
    showStep(currentStep);
});

// Handle file input change
if (fileInput) {
    fileInput.addEventListener('change', (event) => {
        const newFiles = Array.from(event.target.files);
        uploadedFiles = uploadedFiles.concat(newFiles);
        updateFileList();
    });
}

// Update the file list in the UI
function updateFileList() {
    fileListDiv.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
        const fileEntry = document.createElement('div');
        const fileNameSpan = document.createElement('span');
        const removeButton = document.createElement('button');

        fileEntry.className = 'file-entry';
        fileNameSpan.textContent = file.name;
        fileEntry.appendChild(fileNameSpan);

        
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeFile(index);
        
        fileEntry.appendChild(removeButton);
        fileListDiv.appendChild(fileEntry);
    });

    updateFileInput();
}

// Remove a file and update the list
function removeFile(index) {
    uploadedFiles.splice(index, 1); // Remove the file from the array
    updateFileList();
}

// Sync the file input's FileList with uploadedFiles
function updateFileInput() {
    const dataTransfer = new DataTransfer();

    uploadedFiles.forEach((file) => {
        dataTransfer.items.add(file);
    });

    // Update the file input with the new files
    fileInput.files = dataTransfer.files;
}

function submitForm() {
    // Prevent double submission
    if (isSubmitting) {
        console.log('Form submission already in progress');
        return;
    }

    console.log('Starting form submission process...');
    isSubmitting = true;

    const submitButton = document.querySelector('button[onclick="submitForm()"]');
    const originalButtonText = submitButton.textContent;
    
    try {
        // Add submission timestamp for tracking
        const submissionId = Date.now();
        console.log(`Submission ID: ${submissionId} started`);

        const form = document.getElementById('wizardForm');
        const formData = new FormData(form);

        // Log the current state
        console.log('Current step:', currentStep);
        console.log('Burden estimates:', burdenEstimates);

    // Clear existing burden estimates before adding new ones
    burdenEstimates.length = 0;

    // Utility function to handle checkmarks using Unicode character
    const setBooleanValue = (value, targetValue) => (value === targetValue ? 'X' : ' ');

    // Extract checked checkboxes
    const checkboxes = Array.from(form.querySelectorAll('input[name="checkboxes"]:checked')).map(cb => cb.value);

    // Extract selected radio button values
    const radioSelection = form.querySelector('input[name="radioSelection"]:checked')?.value || '';
    const surveyResults = form.querySelector('input[name="surveyResults"]:checked')?.value || '';
    const incentiveOptions = form.querySelector('input[name="incentiveOptions"]:checked')?.value || '';

    // Populate burdenEstimates
    const categories = document.querySelectorAll('input[name="category"]:checked');
    let hasValidBurdenEstimates = false;

    categories.forEach((category) => {
        const categoryName = category.value;
        const numberField = document.querySelector(`#numberOfRespondents-${categoryName}`);
        const timeField = document.querySelector(`#participationTime-${categoryName}`);

        if (numberField && timeField && numberField.value && timeField.value) {
            const numberOfRespondents = Number(numberField.value);
            const participationTime = Number(timeField.value);

            if (numberOfRespondents > 0 && participationTime > 0) {
                const annualBurdenHours = (numberOfRespondents * participationTime) / 60;
                burdenEstimates.push({
                    categoryOfRespondents: categoryName,
                    numberOfRespondents,
                    participationTime,
                    annualBurdenHours: Math.round(annualBurdenHours * 100) / 100 // Round to 2 decimals
                });
                hasValidBurdenEstimates = true;
            }
        }
    });

    if (!hasValidBurdenEstimates) {
        alert("Please fill out the Burden Estimates step completely.");
        return;
    }

    // Calculate totals
    const totalNumberOfRespondents = burdenEstimates.reduce((sum, row) => sum + row.numberOfRespondents, 0);
    const totalParticipationTime = burdenEstimates.reduce((sum, row) => sum + row.participationTime, 0);
    const totalAnnualBurdenHours = Number(Math.round((burdenEstimates.reduce((sum, row) => sum + row.annualBurdenHours, 0)) + 'e2') + 'e-2');

    const payload = {
        title: formData.get('title'),
        purpose: formData.get('purpose'),
        customerResearch: setBooleanValue(radioSelection, 'Customer research (interview, focus groups, surveys)'),
        customerFeedback: setBooleanValue(radioSelection, 'Customer feedback survey'),
        usabilityTesting: setBooleanValue(radioSelection, 'Usability testing of products or services'),
        surveyResultsYes: setBooleanValue(surveyResults, 'Yes'),
        surveyResultsNo: setBooleanValue(surveyResults, 'No'),
        notASurvey: setBooleanValue(surveyResults, 'Not a survey'),
        webBased: setBooleanValue(checkboxes.includes('Web-based or social media'), true),
        telephone: setBooleanValue(checkboxes.includes('Telephone'), true),
        inPerson: setBooleanValue(checkboxes.includes('In-person'), true),
        mail: setBooleanValue(checkboxes.includes('Mail'), true),
        other: setBooleanValue(checkboxes.includes('Other'), true),
        collectInfoFrom: formData.get('collectInfoFrom'),
        respondentProvideInfo: formData.get('respondentProvideInfo'),
        activityLookLike: formData.get('activityLookLike'),
        questionList: formData.get('questionList'),
        activityTiming: formData.get('activityTiming'),
        incentiveYes: setBooleanValue(incentiveOptions, 'Yes'),
        incentiveNo: setBooleanValue(incentiveOptions, 'No'),
        incentiveDescription: formData.get('incentiveDescription'),
        burdenEstimates,
        totalNumberOfRespondents,
        totalParticipationTime,
        totalAnnualBurdenHours,
        name: formData.get('name'),
        email: formData.get('email'),
    };

    // Add loading state to submit button
    const submitButton = document.querySelector('button[onclick="submitForm()"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Generating Document...';

        console.log(`Submission ${submissionId}: Preparing to send fetch request`);
        
        fetch('https://pra-app-sweet-kudu-cz.app.cloud.gov/generate-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(async (response) => {
            console.log(`Submission ${submissionId}: Received response`, {
                status: response.status,
                statusText: response.statusText
            });

            const data = await response.json();
            console.log(`Submission ${submissionId}: Parsed response data`, data);
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate document');
            }
      
            if (!data.success || !data.fileUrl) {
                throw new Error('Invalid server response: missing fileUrl');
            }
      
            const previewIframe = document.querySelector('iframe[data-dynamic-src]');
            if (previewIframe) {
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.href = data.fileUrl;
                downloadLink.textContent = 'Download';
             
                // Initial load
                previewIframe.src = `https://docs.google.com/gview?url=${encodeURIComponent(data.fileUrl)}&embedded=true`;
             
                // Check if content loaded after 2 seconds
                setTimeout(() => {
                    try {
                        const hasContent = previewIframe.contentWindow.document.body.scrollHeight > 100;
                        if (!hasContent) {
                            // Start periodic check if no content
                            let attempts = 0;
                            const maxAttempts = 10;
                            const checkInterval = setInterval(() => {
                                try {
                                    if (previewIframe.contentWindow.document.body.scrollHeight > 100 || attempts >= maxAttempts) {
                                        clearInterval(checkInterval);
                                        if (attempts >= maxAttempts) {
                                            previewIframe.srcdoc = `
                                                <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;font-family:sans-serif;text-align:center;">
                                                    <p>Preview could not be loaded. Your document has been generated successfully.</p>
                                                    <p>Please click the download button above to view your document.</p>
                                                </div>`;
                                        }
                                        return;
                                    }
                                    previewIframe.src = `https://docs.google.com/gview?url=${encodeURIComponent(data.fileUrl)}&embedded=true&rand=${Date.now()}`;
                                    attempts++;
                                } catch (e) {
                                    console.log('Loading attempt ' + attempts + ': ' + e.message);
                                }
                            }, 2000);
                        }
                    } catch (e) {
                        console.log('Initial content check error: ' + e.message);
                    }
                }, 2000);
             
                nextStep();
             }
        })
        .catch((error) => {
            console.error(`Submission ${submissionId}: Error occurred`, error);
            alert(`Error: ${error.message}. Please click the "Back" button and try submitting the form again or contact support if the problem persists.`);
        })
        .finally(() => {
            console.log(`Submission ${submissionId}: Completed`);
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            isSubmitting = false;
        });
    } catch (error) {
        console.error('Error in submit process:', error);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        isSubmitting = false;
    }
}

function sendEmail() {
    const form = document.getElementById('wizardForm');    
    const userName = form.elements['name'].value;
    const emailSubject = `${userName} - ICR Package (A-11 Section 280) for Pre-review`;
    const emailBody = `Dear Todd,
    
${userName} is seeking Fast Track (A-11 Section 280) PRA clearance for our upcoming user research. Our completed ICR package is attached to this email for your pre-review. Please let us know if you have any questions, and we will look forward to your feedback.
    
Thank you.`;

    const mailtoLink = document.getElementById("mailtoLink");
    mailtoLink.href = `mailto:Todd.W.Rubin2@omb.eop.gov?cc=tts-research@gsa.gov&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;    
}