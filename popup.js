document.addEventListener('DOMContentLoaded', async () => {
    console.log("Popup loaded");

    // Initialize IndexedDB
    let db;
    const DB_NAME = "BiochemicalDataDB";
    const STORE_NAME = "patientRecords";

    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "PID" });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                console.error("Error opening IndexedDB:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Get all patient records from IndexedDB
    async function getAllPatientRecords() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Clear all data from IndexedDB
    async function clearData() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // Update UI with patient count
    async function updatePatientCount() {
        const patientRecords = await getAllPatientRecords();
        const patientCountElement = document.getElementById('patientCount');
        if (patientCountElement) {
            patientCountElement.textContent = `Patients: ${patientRecords.length}`;
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
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = type;
        }
    }

    // Combine patient and test data for Excel export
    function combinePatientAndTestData(patientData, testData) {
        return patientData.flatMap(patient => {
            const tests = testData.filter(test => test.PID === patient.PID);
            return tests.length ? tests.map(test => ({ ...patient, ...test })) : [patient];
        });
    }

    // Export data to Excel
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

    // Inject buttons into the webpage
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

            setStatus(`${type === "extractData" ? "Patient" : "Test"} data extracted successfully!`, "success");

            if (type === "extractData") await updatePatientCount();
            await updateStatusMessage();
        } catch (error) {
            console.error("Extraction failed:", error);
            setStatus(`Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    // Initialize DB and load data
    await initDB();
    await updatePatientCount();

    // Get UI elements
    const extractPatientDataBtn = document.getElementById('extractPatientData');
    const extractTestDataBtn = document.getElementById('extractTestData');
    const generateExcelBtn = document.getElementById('generateExcel');
    const clearDataBtn = document.getElementById('clearData');
    const viewDataBtn = document.getElementById('viewData');

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
            const patientRecords = await getAllPatientRecords();
            if (!patientRecords.length) throw new Error("No data to export");

            await exportToExcel(patientRecords);
            setStatus("Excel file downloaded successfully!", "success");
        } catch (error) {
            console.error("Export failed:", error);
            setStatus(`Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    });

    // Clear stored data
    clearDataBtn.addEventListener('click', async () => {
        console.log("Clear Data button clicked");
        setLoading(true, "Clearing data...");

        try {
            await clearData();
            setStatus("Data cleared successfully!", "success");
            await updatePatientCount();
        } catch (error) {
            console.error("Clear failed:", error);
            setStatus(`Error: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    });

    // View Data button
    if (viewDataBtn) {
        viewDataBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("view.html") });
        });
    }
});