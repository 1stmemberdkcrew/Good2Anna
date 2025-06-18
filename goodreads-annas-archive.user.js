// ==UserScript==
// @name         Goodreads to Anna's Archive
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Add Anna's Archive Download link to Goodreads 
// @author       You
// @match        https://www.goodreads.com/book/show/*
// @match        https://annas-archive.org/search*
// @match        https://annas-archive.org/md5/*
// @match        https://annas-archive.org/slow_download/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Global flag to stop the script
    window.stopAnnasArchiveScript = false;
    
    // Global flag to indicate download has started
    window.downloadStarted = false;

    // Add stop button to all pages
    function addStopButton() {
        // Check if stop button already exists
        if (document.getElementById('annas-archive-stop-btn')) {
            return;
        }

        const stopButton = document.createElement('button');
        stopButton.id = 'annas-archive-stop-btn';
        stopButton.textContent = '⏹️ Stop Auto-Download';
        stopButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            background-color: #dc2626;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: background-color 0.2s;
        `;
        
        stopButton.addEventListener('mouseenter', () => {
            stopButton.style.backgroundColor = '#b91c1c';
        });
        
        stopButton.addEventListener('mouseleave', () => {
            stopButton.style.backgroundColor = '#dc2626';
        });
        
        stopButton.addEventListener('click', () => {
            window.stopAnnasArchiveScript = true;
            stopButton.textContent = '⏹️ Stopped';
            stopButton.style.backgroundColor = '#6b7280';
            console.log('Anna\'s Archive script stopped by user');
        });
        
        document.body.appendChild(stopButton);
        console.log('Stop button added');
    }

    // Add stop button to all pages
    addStopButton();

    // Check if we're on Anna's Archive search page
    if (window.location.hostname === 'annas-archive.org' && window.location.pathname.includes('/search')) {
        // Don't run if download has already started
        if (window.downloadStarted) {
            console.log('Download already started, skipping search page automation');
            return;
        }
        
        // Auto-click first result on Anna's Archive
        function clickFirstResult() {
            // Check if script is stopped
            if (window.stopAnnasArchiveScript) {
                console.log('Script stopped, not clicking first result');
                return;
            }

            // Look for the first result with the specific structure
            const firstResult = document.querySelector('div.h-\\[110px\\] a[href^="/md5/"]');
            
            if (firstResult) {
                console.log('Found first result with h-[110px] structure:', firstResult.href);
                firstResult.click();
            } else {
                // Retry after a short delay if results are still loading
                console.log('No results found yet, retrying...');
                setTimeout(clickFirstResult, 1000);
            }
        }
        
        // Wait for search results to load with multiple attempts
        let attempts = 0;
        const maxAttempts = 20;
        
        function attemptClick() {
            attempts++;
            
            // Check if script is stopped
            if (window.stopAnnasArchiveScript) {
                console.log('Script stopped, stopping attempts');
                return;
            }
            
            // Check if we're still on the search page
            if (!window.location.pathname.includes('/search')) {
                console.log('No longer on search page, stopping attempts');
                return;
            }
            
            // First, check if the "Results 1-10" text is present (indicating results are loaded)
            const resultsText = document.querySelector('div.mt-4.uppercase.text-xs.text-gray-500');
            if (!resultsText || !resultsText.textContent.includes('Results')) {
                console.log(`Attempt ${attempts}/${maxAttempts}: Results not fully loaded yet, waiting...`);
                if (attempts < maxAttempts) {
                    setTimeout(attemptClick, 1000);
                }
                return;
            }
            
            console.log('Results text found, looking for first result...');
            
            // Look for the first result with the specific structure
            const firstResult = document.querySelector('div.h-\\[110px\\] a[href^="/md5/"]');
            
            if (firstResult) {
                console.log(`Attempt ${attempts}/${maxAttempts}: Found first result with h-[110px] structure`);
            }
            
            if (firstResult) {
                console.log('Auto-clicking first Anna\'s Archive result:', firstResult.href);
                // Use a small delay to ensure the element is fully loaded
                setTimeout(() => {
                    firstResult.click();
                }, 100);
            } else if (attempts < maxAttempts) {
                console.log(`Attempt ${attempts}/${maxAttempts}: No results found yet, retrying...`);
                setTimeout(attemptClick, 1000);
            } else {
                console.log('Max attempts reached, could not find search results');
            }
        }
        
        // Also listen for DOM changes to catch dynamically loaded results
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if the results text was added
                    const hasResultsText = mutation.addedNodes.some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            return node.textContent && node.textContent.includes('Results 1-') ||
                                   node.querySelector && node.querySelector('div.mt-4.uppercase.text-xs.text-gray-500');
                        }
                        return false;
                    });
                    
                    if (hasResultsText) {
                        console.log('Results text detected via DOM observer, waiting a moment then attempting to click...');
                        setTimeout(clickFirstResult, 1000);
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Start attempting to click after initial delay
        setTimeout(attemptClick, 2000);
        return;
    }

    // Check if we're on Anna's Archive book page (md5 page)
    if (window.location.hostname === 'annas-archive.org' && window.location.pathname.includes('/md5/')) {
        // Don't run if download has already started
        if (window.downloadStarted) {
            console.log('Download already started, skipping book page automation');
            return;
        }
        
        function highlightOption3() {
            // Check if script is stopped
            if (window.stopAnnasArchiveScript) {
                console.log('Script stopped, not clicking Option #3');
                return;
            }

            // Look for the Option #3 link specifically
            const option3Link = document.querySelector('a.js-download-link[href*="/slow_download/"]');
            
            if (option3Link && option3Link.textContent.includes('Slow Partner Server #3')) {
                console.log('Found Option #3 link, clicking...');
                option3Link.click();
            } else {
                // Fallback: look for any link containing the text
                const option3Text = Array.from(document.querySelectorAll('a')).find(el => 
                    el.textContent && el.textContent.includes('Slow Partner Server #3')
                );
                
                if (option3Text) {
                    console.log('Found Option #3 link (fallback), clicking...');
                    option3Text.click();
                } else {
                    console.log('Option #3 link not found, retrying...');
                    setTimeout(highlightOption3, 1000);
                }
            }
        }

        function addBackButton() {
            // Create a back button
            const backButton = document.createElement('button');
            backButton.textContent = '← Back to Search Results';
            backButton.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 10000;
                background-color: #2ecc71;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: background-color 0.2s;
            `;
            
            backButton.addEventListener('mouseenter', () => {
                backButton.style.backgroundColor = '#27ae60';
            });
            
            backButton.addEventListener('mouseleave', () => {
                backButton.style.backgroundColor = '#2ecc71';
            });
            
            backButton.addEventListener('click', () => {
                window.history.back();
            });
            
            document.body.appendChild(backButton);
            console.log('Back button added');
        }

        // Run both functions when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(highlightOption3, 1000);
                setTimeout(addBackButton, 500);
            });
        } else {
            setTimeout(highlightOption3, 1000);
            setTimeout(addBackButton, 500);
        }
        
        return;
    }

    // Check if we're on Anna's Archive slow download page
    if (window.location.hostname === 'annas-archive.org' && window.location.pathname.includes('/slow_download/')) {
        // Don't run if download has already started
        if (window.downloadStarted) {
            console.log('Download already started, skipping slow download page automation');
            return;
        }
        
        function clickDownloadLink() {
            // Check if script is stopped
            if (window.stopAnnasArchiveScript) {
                console.log('Script stopped, not clicking download link');
                return;
            }

            // Look for the download link
            const downloadLink = document.querySelector('p.mb-4.text-xl.font-bold a[href*="https://"]');
            
            if (downloadLink && downloadLink.textContent.includes('Download now')) {
                console.log('Found download link, clicking...');
                window.downloadStarted = true; // Set flag to stop future script runs
                downloadLink.click();
            } else {
                // Fallback: look for any link containing "Download now"
                const downloadText = Array.from(document.querySelectorAll('a')).find(el => 
                    el.textContent && el.textContent.includes('Download now')
                );
                
                if (downloadText) {
                    console.log('Found download link (fallback), clicking...');
                    window.downloadStarted = true; // Set flag to stop future script runs
                    downloadText.click();
                } else {
                    console.log('Download link not found, retrying...');
                    setTimeout(clickDownloadLink, 1000);
                }
            }
        }

        // Run when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(clickDownloadLink, 1000);
            });
        } else {
            setTimeout(clickDownloadLink, 1000);
        }
        
        return;
    }

    // Wait for the page to load
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Extract book information from the page
    function getBookInfo() {
        const titleElement = document.querySelector('h1.Text__title1');
        const authorElement = document.querySelector('.ContributorLinksList .ContributorLink__name');
        
        let title = '';
        let author = '';
        
        if (titleElement) {
            title = titleElement.textContent.trim();
        }
        
        if (authorElement) {
            author = authorElement.textContent.trim();
        }
        
        return { title, author };
    }

    // Create the Anna's Archive link
    function createAnnasArchiveLink(bookInfo) {
        const searchQuery = encodeURIComponent(`${bookInfo.title} ${bookInfo.author}`);
        const annasArchiveUrl = `https://annas-archive.org/search?q=${searchQuery}`;
        
        const link = document.createElement('a');
        link.href = annasArchiveUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'Button Button--buy Button--medium Button--block';
        link.style.cssText = `
            /* Font & Text */
            font-family: Proxima Nova, Montserrat, Arial, sans-serif;
            font-size: 16px;
            font-style: normal;
            font-variant: normal;
            font-weight: 600;
            letter-spacing: normal;
            line-height: 23px;
            text-decoration: none;
            text-align: center;
            text-indent: 0px;
            text-transform: none;
            vertical-align: middle;
            white-space: normal;
            word-spacing: 0px;
            
            /* Color & Background */
            background-attachment: scroll;
            background-color: rgba(0, 0, 0, 0.005);
            background-image: none;
            background-position: 0% 0%;
            background-repeat: repeat;
            color: rgba(39, 28, 20, 0.88);
            
            /* Box */
            height: 44px;
            width: 100%;
            border: none;
            border-top: 2px solid rgb(64, 153, 112);
            border-right: 1px solid rgb(64, 153, 112);
            border-bottom: 2px solid rgb(64, 153, 112);
            border-left: 2px solid rgb(64, 153, 112);
            margin: 8px 0 0 0;
            padding: 0px 20px;
            max-height: none;
            min-height: auto;
            max-width: none;
            min-width: auto;
            
            /* Positioning */
            position: static;
            top: auto;
            bottom: auto;
            right: auto;
            left: auto;
            float: none;
            display: flex;
            clear: none;
            z-index: auto;
            
            /* List */
            list-style-image: none;
            list-style-type: disc;
            list-style-position: outside;
            
            /* Table */
            border-collapse: separate;
            border-spacing: 0px;
            caption-side: top;
            empty-cells: show;
            table-layout: auto;
            
            /* Miscellaneous */
            overflow: visible;
            cursor: pointer;
            visibility: visible;
            
            /* Effects */
            transform: none;
            transition: 0.2s ease-in-out;
            outline: none;
            outline-offset: 0px;
            box-sizing: border-box;
            resize: none;
            text-shadow: none;
            text-overflow: clip;
            word-wrap: normal;
            box-shadow: none;
            border-top-left-radius: 30px;
            border-top-right-radius: 30px;
            border-bottom-left-radius: 30px;
            border-bottom-right-radius: 30px;
        `;
        link.innerHTML = '🔍 Download on Anna\'s Archive';
        
        // Add hover effect to match Kindle Unlimited button
        link.addEventListener('mouseenter', () => {
            link.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.backgroundColor = 'rgba(0, 0, 0, 0.005)';
        });
        
        return link;
    }

    // Main function to add the link
    async function addAnnasArchiveLink() {
        try {
            // Wait for the book information to load
            await waitForElement('h1.Text__title1');
            
            // Get book information
            const bookInfo = getBookInfo();
            
            if (!bookInfo.title) {
                console.log('Could not extract book title');
                return;
            }
            
            // Look specifically for the Kindle Unlimited button group
            const kindleButtonGroup = document.querySelector('.ButtonGroup.ButtonGroup--block');
            
            if (kindleButtonGroup) {
                const annasArchiveLink = createAnnasArchiveLink(bookInfo);
                
                // Create a container for the Anna's Archive button to match the structure
                const container = document.createElement('div');
                container.className = 'Button__container Button__container--block';
                container.appendChild(annasArchiveLink);
                
                // Insert after the Kindle Unlimited button group
                kindleButtonGroup.parentNode.insertBefore(container, kindleButtonGroup.nextSibling);
                console.log('Anna\'s Archive link added successfully under Kindle Unlimited button');
            } else {
                console.log('Could not find Kindle Unlimited button group');
                
                // Fallback: look for other button containers
                const actionButtons = document.querySelector('.BookPageMetadataSection__buttons, .BookPageMetadataSection__actions');
                if (actionButtons) {
                    const annasArchiveLink = createAnnasArchiveLink(bookInfo);
                    actionButtons.appendChild(annasArchiveLink);
                    console.log('Anna\'s Archive link added to fallback location');
                } else {
                    console.log('Could not find suitable container for Anna\'s Archive link');
                }
            }
            
        } catch (error) {
            console.error('Error adding Anna\'s Archive link:', error);
        }
    }

    // Run the script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addAnnasArchiveLink);
    } else {
        addAnnasArchiveLink();
    }

    // Also run when navigating via AJAX (for single-page app behavior)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if we're still on a book page
                if (window.location.pathname.includes('/book/show/')) {
                    // Small delay to ensure new content is loaded
                    setTimeout(() => {
                        if (!document.querySelector('a[href*="annas-archive.org"]')) {
                            addAnnasArchiveLink();
                        }
                    }, 1000);
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})(); 