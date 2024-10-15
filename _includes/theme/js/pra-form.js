(function() {
    function handleFormLogic(formId, logicFn) {
        const form = document.querySelector(formId);
        const radios = form.querySelectorAll('input[type="radio"]');
        const guidanceContainer = form.querySelector('.quidance-container');
        const resetButton = form.querySelector('.reset-form');

        // Function to update the guidance text based on custom logic
        function updateGuidance() {
            logicFn(form, guidanceContainer);  // Call the custom logic function
        }

        // Attach change event listener to all radio buttons in the form
        radios.forEach(radio => {
            radio.addEventListener('change', updateGuidance);
        });

        // Reset form functionality
        resetButton.addEventListener('click', () => {
            form.reset();
            guidanceContainer.innerHTML = "Guidance will appear here";
            guidanceContainer.className = 'quidance-container guidance-gray';
        });
    }

    // Logic for the PRA Recruitment form
    function form1Logic(form, guidanceContainer) {
        const answers = Array.from(form.querySelectorAll('input[type="radio"]:checked')).map(input => input.value);

        if (answers.length === 3 && answers.every(answer => answer === 'yes')) {
            guidanceContainer.innerHTML = '<span class="text-bold">If you answered YES to ALL of these questions, it is <span class="text-italic">likely</span> that you will need PRA clearance for RECRUITMENT activities</span>. <a href="{{ "/get-pra-clearance/" | url }}">Find out how to get PRA clearance</a>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-yellow';
        } else if (answers.every(answer => answer === 'no')) {
            guidanceContainer.innerHTML = '<span class="text-bold">If you answered NO to ANY of these questions, it is <span class="text-italic">likely</span> that you will NOT need PRA clearance for RECRUITMENT activities</span>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-green';
        } else {
            guidanceContainer.innerHTML = "Guidance will appear here";
            guidanceContainer.className = 'quidance-container guidance-gray';
        }
    }

    // Logic for the PRA Research form
    function form2Logic(form, guidanceContainer) {
        const research10OrMore = form.querySelector('input[name="research-10-or-more"]:checked')?.value;
        const researchPublic = form.querySelector('input[name="research-public"]:checked')?.value;
        const standardizedQuestion = form.querySelector('input[name="standardized-question"]:checked')?.value;
        const directObservation = form.querySelector('input[name="direct-observation"]:checked')?.value;

        guidanceContainer.innerHTML = "Guidance will appear here";
        guidanceContainer.className = 'quidance-container guidance-gray';

        // Research Participants Logic
        if (researchPublic === "no") {
            guidanceContainer.innerHTML = '<span class="text-bold">If you are conducting research with federal employees ONLY, it is <span class="text-italic">likely</span> that you will NOT need PRA clearance for RESEARCH activities</span>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-green';
        } else if (research10OrMore === "no") {
            guidanceContainer.innerHTML = '<span class="text-bold">If you are conducting research with fewer than 10 participants, it is <span class="text-italic">likely</span> that you will NOT need PRA clearance for RESEARCH activities</span>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-green';
        }

        // Research Methods Logic
        if (standardizedQuestion === "yes") {
            guidanceContainer.innerHTML = '<span class="text-bold">If you are posing a set of identical questions to 10 or more members of the public (regardless of whether you are observing them directly), it is <span class="text-italic">likely</span> that you will need PRA clearance for RESEARCH activities</span>. <a href="{{ "/get-pra-clearance/" | url }}">Find out how to get PRA clearance</a>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-yellow';
        } else if (standardizedQuestion === "no" && directObservation === "yes") {
            guidanceContainer.innerHTML = '<span class="text-bold">If you are not posing a set of identical questions AND observing your participants directly during the research, it is <span class="text-italic">likely</span> that you will NOT need PRA clearance for RESEARCH activities</span>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-green';
        } else if (standardizedQuestion === "no" && directObservation === "no") {
            guidanceContainer.innerHTML = '<span class="text-bold">If you are not directly observing participants BUT not posing a set of identical questions (i.e. a short, open-ended feedback survey), it is <span class="text-italic">likely</span> that you will NOT need PRA clearance for RESEARCH activities</span>. If you are still unsure whether you need clearance, please consult <a href="mailto:Todd.W.Rubin2@omb.eop.gov">OMB\'s CX PRA Officer</a> for further clarification.';
            guidanceContainer.className = 'quidance-container guidance-green';
        }
    }

    // Function to reset the form on page load
    function resetFormOnLoad(formId) {
        const form = document.querySelector(formId);
    
        // Reset the form fields
        form.reset();
    
        // Clear the guidance container and apply the default gray style
        const guidanceContainer = form.querySelector('.quidance-container');
        guidanceContainer.innerHTML = "Guidance will appear here";
        guidanceContainer.className = 'quidance-container guidance-gray';
    }

    window.addEventListener("pageshow", () => {
        // Reset forms on page load
        resetFormOnLoad('#pra-recruitment-form');
        resetFormOnLoad('#pra-researcher-form');
    });

    // Initialize form logic handlers
    handleFormLogic('#pra-recruitment-form', form1Logic);
    handleFormLogic('#pra-researcher-form', form2Logic);
})();