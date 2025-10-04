// ======================= GLOBAL STATE & MAPPINGS =======================
let lastClickedRowIndex = -1; 

const TEST_ABBREVIATION_MAP = {
    // These keys are the full test names as scraped/fetched
    'Age': 'Age', 'Gender': 'Gender', 'Mobile': 'Mobile', 'Name': 'Name', 'PID': 'PID',
    'Electrolytes - Serum Bi-carbonate': 'B.CARB',
    'Electrolytes - Serum Chloride': 'CHLORIDE',
    'Electrolytes - Serum Potassium': 'POTASSIUM',
    'Electrolytes - Serum Sodium': 'SODIUM',
    'FBS - Fasting Blood Sugar': 'FBS',
    'Free T3, T4 & TSH - (F-T3) FREE TRIIODOTHYRONINE': 'FT3',
    'Free T3, T4 & TSH - (F-T4) FREE THYROXINE': 'FT4',
    'Free T3, T4 & TSH - (TSH)THYROID STIMULATING': 'TSH',
    'Glyco HB (HBA1C) - Glyco Hb (HBA1C)': 'HBA1C',
    'Lipid Profile - Cholesterol (Total)': 'T.CHOL',
    'Lipid Profile - HDL Cholesterol (Direct)': 'HDL',
    'Lipid Profile - LDL Cholesterol (Direct)': 'LDL',
    'Lipid Profile - Total Cholesterol /HDL Ratio': 'TCHOLDRATIO',
    'Lipid Profile - Triglycerides': 'TGL',
    'Lipid Profile - VLDL Cholesterol': 'VLDL',
    'Liver Function Test - ALKP': 'ALKP',
    'Liver Function Test - ALTV': 'ALTV',
    'Liver Function Test - AST': 'AST',
    'Liver Function Test - Albumin': 'ALB',
    'Liver Function Test - Direct Bilirubin': 'D.BIL',
    'Liver Function Test - Gamma-glutamy Transferase (GGT)': 'GGT',
    'Liver Function Test - Total Bilirubin': 'T.BIL',
    'Liver Function Test - Total Protein': 'T.PRO',
    'PPBS - Post Prandial Blood Sugar': 'PPBS',
    'RBS - Random Blood Sugar': 'RBS',
    'RENAL FUNCTION TEST (RFT) - Creatinine': 'CREA',
    'RENAL FUNCTION TEST (RFT) - Urea': 'UREA',
    'RENAL FUNCTION TEST (RFT) - Uric acid': 'U.ACID',
    'Serum Calcium - Serum Calcium': 'CALCIUM'
};

// --- NEW CONSTANT: Message Types (for clarity and cross-script communication) ---
const MESSAGE_TYPES = {
    extractTest: 'extractTestData',
    savePatient: 'savePatientData',
    saveTest: 'saveTestData',
    showToastNotification: 'showToast' 
};
// -------------------------------------------------------------------------------


// background.js - FINAL ADAPTED CODE (Unified Data Layer and Pivoted CSV)

console.log("Background script running. Using native IndexedDB.");

// ====================== IndexedDB Constants and Setup ======================

const DB_NAME = 'BiochemicalDataDB';
const DB_VERSION = 1;
const STORE_NAME = 'patientRecords'; 

function openDB() {
    return new Promise((resolve, reject) => {
        // Use self.indexedDB in Service Workers
        const indexedDB = self.indexedDB; 
        
        if (!indexedDB) { return reject(new Error("IndexedDB is not supported in this environment.")); }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Ensure PID is the key path for unique records
                db.createObjectStore(STORE_NAME, { keyPath: 'PID' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject(event.target.error);
        };
    });
}


// ====================== Storage Helpers ======================

async function getPatientRecords() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result || []);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function getPatientRecord(pid) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(pid); 

        request.onsuccess = (event) => resolve(event.target.result || null);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function savePatientRecord(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.put(record);

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
}

