document.addEventListener("DOMContentLoaded", function () {
    let sortDescending = true; // Default: Newest entries first

    console.log("Initializing view page...");

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

            // Create worksheet with column order
            const ws = XLSX.utils.json_to_sheet(combinedData, {
                header: ["Age", "Gender", "Mobile", "Name", "PID", "ApprovedOn", "ResultValue", "TestName"]
            });

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Patient Data');
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

    // Combine patient and test data for Excel export
    function combinePatientAndTestData(patientRecords) {
        return patientRecords.flatMap((patient) => {
            const baseData = {
                Age: patient.Age || "-",
                Gender: patient.Gender || "-",
                Mobile: patient.Mobile || "-",
                Name: patient.Name,
                PID: patient.PID
            };

            if (patient.Tests.length === 0) {
                return [{
                    ...baseData,
                    ApprovedOn: "-",
                    ResultValue: "-",
                    TestName: "-"
                }];
            }

            return patient.Tests.map((test) => ({
                ...baseData,
                ApprovedOn: test.ApprovedOn || "-",
                ResultValue: test.ResultValue,
                TestName: test.TestName
            }));
        });
    }

    // Load patient data into the table (existing unchanged functionality)
    function loadPatientData() {
        console.log("Loading patient data...");

        chrome.storage.local.get({ patientRecords: [] }, (result) => {
            console.log("Retrieved patient records from storage:", result.patientRecords);

            let tableBody = document.getElementById("dataBody");
            tableBody.innerHTML = ""; // Clear existing data

            let allRows = [];

            result.patientRecords.forEach((patient, patientIndex) => {
                if (patient.Tests.length === 0) {
                    allRows.push({
                        entryIndex: allRows.length,
                        PID: patient.PID,
                        Name: patient.Name,
                        TestName: "-",
                        ResultValue: "-",
                        ApprovedOn: "-",
                        patientIndex,
                        testIndex: null,
                        isPatientRow: true,
                    });
                } else {
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

            // Sort records
            allRows.sort((a, b) => (sortDescending ? b.entryIndex - a.entryIndex : a.entryIndex - b.entryIndex));

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
                        ${entry.isPatientRow ?
                            `<button class="delete-patient-btn" data-patient="${entry.patientIndex}" title="Delete Patient">🗑️</button>` :
                            `<button class="delete-btn" data-patient="${entry.patientIndex}" data-test="${entry.testIndex}" title="Delete Test">🗑️</button>`
                        }
                    </td>
                `;
            });

            // Attach delete handlers
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", function() {
                    const patientIndex = parseInt(this.dataset.patient);
                    const testIndex = parseInt(this.dataset.test);
                    deleteTestRecord(patientIndex, testIndex);
                });
            });

            document.querySelectorAll(".delete-patient-btn").forEach(button => {
                button.addEventListener("click", function() {
                    const patientIndex = parseInt(this.dataset.patient);
                    deletePatientRecord(patientIndex);
                });
            });
        });
    }

    // Existing delete functionality
    function deleteTestRecord(patientIndex, testIndex) {
        chrome.storage.local.get({ patientRecords: [] }, (result) => {
            const patientRecords = result.patientRecords;
            if (patientRecords[patientIndex]) {
                patientRecords[patientIndex].Tests.splice(testIndex, 1);
                if (patientRecords[patientIndex].Tests.length === 0) {
                    patientRecords.splice(patientIndex, 1);
                }
                chrome.storage.local.set({ patientRecords }, loadPatientData);
            }
        });
    }

    function deletePatientRecord(patientIndex) {
        chrome.storage.local.get({ patientRecords: [] }, (result) => {
            const patientRecords = result.patientRecords;
            if (patientRecords[patientIndex]) {
                patientRecords.splice(patientIndex, 1);
                chrome.storage.local.set({ patientRecords }, loadPatientData);
            }
        });
    }

    // Existing sorting functionality
    document.getElementById("sortBtn").addEventListener("click", function() {
        sortDescending = !sortDescending;
        this.textContent = sortDescending ? "S.No. 🔽" : "S.No. 🔼";
        loadPatientData();
    });

    // Existing message listeners
    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === "refreshViewData") loadPatientData();
    });

    chrome.storage.onChanged.addListener(() => loadPatientData());

    // Initialize export button
    document.getElementById("exportExcelBtn")?.addEventListener("click", exportToExcel);

    // Initial load
    loadPatientData();
});