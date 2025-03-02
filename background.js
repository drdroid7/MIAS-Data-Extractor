console.log("Background script running.");

// Initialize IndexedDB
let db;
const DB_NAME = "BiochemicalDataDB";
const STORE_NAME = "patientRecords";

function initDB() {
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
            console.log("IndexedDB initialized successfully.");
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("Error opening IndexedDB:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Save patient data to IndexedDB
function savePatientData(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(data.PID);
        request.onsuccess = () => {
            const existingPatient = request.result;
            if (!existingPatient) {
                store.add({ ...data, Tests: [] });
                console.log("New patient data saved:", data);
            } else {
                console.log("Patient already exists:", data.PID);
            }
            resolve();
        };

        request.onerror = (event) => {
            console.error("Error saving patient data:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Save test data to IndexedDB
function saveTestData(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(data.PID);
        request.onsuccess = () => {
            const patient = request.result;
            if (patient) {
                patient.Tests.push({
                    TestName: data.TestName,
                    ResultValue: data.ResultValue,
                    ApprovedOn: data.ApprovedOn,
                });
                store.put(patient);
                console.log("Test data saved for patient:", data.PID);
            } else {
                console.error("Patient not found:", data.PID);
            }
            resolve();
        };

        request.onerror = (event) => {
            console.error("Error saving test data:", event.target.error);
            reject(event.target.error);
        };
    });
}

// Initialize DB and listen for messages
initDB().then(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Received message:", message);

        if (message.type === "savePatientData") {
            savePatientData(message.data)
                .then(() => {
                    console.log("Sending refreshViewData message...");
                    sendResponse({ status: "Patient data saved successfully" });
                    chrome.runtime.sendMessage({ type: "refreshViewData" });
                })
                .catch((error) => {
                    console.error("Error saving patient data:", error);
                    sendResponse({ status: "Error saving patient data", error });
                });
        }

        if (message.type === "saveTestData") {
            saveTestData(message.data)
                .then(() => {
                    console.log("Sending refreshViewData message...");
                    sendResponse({ status: "Test data saved successfully" });
                    chrome.runtime.sendMessage({ type: "refreshViewData" });
                })
                .catch((error) => {
                    console.error("Error saving test data:", error);
                    sendResponse({ status: "Error saving test data", error });
                });
        }

        return true; // Keep the message channel open for sendResponse
    });
});