// ====================== Message Sender Helper ======================
async function broadcastDataUpdate(type = "dataUpdated") {
    console.log(`Broadcasting message: ${type}`);
    
    // Broadcast to the popup (using runtime.sendMessage)
    try {
        await chrome.runtime.sendMessage({ type: type }).catch(e => {
            if (!e.message.includes("Could not establish connection")) {
                console.warn("Popup message error:", e);
            }
        });
    } catch (e) {
        console.warn("General Popup message error:", e);
    }

    // Broadcast to view.html tabs (using tabs.sendMessage)
    const viewPageUrl = chrome.runtime.getURL('view.html');
    
    chrome.tabs.query({}, (tabs) => {
        const viewTabs = tabs.filter(t => t.url === viewPageUrl);
        
        viewTabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, { type: type }).catch(() => {});
            } catch (e) {
                console.warn(`Error dispatching message to view.html tab ${tab.id}:`, e);
            }
        });
    });
}

// ====================== CSV Generation Logic (PIVOTED IMPLEMENTATION) ======================

function escapeCSV(value) {
    if (value === null || typeof value === 'undefined') return '';
    let str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converts patient records into a pivoted CSV format.
 * Dynamically determines test columns based on tests actually present in the data.
 * @param {Array<Object>} patientRecords 
 * @returns {string | null} CSV content string or null if no data.
 */
function convertRecordsToCSV(patientRecords) {
    if (!patientRecords || patientRecords.length === 0) return null;

    // --- 1. Define Fixed Headers (Demographics) AND Determine Dynamic Test Headers ---
    
    const demographicHeaders = ["Age", "Gender", "Mobile", "Name", "PID"]; 
    const uniqueTestAbbreviations = new Set();
    
    // Step 1a: Collect all unique, abbreviated test names present in the data
    patientRecords.forEach(patient => {
        if (patient.Tests) {
            patient.Tests.forEach(test => {
                const abbreviatedName = TEST_ABBREVIATION_MAP[test.TestName];
                // Only consider abbreviations found in the map and are not demographics
                if (abbreviatedName && !demographicHeaders.includes(abbreviatedName)) {
                    uniqueTestAbbreviations.add(abbreviatedName);
                }
            });
        }
    });

    // Step 1b: Determine the order of dynamic test headers
    // Iterate over the full map to maintain the original defined order, but only include found tests
    const orderedTestAbbreviations = Object.entries(TEST_ABBREVIATION_MAP)
        .map(([fullName, abbreviation]) => abbreviation)
        .filter(abbreviation => uniqueTestAbbreviations.has(abbreviation));

    // Step 1c: Combine fixed and dynamic headers
    const headers = [...demographicHeaders, ...orderedTestAbbreviations];
    let csvContent = headers.map(escapeCSV).join(',') + '\n';

    // --- 2. Iterate and Pivot Data ---
    patientRecords.forEach(patient => {
        // Map test results by their ABBREVIATED name for quick lookup
        const resultsMap = {};
        if (patient.Tests) {
            patient.Tests.forEach(test => {
                const abbreviatedName = TEST_ABBREVIATION_MAP[test.TestName];
                if (abbreviatedName) {
                    // Store the result value under the abbreviated name
                    resultsMap[abbreviatedName] = test.ResultValue;
                }
            });
        }

        const rowData = [];

        // Add Demographic data (using patient properties directly)
        demographicHeaders.forEach(header => {
             // Use the property value, defaulting to empty string
             rowData.push(patient[header] || '');
        });
        
        // Add Test data (Pivoted) using only the dynamically generated headers
        orderedTestAbbreviations.forEach(abbreviatedName => {
            // Retrieve result from the map, or push empty string if not found for this patient
            rowData.push(resultsMap[abbreviatedName] || '');
        });

        csvContent += rowData.map(escapeCSV).join(',') + '\n';
    });

    return csvContent;
}


// ====================== Listeners ======================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // This listener helps content.js run on page loads after extension installation
    if (changeInfo.status === "complete" && tab && tab.url) {
        const urlPrefix = "https://mias.smc.saveetha.com/Casesheet/Casesheetview.aspx?id=";
        if (tab.url.startsWith(urlPrefix)) {
            chrome.tabs.sendMessage(tabId, { type: "newTabLoaded" }).catch(() => {});
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);

    const isAsync = true; 

    (async () => {
        try {
            // --- 1. SAVE Patient Data from Content Script ---
            if (message.type === MESSAGE_TYPES.savePatient) {
                const incomingData = message.data;
                const existingPatient = await getPatientRecord(incomingData.PID);
                
                // Remove unwanted fields from incoming data before merging/saving
                const { ShortPID, City, Address, Pincode, Insurance, ...cleanIncomingData } = incomingData;
                
                let recordToSave;

                if (!existingPatient) {
                    recordToSave = { ...cleanIncomingData, Tests: [] };
                } else {
                    // Merge clean incoming data with existing record, keeping existing Tests
                    recordToSave = { ...existingPatient, ...cleanIncomingData, Tests: existingPatient.Tests };
                }
                
                await savePatientRecord(recordToSave);
                // NOTE: Success toast logic removed here (moved to saveTest)
                sendResponse({ status: "Patient data saved successfully" });
                broadcastDataUpdate();
            }

            // --- 2. SAVE Test Data from Content Script ---
            else if (message.type === MESSAGE_TYPES.saveTest) {
                const incomingData = message.data;
                const existingPatient = await getPatientRecord(incomingData.PID);

                if (existingPatient) {
                    if (!existingPatient.Tests) existingPatient.Tests = []; 
                    
                    // CRITICAL: Updated duplication check (Name + Result + Date)
                    const isDuplicate = existingPatient.Tests.some(test => 
                        test.TestName === incomingData.TestName && 
                        test.ResultValue === incomingData.ResultValue &&
                        test.ApprovedOn === incomingData.ApprovedOn
                    );
                    
                    if (!isDuplicate) {
                        existingPatient.Tests.push({
                            TestName: incomingData.TestName,
                            ResultValue: incomingData.ResultValue,
                            ApprovedOn: incomingData.ApprovedOn
                        });
                        
                        await savePatientRecord(existingPatient); 
                        
                        // --- SEND SINGLE TOAST: SUCCESS ---
                        chrome.tabs.sendMessage(sender.tab.id, { 
                            type: MESSAGE_TYPES.showToastNotification,
                            message: "Extraction complete",
                            toastType: "success"
                        }).catch(e => {
                             // Ignore connection errors if tab closes immediately
                             if (!e.message.includes("Could not establish connection")) {
                                 console.warn("Could not send toast message to content script:", e);
                             }
                        });
                        // --- END SEND SINGLE TOAST ---
                        
                        sendResponse({ status: "Test data saved successfully" });
                        broadcastDataUpdate();
                    } else {
                        // --- FIX: Send explicit WARNING toast message for duplicate ---
                        chrome.tabs.sendMessage(sender.tab.id, { 
                            type: MESSAGE_TYPES.showToastNotification,
                            message: "Duplicate Entry",
                            toastType: "warning" // Triggers the yellow style
                        }).catch(e => {
                            if (!e.message.includes("Could not establish connection")) {
                                console.warn("Could not send duplicate toast message to content script:", e);
                            }
                        });
                        // --- END FIX ---
                        
                        sendResponse({ status: "Test data is a duplicate and was not saved." });
                    }
                } else {
                    sendResponse({ status: "Error: Patient not found. Run Patient Extraction first.", error: true });
                }
            }
            
            // --- 3. GET Data from Popup/View ---
            else if (message.type === "getPatientRecords") {
                const patientRecords = await getPatientRecords();
                sendResponse({ records: patientRecords });
            }

            // --- 4. CLEAR Data from Popup/View ---
            else if (message.type === "clearData") { 
                const db = await openDB();
                const request = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME).clear();

                request.onsuccess = () => {
                    sendResponse({ status: "All data cleared" });
                    broadcastDataUpdate();
                };
                request.onerror = (e) => {
                    sendResponse({ status: "Error clearing data", error: e.target.error.name });
                };
            }

            // --- 5. DELETE Individual Record from View (Delete Patient) ---
            else if (message.type === "deleteRecord") {
                const { pid } = message.data; 
                
                if (pid) {
                    const db = await openDB();
                    const request = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME).delete(pid); 

                    request.onsuccess = () => {
                        sendResponse({ status: "Record deleted successfully" });
                        broadcastDataUpdate();
                    };
                    request.onerror = (e) => {
                        sendResponse({ status: "Error deleting record", error: e.target.error.name });
                    };
                } else {
                    sendResponse({ status: "Error: PID not provided for deletion.", error: true });
                }
            }

            // --- 6. DELETE Individual TEST from View ---
            else if (message.type === "deleteTest") {
                const { pid, index } = message.data;
                const existingPatient = await getPatientRecord(pid);

                if (!existingPatient) {
                    return sendResponse({ status: "Error: Patient not found for test deletion.", error: true });
                }

                if (!existingPatient.Tests || index < 0 || index >= existingPatient.Tests.length) {
                    return sendResponse({ status: "Error: Test index out of bounds.", error: true });
                }

                existingPatient.Tests.splice(index, 1);
                
                let actionRequest;
                const db = await openDB();
                const store = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);

                if (existingPatient.Tests.length === 0) {
                    actionRequest = store.delete(pid);
                } else {
                    actionRequest = store.put(existingPatient);
                }
                
                actionRequest.onsuccess = () => {
                    sendResponse({ status: "Test deleted successfully" });
                    broadcastDataUpdate();
                };
                actionRequest.onerror = (e) => {
                    sendResponse({ status: "Error saving record after test deletion", error: e.target.error.name });
                };
            }

            // --- 7. GENERATE REPORT (Full CSV generation logic - PIVOTED) ---
            else if (message.type === "generateReport") {
                const patientRecords = await getPatientRecords();

                if (patientRecords.length === 0) {
                    sendResponse({ status: "No data found" });
                    return;
                }
                
                // Uses the new PIVOTED conversion function
                const csvContent = convertRecordsToCSV(patientRecords);

                if (!csvContent) {
                    sendResponse({ status: "Error: Failed to convert data to CSV." });
                    return;
                }
                
                // >>> CRITICAL FIX: Check if the downloads API is available before calling it <<<
                if (chrome.downloads && chrome.downloads.download) {
                    const date = new Date().toISOString().slice(0, 10);
                    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

                    // Start the download (fire and forget)
                    chrome.downloads.download({
                        url: dataUrl,
                        filename: `Patient_Biochemical_Report_${date}.csv`,
                        saveAs: true 
                    }, (downloadId) => {
                        if (chrome.runtime.lastError) {
                            console.error("Download Initiation Failed:", chrome.runtime.lastError.message);
                        }
                    });

                    // Send immediate success status to the front-end (popup/view)
                    sendResponse({ status: "Report download initiated successfully" });
                } else {
                    // Provide a detailed error if the API is missing, preventing a crash
                    console.error("Critical Error: 'downloads' API is unavailable. Check manifest permissions and extension environment.");
                    sendResponse({ status: "Error: Download API unavailable. Please check extension permissions and console for details." });
                }
                
                return isAsync;
            }


        } catch (error) {
            console.error("Catastrophic Error in background message handler:", error);
            sendResponse({ status: "Internal Error", error: error.message || "Unknown catastrophic error." });
        }

    })();

    return isAsync; 
});