// popup.js - FINAL WORKING CODE

// Use a flag to ensure the script's initialization logic runs only once.
if (window.popupListenersInitialized) {
    console.log("Popup listeners already initialized. Skipping setup.");
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Popup loaded");

    // --- Extension URL Constant ---
    // FIX: Using chrome.runtime.getURL() makes the code portable, as the extension ID 
    // is now dynamically retrieved.
    const EXTENSION_VIEW_URL = chrome.runtime.getURL("view.html");
    // Define the specific host domain where content script actions are meaningful
    const TARGET_HOST = "mias.smc.saveetha.com";

    // --- Helper Functions ---
    
    /**
     * Shows a modern, elegant toast notification sliding up from the bottom.
     * The animation uses a cubic-bezier function for a subtle bounce effect.
     */
    function showToast(message, type = "info") {
        console.log(`Showing toast: ${message}`);
        
        // Configuration for modern, subtle colors
        const typeConfig = {
            success: { bg: '#10b981', icon: '✓', color: '#fff' }, // Emerald 500
            error: { bg: '#ef4444', icon: '!', color: '#fff' },   // Red 500
            info: { bg: '#3b82f6', icon: 'i', color: '#fff' }    // Blue 500
        };

        const config = typeConfig[type] || typeConfig.info;

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translate(-50%, 50px); /* Start off-screen below */
            background-color: ${config.bg};
            color: ${config.color};
            padding: 12px 20px;
            border-radius: 10px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
            z-index: 10000;
            opacity: 0;
            display: flex;
            align-items: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Modern bounce/ease-out effect */
            min-width: 250px;
            max-width: 90%;
        `;
        
        toast.innerHTML = `
            <span style="font-weight: 700; margin-right: 10px; font-size: 1.2em;">${config.icon}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);

        // Slide in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, 0)';
        }, 10);

        // Slide out
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, 50px)';
            setTimeout(() => {
                toast.remove();
            }, 400); // Wait for transition to finish
        }, 3000); // Display for 3 seconds
    }

    async function getCurrentTab() {
        // Find the active tab in the current window.
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // FIX: Return null instead of throwing an error on internal/restricted Chrome pages
        if (!tab || !tab.id || tab.url.startsWith('chrome://')) {
            return null; 
        }
        return tab;
    }
    
    // Get UI elements (Only management buttons remain)
    const generateExcelBtn = document.getElementById('generateExcel'); 
    const clearDataBtn = document.getElementById('clearData');
    const statusDiv = document.getElementById('status');
    const patientCountElement = document.getElementById('patientCount');
    const viewDataBtn = document.getElementById("viewData");


    // --- Core Logic Functions ---

    async function isTargetPage(tab) {
        // Check if the tab URL starts with http(s) and contains the target domain
        return tab.url.startsWith("http") && tab.url.includes(TARGET_HOST);
    }

    // Helper to generate the status HTML with the colored dot
    function getStatusHtml(message, isReady) {
        const color = isReady ? '#10b981' : '#ef4444'; // Green or Red
        const dotHtml = `<span style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 6px;"></span>`;
        return `${dotHtml}${message}`;
    }

    async function updateStatusMessage() {
        // Direct call to the background service worker
        const response = await chrome.runtime.sendMessage({ type: "getPatientRecords" });
        const patientRecords = response.records || [];
        
        const totalTests = patientRecords.reduce((acc, p) => acc + (p.Tests ? p.Tests.length : 0), 0);

        // The logic below defines the text and the class name for the status bar.
        // The visual indicator (light) is powered by the class name applied here.

        if (patientRecords.length && totalTests) {
            setStatus("Ready", "ready"); // Data exists and looks complete
        } else if (patientRecords.length) {
            setStatus("Ready", "ready"); // Data exists, even if incomplete (still functional)
        } else {
            setStatus("Ready", "ready"); // No data yet, but extension is ready to work.
        }
    }

    async function updatePatientCount() {
        // Direct call to the background service worker
        const response = await chrome.runtime.sendMessage({ type: "getPatientRecords" });
        const patientData = response.records || [];
        
        if (patientCountElement) {
            // Updated to be concise: P: Count
            patientCountElement.textContent = `P: ${patientData.length}`; 
        }
    }

    function setLoading(isLoading, message = "") {
        // Disable/enable buttons based on loading state
        if(generateExcelBtn) generateExcelBtn.disabled = isLoading;
        if(clearDataBtn) clearDataBtn.disabled = isLoading;
        if(viewDataBtn) viewDataBtn.disabled = isLoading;
        
        // Update status bar text during loading or error conditions
        if (message.includes("Error") || message.includes("Failed")) {
            setStatus("Not Ready", "not-ready");
        } else if (isLoading) {
            setStatus("Checking...", "loading");
        } else {
            // Restore actual status after loading finishes
            if (statusDiv.textContent === "Checking...") {
                setStatus("Ready", "ready"); 
            }
        }
    }

    function setStatus(message, type) {
        if(statusDiv) {
            // Determine if the status should be considered "Ready" (Green dot)
            const isReady = (type === "ready" || type === "success" || type === "loading");

            // 1. Set the inner HTML with the dot and text
            statusDiv.innerHTML = getStatusHtml(message, isReady);
            
            // 2. Set the class name for the HTML styling (if needed, e.g., pulse animation)
            statusDiv.className = isReady ? "ready" : "not-ready";
        }
    }

    // --- Event Listeners (Attach only if not initialized) ---

    if (!window.popupListenersInitialized) {

        // 1. Clear Data Button (Direct message to background script)
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', async () => {
                console.log("Clear Data button clicked");
                setLoading(true, "Clearing data...");

                try {
                    // Use chrome.runtime.sendMessage for background commands like clearing data
                    const response = await chrome.runtime.sendMessage({ type: "clearData" }); 
                    
                    if (response && response.status === "All data cleared") {
                        showToast("All data cleared successfully!", "success");
                    } else if (response) {
                        throw new Error(response.status || "Unknown error during clear.");
                    } else {
                        throw new Error("Background script did not respond to clearData.");
                    }
                    
                } catch (error) {
                    console.error("Clear failed:", error);
                    showToast(`Error: ${error.message}`, "error"); 
                } finally {
                    await updateStatusMessage();
                    await updatePatientCount();
                    setLoading(false);
                }
            });
        }

        // 2. Initialize View Data button
        if (viewDataBtn) {
            viewDataBtn.addEventListener("click", () => {
                chrome.tabs.create({ url: EXTENSION_VIEW_URL });
            });
        }

        // 3. Generate Excel file (Direct message to background script)
        if(generateExcelBtn) {
            generateExcelBtn.addEventListener('click', async () => {
                setLoading(true, "Generating CSV Report...");
                
                try {
                    // Send message to background script (generate report usually runs in background)
                    const response = await chrome.runtime.sendMessage({ type: "generateReport" });
                    
                    if (response?.status) {
                        showToast(response.status, response.status.includes("successfully") ? "success" : "error");
                    }
                } catch (error) {
                    showToast(`Export Error: ${error.message}`, "error");
                } finally {
                    setLoading(false);
                }
            });
        }
        
        // 4. Listener for data changes (broadcast from background.js)
        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
            if (request.type === "dataUpdated") {
                console.log("Popup received data update broadcast. Refreshing UI.");
                await updateStatusMessage();
                await updatePatientCount();
            }
        });

        window.popupListenersInitialized = true; // Set flag after listeners are attached
    }
    
    // --- Initial Load Setup (Always runs to update status) ---

    // Initial load of UI status
    await updateStatusMessage();
    await updatePatientCount();
    
    // Check page status for informative feedback
    try {
        const tab = await getCurrentTab();
        
        // Handle case where we are on a restricted Chrome page
        if (tab === null) {
            setStatus("Not Ready", "not-ready");
            // Disable management buttons since content script cannot be injected here
            if(generateExcelBtn) generateExcelBtn.disabled = true;
            if(clearDataBtn) clearDataBtn.disabled = true;
            return; 
        }

        const isMiasPage = await isTargetPage(tab);
        const isViewPage = tab.url.startsWith(EXTENSION_VIEW_URL);

        // If not on an extraction page, indicate the limits, but keep data buttons active
        if (!isMiasPage && !isViewPage) {
            // Set Ready status based on data check (from updateStatusMessage, which already ran)
        }
        
        // If on the View Page, ensure all buttons are active
        if (isViewPage) {
            setStatus("Ready", "ready");
            if(generateExcelBtn) generateExcelBtn.disabled = false;
            if(clearDataBtn) clearDataBtn.disabled = false;
        }
        
    } catch(e) {
        console.warn("Could not check current tab status (Unexpected Error): ", e.message);
        setStatus("Not Ready", "not-ready");
    }
});
