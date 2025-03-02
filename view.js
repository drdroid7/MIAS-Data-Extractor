document.addEventListener("DOMContentLoaded", async function () {
    console.log("Initializing view page...");

    let db;
    const DB_NAME = "BiochemicalDataDB";
    const STORE_NAME = "patientRecords";
    let sortDescending = true; // Default: Newest entries first

    // Initialize IndexedDB
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
                console.log("IndexedDB initialized successfully.");
                resolve(db);
            };

            request.onerror = (event) => {
                console.error("Error opening IndexedDB:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Load patient data from IndexedDB
    async function loadPatientData() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const patientRecords = request.result;
                console.log("Retrieved patient records from IndexedDB:", patientRecords);
                resolve(patientRecords);
            };

            request.onerror = (event) => {
                console.error("Error loading patient data:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Render table with patient data
    function renderTable(patientRecords) {
        const tableBody = document.getElementById("dataBody");
        tableBody.innerHTML = "";

        if (patientRecords.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7">No data available</td></tr>`;
            return;
        }

        let allRows = [];
        patientRecords.forEach((patient, patientIndex) => {
            if (patient.Tests.length === 0) {
                // Display patient even if no tests are available
                allRows.push({
                    entryIndex: allRows.length,
                    PID: patient.PID,
                    Name: patient.Name,
                    TestName: "-",
                    ResultValue: "-",
                    ApprovedOn: "-",
                    patientIndex,
                    testIndex: null,
                    isPatientRow: true, // Mark as a patient-only row
                });
            } else {
                // Add test records under the same patient
                patient.Tests.forEach((test, testIndex) => {
                    allRows.push({
                        entryIndex: allRows.length,
                        PID: patient.PID,
                        Name: patient.Name,
                        TestName: test.TestName,
                        ResultValue: test.ResultValue,
                        ApprovedOn: test.ApprovedOn || "-",
                        patientIndex,
                        testIndex,
                        isPatientRow: false,
                    });
                });
            }
        });

        // Sort records (default: newest first)
        allRows.sort((a, b) => (sortDescending ? b.entryIndex - a.entryIndex : a.entryIndex - b.entryIndex));
        console.log("Sorted records:", allRows);

        allRows.forEach((entry, index) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.PID}</td>
                <td>${entry.Name}</td>
                <td>${entry.TestName}</td>
                <td>${entry.ResultValue}</td>
                <td>${entry.ApprovedOn}</td>
                <td>
                    ${
                        entry.isPatientRow
                            ? `<button class="delete-patient-btn" data-patient="${entry.patientIndex}" title="Delete Patient">🗑️</button>`
                            : `<button class="delete-btn" data-patient="${entry.patientIndex}" data-test="${entry.testIndex}" title="Delete Test">🗑️</button>`
                    }
                </td>
            `;
        });

        // Attach delete event for test rows
        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const patientIndex = parseInt(this.getAttribute("data-patient"));
                const testIndex = parseInt(this.getAttribute("data-test"));

                console.log(`Delete test clicked - Patient Index: ${patientIndex}, Test Index: ${testIndex}`);
                deleteTestRecord(patientIndex, testIndex);
            });
        });

        // Attach delete event for patient-only rows
        document.querySelectorAll(".delete-patient-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const patientIndex = parseInt(this.getAttribute("data-patient"));

                console.log(`Delete patient clicked - Patient Index: ${patientIndex}`);
                deletePatientRecord(patientIndex);
            });
        });
    }

    // Delete a test record
    async function deleteTestRecord(patientIndex, testIndex) {
        console.log(`Deleting test record - Patient Index: ${patientIndex}, Test Index: ${testIndex}`);

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const patientRecords = request.result;
            if (patientRecords[patientIndex]) {
                patientRecords[patientIndex].Tests.splice(testIndex, 1);

                // Remove patient if no tests remain
                if (patientRecords[patientIndex].Tests.length === 0) {
                    patientRecords.splice(patientIndex, 1);
                }

                console.log("Updated patient records after test deletion:", patientRecords);
                const updateRequest = store.clear();
                updateRequest.onsuccess = () => {
                    patientRecords.forEach((patient) => store.add(patient));
                    loadPatientData().then(renderTable);
                };
            }
        };

        request.onerror = (event) => {
            console.error("Error deleting test record:", event.target.error);
        };
    }

    // Delete a patient record
    async function deletePatientRecord(patientIndex) {
        console.log(`Deleting patient record - Patient Index: ${patientIndex}`);

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const patientRecords = request.result;
            if (patientRecords[patientIndex]) {
                patientRecords.splice(patientIndex, 1); // Remove patient completely

                console.log("Updated patient records after patient deletion:", patientRecords);
                const updateRequest = store.clear();
                updateRequest.onsuccess = () => {
                    patientRecords.forEach((patient) => store.add(patient));
                    loadPatientData().then(renderTable);
                };
            }
        };

        request.onerror = (event) => {
            console.error("Error deleting patient record:", event.target.error);
        };
    }

    // Sorting button click event
    document.getElementById("sortBtn").addEventListener("click", function () {
        sortDescending = !sortDescending;
        this.textContent = sortDescending ? "S.No. 🔽" : "S.No. 🔼";
        console.log("Sorting order changed. New order:", sortDescending ? "Descending (Newest First)" : "Ascending (Oldest First)");
        loadPatientData().then(renderTable);
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "refreshViewData") {
            console.log("Received refreshViewData message. Refreshing table...");
            loadPatientData().then(renderTable);
        }
    });

    // Initialize DB and load data
    await initDB();
    await loadPatientData().then(renderTable);
});