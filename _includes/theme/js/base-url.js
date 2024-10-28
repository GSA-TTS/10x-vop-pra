(function() {
    document.addEventListener("DOMContentLoaded",function() {
        // Get the base URL dynamically from window.location
        const baseUrl=window.location.origin;

        // Find all elements with the class 'dynamic-base-url' and update their href attribute
        document.querySelectorAll("a.dynamic-base-url").forEach(function(element) {
            // Ensure the href attribute starts with a slash to avoid duplicating the base URL
            const relativePath=element.getAttribute('href');
            if(relativePath.startsWith('/assets')) {
                element.href=baseUrl+relativePath;
            }
        });

        // Find the iframe that needs its src updated
        document.querySelectorAll("iframe[data-dynamic-src]").forEach(function(iframe) {
            const relativePath=iframe.getAttribute('data-dynamic-src');
            if(relativePath.startsWith('/')) {
                // Construct the full URL without encoding
                const encodedRelativePath = encodeURIComponent(relativePath);
                const fullUrl=`${baseUrl}${encodedRelativePath}`;
                const googleViewerUrl=`https://docs.google.com/viewer?url=${fullUrl}&embedded=true`;
                iframe.src=googleViewerUrl;
            }
        });
    });
})();