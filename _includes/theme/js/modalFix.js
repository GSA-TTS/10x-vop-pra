(function() {
    const modalDiv = document.querySelector('.usa-modal');
    const modalID = modalDiv.getAttribute('id');
    const modal = document.getElementById(modalID);
    let overlay=document.getElementsByClassName("usa-modal-overlay");
    const bodyContent = document.querySelector('.usa-app');
    const nonModals = document.querySelectorAll('body > *:not(.usa-modal-wrapper)');
    const openButton=document.querySelector('[data-open-modal]');

    // Function to add inert attribute when modal is open
    const addInert=() => {
        nonModals.forEach(el => {
            el.setAttribute('inert','true');
        });
    };

    // Function to remove inert attribute when modal is closed
    const removeInert=() => {
        document.querySelectorAll('[inert]').forEach(el => {
            el.removeAttribute('inert');
        });
    };

    openButton.addEventListener('click',function(event) {
        addInert();        
    });

    // Listen for the closing event
    modal.addEventListener('click',function(event) {
        if(!modal.classList.contains('is-visible')) {
            removeInert();
        }
    });

    window.addEventListener('load',(event) => {
        overlay[0].addEventListener('click',function(event) {
            removeInert();
        });

        openButton.addEventListener('click',function(event) {
            bodyContent.removeAttribute('aria-hidden');        
        });
    });
})();