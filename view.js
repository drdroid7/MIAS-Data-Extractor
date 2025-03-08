document.addEventListener("DOMContentLoaded", function () {
    let sortDescending = true; // Default: Newest entries first

    console.log("Initializing view page...");

    // Theme toggle function
    function toggleTheme() {
        const body = document.body;
        const isDark = body.getAttribute("data-theme") === "dark";

        if (isDark) {
            body.setAttribute("data-theme", "light");
            localStorage.setItem("theme", "light");
            // Update toggle button icon to sun (light mode)
            document.getElementById('themeToggleBtn').innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            `;
        } else {
            body.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
            // Update toggle button icon to moon (dark mode)
            document.getElementById('themeToggleBtn').innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
        }
    }

    // Set initial theme based on localStorage
    function setInitialTheme() {
        const savedTheme = localStorage.getItem("theme") || "dark";
        document.body.setAttribute("data-theme", savedTheme);

        // Set the correct icon for the toggle button
        const themeToggleBtn = document.getElementById("themeToggleBtn");
        if (savedTheme === "light") {
            themeToggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            `;
        } else {
            themeToggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
        }
    }

    // Attach theme toggle functionality to the button
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
    }

    // Set the initial theme when the page loads
    setInitialTheme();

    // Export data to Excel
    async function exportToExcel() {
        console.log("Exporting data to Excel...");

        try {
            const patientRecords = await getPatientRecords();
            if (!patientRecords.length) {
                alert("No data available to export.");
                return;
            }

            const combinedData = combinePatientAndTestData(patientRecords);

            // Ensure XLSX library is loaded
            if (typeof XLSX === 'undefined') {
                console.error("XLSX library is not loaded.");
                alert("XLSX library is not available. Please ensure xlsx.full.min.js is loaded.");
                return;
            }

            // Create a worksheet and workbook
            const ws = XLSX.utils.json_to_sheet(combinedData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Patient Data');

            // Download the Excel file
            XLSX.writeFile(wb, `PatientData_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`);

            console.log("Excel file downloaded successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            alert("Error exporting data to Excel. Please check the console for details.");
        }
    }

    // Get patient records from storage
    function getPatientRecords() {
        return new Promise((resolve) => {
            chrome.storage.local.get({ patientRecords: [] }, (result) => {
                resolve(result.patientRecords);
            });
        });
    }

    // Combine patient and test data for Excel export - MODIFIED FUNCTION
    function combinePatientAndTestData(patientRecords) {
        return patientRecords.flatMap((patient) => {
            if (patient.Tests.length === 0) {
                return [{
                    Age: patient.Age || "-",
                    Gender: patient.Gender || "-",
                    Mobile: patient.Mobile || "-",
                    Name: patient.Name || "-",
                    PID: patient.PID || "-",
                    ApprovedOn: "-",
                    ResultValue: "-",
                    TestName: "-"
                }];
            } else {
                return patient.Tests.map((test) => ({
                    Age: patient.Age || "-",
                    Gender: patient.Gender || "-",
                    Mobile: patient.Mobile || "-",
                    Name: patient.Name || "-",
                    PID: patient.PID || "-",
                    ApprovedOn: test.ApprovedOn || "-",
                    ResultValue: test.ResultValue || "-",
                    TestName: test.TestName || "-"
                }));
            }
        });
    }

    // Load patient data into the table
    function loadPatientData() {
        console.log("Loading patient data...");

        chrome.storage.local.get({ patientRecords: [] }, (result) => {
            console.log("Retrieved patient records from storage:", result.patientRecords);

            let tableBody = document.getElementById("dataBody");
            tableBody.innerHTML = ""; // Clear existing data

            let allRows = [];

            result.patientRecords.forEach((patient, patientIndex) => {
                if (patient.Tests.length === 0) {
                    // ✅ Display patient even if no tests are available + Add delete button
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
                    // ✅ Add test records under the same patient
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

            if (allRows.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7">No data available</td></tr>`;
                return;
            }

            // Sort records (default: newest first)
            allRows.sort((a, b) => (sortDescending ? b.entryIndex - a.entryIndex : a.entryIndex - b.entryIndex));
            console.log("Sorted records:", allRows);

            allRows.forEach((entry, index) => {
                let row = tableBody.insertRow();
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
                    let patientIndex = parseInt(this.getAttribute("data-patient"));
                    let testIndex = parseInt(this.getAttribute("data-test"));

                    console.log(`Delete test clicked - Patient Index: ${patientIndex}, Test Index: ${testIndex}`);
                    deleteTestRecord(patientIndex, testIndex);
                });
            });

            // Attach delete event for patient-only rows
            document.querySelectorAll(".delete-patient-btn").forEach((button) => {
                button.addEventListener("click", function () {
                    let patientIndex = parseInt(this.getAttribute("data-patient"));

                    console.log(`Delete patient clicked - Patient Index: ${patientIndex}`);
                    deletePatientRecord(patientIndex);
                });
            });
        });
    }

    function deleteTestRecord(patientIndex, testIndex) {
        console.log(`Deleting test record - Patient Index: ${patientIndex}, Test Index: ${testIndex}`);

        chrome.storage.local.get({ patientRecords: [] }, (result) => {
            let patientRecords = result.patientRecords;
            if (patientRecords[patientIndex]) {
                patientRecords[patientIndex].Tests.splice(testIndex, 1);

                // ✅ Remove patient if no tests remain
                if (patientRecords[patientIndex].Tests.length === 0) {
                    patientRecords.splice(patientIndex, 1);
                }

                console.log("Updated patient records after test deletion:", patientRecords);
                chrome.storage.local.set({ patientRecords }, loadPatientData);
            }
        });
    }

    function deletePatientRecord(patientIndex) {
        console.log(`Deleting patient record - Patient Index: ${patientIndex}`);

        chrome.storage.local.get({ patientRecords: [] }, (result) => {
            let patientRecords = result.patientRecords;

            if (patientRecords[patientIndex]) {
                patientRecords.splice(patientIndex, 1); // Remove patient completely
                console.log("Updated patient records after patient deletion:", patientRecords);
                chrome.storage.local.set({ patientRecords }, loadPatientData);
            }
        });
    }

    // Sorting button click event
    document.getElementById("sortBtn").addEventListener("click", function () {
        sortDescending = !sortDescending;
        this.textContent = sortDescending ? "S.No. 🔽" : "S.No. 🔼";
        console.log("Sorting order changed. New order:", sortDescending ? "Descending (Newest First)" : "Ascending (Oldest First)");
        loadPatientData();
    });

    // ✅ Listen for "Clear Data" event and update the live page
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "refreshViewData") {
            console.log("Refreshing view data...");
            loadPatientData();
        } else if (request.type === "clearLiveData") {
            console.log("Clearing live data...");
            chrome.storage.local.set({ patientRecords: [] }, loadPatientData);
        }
    });

    // Auto-refresh data when storage changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
        console.log("Storage changes detected in:", areaName, changes);
        loadPatientData();
    });

    // Attach export to Excel functionality to the button
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener("click", exportToExcel);
    }

    // Load data on page load
    loadPatientData();
});