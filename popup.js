document.addEventListener('DOMContentLoaded', async () => {
    console.log("Popup loaded");

    // Function to show dark-themed toast notifications
    function showToast(message, type = "info") {
        console.log(`Showing toast: ${message}`);
        const toast = document.createElement('div');
        
        // Create icon element
        const icon = document.createElement('span');
        icon.textContent = type === "error" ? '❌' : type === "success" ? '✅' : 'ℹ️';
        icon.style.marginRight = '8px';
        
        // Create message element
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        // Append icon and message to toast
        toast.appendChild(icon);
        toast.appendChild(messageSpan);

        // Toast styling
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = type === "error" ? '#d32f2f' : type === "success" ? '#388e3c' : '#323232';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '12px';
        toast.style.fontFamily = '"Segoe UI", Arial, sans-serif';
        toast.style.fontSize = '14px';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        toast.style.zIndex = '10000';
        toast.style.opacity = '0';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        
        // Animation for sliding in from top
        toast.style.transition = 'all 0.3s ease-in-out';
        toast.style.transform = 'translate(-50%, -20px)'; // Start slightly above

        document.body.appendChild(toast);

        // Fade in and slide down
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, 0)';
        }, 10);

        // Auto-remove after 2 seconds with fade out and slide up
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -20px)';
            setTimeout(() => {
                toast.remove();
            }, 300); // Matches transition duration (0.3s = 300ms)
        }, 2000); // Reduced to 2 seconds
    }

    // Get UI elements first
    const extractPatientDataBtn = document.getElementById('extractPatientData');
    const extractTestDataBtn = document.getElementById('extractTestData');
    const generateExcelBtn = document.getElementById('generateExcel');
    const clearDataBtn = document.getElementById('clearData');
    const statusDiv = document.getElementById('status');
    const patientCountElement = document.getElementById('patientCount');
    const viewDataBtn = document.getElementById("viewData");

    // Clear stored data & update live page
    clearDataBtn.addEventListener('click', async () => {
        console.log("Clear Data button clicked");
        setLoading(true, "Clearing data...");

        try {
            // Remove stored data
            await chrome.storage.local.remove(['patientData', 'testData', 'patientRecords']);
            console.log("Data cleared from Chrome Storage");

            // Send message to `view.html` to refresh the table
            chrome.runtime.sendMessage({ type: "refreshViewData" });

            // Send message to clear live page data
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                await chrome.tabs.sendMessage(tab.id, { type: "clearLiveData" });
            }

            showToast("Data cleared successfully!", "success");
            await updateStatusMessage();
            await updatePatientCount();
        } catch (error) {
            console.error("Clear failed:", error);
            showToast(`Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    });

    // Initialize View Data button
    if (viewDataBtn) {
        viewDataBtn.addEventListener("click", () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("view.html") });
        });
        console.log("View Data button initialized.");
    } else {
        console.error("View Data button not found in popup.html!");
    }

    // Inject buttons into the webpage
    injectButtonsIntoPage();

    // Ensure all async functions execute properly
    await updateStatusMessage();
    await updatePatientCount();

    // Extract patient data
    extractPatientDataBtn.addEventListener('click', async () => {
        console.log("Extract Patient Data button clicked");
        await executeContentScriptAndExtract("extractData");
    });

    // Extract test data
    extractTestDataBtn.addEventListener('click', async () => {
        console.log("Extract Test Data button clicked");
        await executeContentScriptAndExtract("extractTestData");
    });

    // Generate Excel file
    generateExcelBtn.addEventListener('click', async () => {
        console.log("Generate Excel button clicked");
        setLoading(true, "Generating Excel file...");

        try {
            const storedData = await chrome.storage.local.get(['patientData', 'testData']);
            const patientData = storedData.patientData || [];
            const testData = storedData.testData || [];
            const combinedData = combinePatientAndTestData(patientData, testData);

            if (!combinedData.length) throw new Error("No data to export");

            await exportToExcel(combinedData);
            showToast("Excel file downloaded successfully!", "success");
        } catch (error) {
            console.error("Export failed:", error);
            showToast(`Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    });

    // Inject buttons into the page
    function injectButtonsIntoPage() {
        console.log("Injecting buttons into the webpage...");

        const patientDataSelector = document.querySelector("#dvmainbarsub > div > div.widget.wgreen > div.widget-head > div.widget-icons > div > h4");
        if (patientDataSelector && !document.getElementById("customExtractPatientData")) {
            const patientButton = createButton("customExtractPatientData", "Extract Patient Data", "#6366f1", () => executeContentScriptAndExtract("extractData"));
            patientDataSelector.appendChild(patientButton);
        }

        const testDataSelector = document.querySelector("#mdlviewlabtest > div > div > div.modal-body");
        if (testDataSelector && !document.getElementById("customExtractTestData")) {
            const testButton = createButton("customExtractTestData", "Extract Test Data", "#3b82f6", () => executeContentScriptAndExtract("extractTestData"));
            testDataSelector.appendChild(testButton);
        }
    }

    // Create a button dynamically
    function createButton(id, text, color, clickHandler) {
        const button = document.createElement("button");
        button.id = id;
        button.textContent = text;
        button.style.cssText = `margin: 10px; padding: 5px 10px; background: ${color}; color: white; border: none; border-radius: 5px; cursor: pointer;`;
        button.addEventListener("click", clickHandler);
        return button;
    }

    // Execute content script and extract data
    async function executeContentScriptAndExtract(type) {
        setLoading(true, `Extracting ${type === "extractData" ? "patient" : "test"} data...`);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error("No active tab found");

            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

            const response = await chrome.tabs.sendMessage(tab.id, { type });
            if (response?.error) throw new Error(response.error);

            showToast(`${type === "extractData" ? "Patient" : "Test"} data extracted successfully!`, "success");

            if (type === "extractData") await updatePatientCount();
            await updateStatusMessage();
        } catch (error) {
            console.error("Extraction failed:", error);
            showToast(`Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    // Combine patient and test data
    function combinePatientAndTestData(patientData, testData) {
        return patientData.flatMap(patient => {
            const tests = testData.filter(test => test.PID === patient.PID);
            return tests.length ? tests.map(test => ({ ...patient, ...test })) : [patient];
        });
    }

    // Update patient count
    async function updatePatientCount() {
        const storedData = await chrome.storage.local.get('patientData');
        const patientData = storedData.patientData || [];
        if (patientCountElement) {
            patientCountElement.textContent = `Number of Patients: ${patientData.length}`;
        } else {
            console.warn("patientCountElement not found in DOM.");
        }
    }

    // Update status message
    async function updateStatusMessage() {
        const storedData = await chrome.storage.local.get(['patientData', 'testData']);
        const patientData = storedData.patientData || [];
        const testData = storedData.testData || [];

        if (patientData.length && testData.length) {
            setStatus("Full data extracted and available.", "success");
        } else if (patientData.length) {
            setStatus("Patient data extracted, test data missing.", "warning");
        } else if (testData.length) {
            setStatus("Test data extracted, patient data missing.", "warning");
        } else {
            setStatus("No data extracted yet.", "info");
        }
    }

    // Set loading state
    function setLoading(isLoading, message = "") {
        extractPatientDataBtn.disabled = isLoading;
        extractTestDataBtn.disabled = isLoading;
        generateExcelBtn.disabled = isLoading;
        clearDataBtn.disabled = isLoading;
        if (message) setStatus(message, "loading");
    }

    // Set status message
    function setStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
    }

    // Export to Excel
    async function exportToExcel(data) {
        if (typeof XLSX === 'undefined') {
            console.error("XLSX library is not loaded.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `PatientData_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);
    }
});