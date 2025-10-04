// view.js - FINAL CLEANED CODE (All persistence managed by Background Script)

document.addEventListener("DOMContentLoaded", function () {
    let sortDescending = true; // Default: Newest entries first

    console.log("Initializing view page...");

    // ====================== Constants ======================

    const MESSAGE_TYPES = {
        getRecords: "getPatientRecords",
        deleteRecord: "deleteRecord", // Deletes entire patient record by PID
        deleteTest: "deleteTest",    // Deletes single test from a patient
        generateReport: "generateReport"
    };
    
    // --- Export Trigger Function ---
    async function triggerExport() {
        const exportBtn = document.getElementById('exportExcelBtn');
        if (!exportBtn || exportBtn.disabled) return;
        
        exportBtn.disabled = true;
        exportBtn.textContent = "Generating...";

        try {
            // Send the command to the background script to handle data processing and download initiation
            const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.generateReport });
            
            // NOTE: Using a custom modal/message box instead of alert in a real app
            if (response.status && response.status.includes("successfully")) {
                console.log("CSV report generation initiated successfully!");
            } else if (response.status === "No data found") {
                console.log("No data available to export.");
            } else {
                console.error(`Export failed: ${response.status || "Unknown error during download."}`);
            }
        } catch (error) {
            console.error("Export initiation failed:", error);
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = "Export to CSV"; 
        }
    }
    
    // --- Theme functions (FIXED FOR PERSISTENCE) ---
    
    // Define reusable SVG icons for clarity and consistency
    const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    
    // Icon for Trash/Delete Action (used for both patient and test)
    const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;


    // Helper function to apply a specific theme and update the button icon
    function applyTheme(theme) {
        const body = document.body;
        body.setAttribute("data-theme", theme);
        
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = theme === "dark" 
                ? sunIcon // Show sun icon when currently dark mode (i.e., click to switch to light)
                : moonIcon; // Show moon icon when currently light mode (i.e., click to switch to dark)
        }
    }

    // Toggles the theme and saves the new state
    function toggleTheme() {
        const body = document.body;
        // Determine the new theme based on the current state
        const isDark = body.getAttribute("data-theme") === "dark";
        const newTheme = isDark ? "light" : "dark";

        // 1. Apply the new theme (also updates the icon)
        applyTheme(newTheme);
        
        // 2. Save the new state
        localStorage.setItem("theme", newTheme);
    }

    // Sets the theme based on local storage on page load
    function setInitialTheme() {
        // Read the saved theme, default to "dark"
        const savedTheme = localStorage.getItem("theme") || "dark";
        
        // Apply the saved theme without toggling it
        applyTheme(savedTheme); 
    }

    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
    }
    // Call the fixed initialization function
    setInitialTheme();

    // --- Core Data Functions (Delegated to Background Script) ---

    // Get patient records from IndexedDB (via messaging background)
    async function getPatientRecords() {
        const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.getRecords });
        return response?.records || [];
    }
    
    // Deletes a single patient record by its PID (via messaging background)
    async function deletePatientRecordByPID(pid) {
        return chrome.runtime.sendMessage({ type: MESSAGE_TYPES.deleteRecord, data: { pid: pid } });
    }

    // Deletes a single test record from a patient's Tests array (NOW MESSAGING BACKGROUND)
    async function deleteTestRecord(patientPID, testIndex) {
        try {
            const response = await chrome.runtime.sendMessage({ 
                type: MESSAGE_TYPES.deleteTest, 
                data: { pid: patientPID, index: testIndex } 
            });
            if (response && response.status.startsWith("Error")) {
                throw new Error(response.status);
            }
            return true;
        } catch (error) {
            console.error("Test deletion failed via background message:", error);
            // NOTE: Using console.error instead of alert due to sandbox environment
            console.error(`Error deleting test: ${error.message}`);
            return false;
        }
    }


    // Load patient data into the table
    async function loadPatientData() {
        console.log("Loading patient data...");

        try {
            const patientRecords = await getPatientRecords();
            console.log("Retrieved patient records from storage:", patientRecords);
            
            const tableBody = document.getElementById("dataBody");
            if (!tableBody) return;
            tableBody.innerHTML = ""; // Clear existing data

            let allRows = [];

            // 1. Flatten the structured data for display/sorting
            patientRecords.forEach((patient) => {
                const patientPID = patient.PID;
                const patientName = patient.Name;

                if (!patient.Tests || patient.Tests.length === 0) { 
                    allRows.push({
                        entryIndex: allRows.length,
                        PID: patientPID,
                        Name: patientName,
                        TestName: "-",
                        ResultValue: "-",
                        ApprovedOn: "-",
                        isPatientRow: true, 
                        testIndex: -1
                    });
                } else {
                    patient.Tests.forEach((test, testIndex) => {
                        allRows.push({
                            entryIndex: allRows.length,
                            PID: patientPID,
                            Name: patientName,
                            TestName: test.TestName,
                            ResultValue: test.ResultValue,
                            ApprovedOn: test.ApprovedOn || "-",
                            testIndex: testIndex, // Index within the patient.Tests array
                            isPatientRow: false,
                        });
                    });
                }
            });

            if (allRows.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7">No data available</td></tr>`;
                return;
            }

            // 2. Sort records (by entryIndex/insertion order)
            allRows.sort((a, b) => (sortDescending ? b.entryIndex - a.entryIndex : a.entryIndex - b.entryIndex));

            // 3. Render rows
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
                        ${entry.isPatientRow
                            ? `<button class="delete-btn delete-patient-btn" data-pid="${entry.PID}" title="Delete Patient Record">${trashIcon}</button>`
                            : `<button class="delete-btn delete-test-btn" data-pid="${entry.PID}" data-test="${entry.testIndex}" title="Delete Single Test Result">${trashIcon}</button>`
                        }
                    </td>
                `;
            });

            // 4. Re-attach listeners to the rendered buttons
            document.querySelectorAll(".delete-test-btn").forEach((button) => {
                button.addEventListener("click", async function () {
                    // NOTE: Replace native confirm with a custom modal in a real app
                    if (confirm("Are you sure you want to delete this single test result?")) {
                        const patientPID = this.getAttribute("data-pid");
                        const testIndex = parseInt(this.getAttribute("data-test"));

                        if (await deleteTestRecord(patientPID, testIndex)) {
                            // On successful deletion, refresh the view
                            loadPatientData(); 
                        }
                    }
                });
            });

            document.querySelectorAll(".delete-patient-btn").forEach((button) => {
                button.addEventListener("click", async function () {
                    // NOTE: Replace native confirm with a custom modal in a real app
                    if (confirm("Are you sure you want to delete this entire patient record (including tests)?")) {
                        const patientPID = this.getAttribute("data-pid");
                        await deletePatientRecordByPID(patientPID); 
                        loadPatientData();
                    }
                });
            });

        } catch (error) {
            console.error("Failed to load patient data:", error);
            document.getElementById("dataBody").innerHTML = `<tr><td colspan="7" style="color:red;">Error loading data: ${error.message}. Check console.</td></tr>`;
        }
    }

    // Listen for "dataUpdated" event from background.js (This ensures auto-refresh)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "dataUpdated") { 
            console.log("Refreshing view data due to background update...");
            loadPatientData();
        }
        return false; // Sync response is okay here
    });

    // --- Event Handlers ---
    
    // Sorting button click event
    document.getElementById("sortBtn")?.addEventListener("click", function () {
        sortDescending = !sortDescending;
        this.innerHTML = `S.No. <span class="sort-arrow">${sortDescending ? "↓" : "↑"}</span>`;
        console.log("Sorting order changed. New order:", sortDescending ? "Descending (Newest First)" : "Ascending (Oldest First)");
        loadPatientData();
    });

    // Attach export to CSV functionality to the button
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener("click", triggerExport); 
    }

    // Load data on page load
    loadPatientData();
});
