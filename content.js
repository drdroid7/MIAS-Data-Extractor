console.log("Content script loaded.");

// Function to create and insert buttons with improved UI and icons
function createButton(id, text, iconClass, parentSelector, onClickFunction, bgColor, textColor = "white", centerAlign = false) {
    console.log(`Creating button "${id}" in selector "${parentSelector}"...`);
    const parentElement = document.querySelector(parentSelector);
    if (parentElement && !document.getElementById(id)) {
        // Center the button if needed
        if (centerAlign) {
            parentElement.style.textAlign = "center";
        }
        const button = document.createElement("button");
        button.id = id;
        // Add icon and text. Make sure there's a space between the icon and the text.
        button.innerHTML = `<i class="${iconClass}" style="margin-right: 6px;"></i>${text}`;
        button.style.cssText = `
            background-color: ${bgColor}; 
            color: ${textColor}; 
            border: none; 
            padding: 10px 16px; 
            margin: 10px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px; 
            transition: background-color 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: inline-block;
        `;
        button.onmouseover = () => {
            console.log(`Button "${id}" hovered.`);
            button.style.backgroundColor = darkenColor(bgColor, 15);
        };
        button.onmouseleave = () => {
            console.log(`Button "${id}" hover ended.`);
            button.style.backgroundColor = bgColor;
        };
        button.onclick = () => {
            console.log(`Button "${id}" clicked.`);
            onClickFunction();
        };
        parentElement.appendChild(button);
        console.log(`Button "${id}" appended successfully.`);
    } else {
        console.log(`Parent element not found or button "${id}" already exists.`);
    }
}

// Function to darken the button color slightly on hover
function darkenColor(hex, percent) {
    console.log(`Darkening color ${hex} by ${percent}%`);
    let num = parseInt(hex.replace("#", ""), 16),
        r = (num >> 16) - percent,
        g = ((num >> 8) & 0x00ff) - percent,
        b = (num & 0x0000ff) - percent;
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);
    const darkenedColor = `rgb(${r}, ${g}, ${b})`;
    console.log(`Darkened color: ${darkenedColor}`);
    return darkenedColor;
}

// Function to extract patient data
function extractPatientData() {
    console.log("Extracting patient data...");
    const patientName = document.querySelector('#dvoldpatient > div > div > div.user-details > p:nth-child(2) > strong');
    const pidElement = document.querySelector('#dvoldpatient > div > div > div.user-details > h3 > strong');
    const AgeElement = document.querySelector('#dvoldpatient > div > div > div.user-details > p:nth-child(4) > strong');
    const genderElement = document.querySelector('#dvoldpatient > div > div > div.user-details > p:nth-child(3) > strong');
    const mobileElement = document.querySelector('#dvoldpatient > div > div > div.user-details > p:nth-child(5) > strong');

    console.log("Selectors applied. Processing patient details...");

    let age = "";
    if (AgeElement) {
        console.log("Age element found.");
        age = AgeElement.textContent.trim();
        if (!isNaN(age)) {
            console.log(`Extracted Age: ${age}`);
        } else {
            console.log("Extracted value is not a valid age.");
        }
    } else {
        console.log("DOB/Age element not found.");
    }

    let pid = "";
    if (pidElement) {
        console.log("PID element found.");
        const pidText = pidElement.textContent.trim();
        pid = pidText.replace(/\D/g, ""); // Remove all non-numeric characters
        console.log(`Extracted PID: ${pid}`);
    } else {
        console.log("PID element not found.");
    }

    let gender = "";
    if (genderElement) {
        console.log("Gender element found.");
        gender = genderElement.textContent.trim();
        console.log(`Extracted gender: ${gender}`);
    } else {
        console.log("Gender element not found.");
    }

    let mobile = "";
    if (mobileElement) {
        console.log("Mobile element found.");
        mobile = mobileElement.textContent.trim();
        console.log(`Extracted mobile: ${mobile}`);
    } else {
        console.log("Mobile element not found.");
    }

    if (patientName && pid) {
        console.log("Patient name and PID found. Preparing data to save...");
        const patientData = { 
            Name: patientName.textContent.trim(), 
            PID: pid, 
            Age: age, 
            Gender: gender,
            Mobile: mobile
        };
        console.log("Patient Data object:", patientData);
        chrome.storage.local.get(['patientData'], (result) => {
            console.log("Retrieved existing patient data:", result);
            const existingPatientData = result.patientData || [];
            const existingEntryIndex = existingPatientData.findIndex(data => data.PID === patientData.PID);

            if (existingEntryIndex !== -1) {
                console.log("Existing patient data found. Updating entry...");
                existingPatientData[existingEntryIndex] = patientData;
            } else {
                console.log("No existing entry found. Adding new patient data...");
                existingPatientData.push(patientData);
            }

            chrome.storage.local.set({ patientData: existingPatientData }, () => {
                console.log("Patient data saved to chrome.storage.local:", existingPatientData);
            });
        });

        chrome.runtime.sendMessage({ type: "savePatientData", data: patientData }, (response) => {
            console.log("Response from runtime.sendMessage:", response);
            console.log("Patient data saved:", patientData);
            alert(response.status);
        });
    } else {
        console.log("Patient name or PID not found. Extraction aborted.");
        alert("Patient data not found!");
    }
}

// Define TestPanels
const testPanels = {
    "Electrolytes Panel": [
        "Electrolytes - Serum Sodium",
        "Electrolytes - Serum Potassium",
        "Electrolytes - Serum Chloride",
        "Electrolytes - Serum Bi-carbonate"
    ],
    "Renal Function Test (RFT) Panel": [
        "RENAL FUNCTION TEST (RFT) - Uric acid",
        "RENAL FUNCTION TEST (RFT) - Creatinine",
        "RENAL FUNCTION TEST (RFT) - Urea"
    ],
    "Liver Function Test (LFT) Panel": [
        "Liver Function Test - Gamma-glutamy Transferase (GGT)",
        "Liver Function Test - Albumin",
        "Liver Function Test - ALKP",
        "Liver Function Test - ALTV",
        "Liver Function Test - AST",
        "Liver Function Test - Total Protein",
        "Liver Function Test - Direct Bilirubin",
        "Liver Function Test - Total Bilirubin"
    ],
    "Thyroid Panel": [
        "Free T3, T4 & TSH - (F-T3) FREE TRIIODOTHYRONINE",
        "Free T3, T4 & TSH - (F-T4) FREE THYROXINE",
        "Free T3, T4 & TSH - (TSH) THYROID STIMULATING"
    ],
    "Lipid Profile Panel": [
        "Lipid Profile - Cholesterol (Total)",
        "Lipid Profile - HDL Cholesterol (Direct)",
        "Lipid Profile - LDL Cholesterol (Direct)",
        "Lipid Profile - Triglycerides",
        "Lipid Profile - VLDL Cholesterol",
        "Lipid Profile - Total Cholesterol /HDL Ratio"
    ],
    "Pancreas Profile Panel": [
        "PANCREAS PROFILE - Amylase",
        "PANCREAS PROFILE - Lipase"
    ],
    "Fertility Hormones Panel": [
        "FERTILITY HORMONES - Prolactin",
        "FERTILITY HORMONES - FSH",
        "FERTILITY HORMONES - LH"
    ]
};

// Function to extract test data
function extractTestData() {
    console.log("Extracting test data...");
    const testNameElement = document.querySelector("#splabtestname");
    const resultValueElement = document.querySelector("#splabtestresult");
    const approvedOnElement = document.querySelector("#splabtestapprovedon");
    const pidElement = document.querySelector('#pagemainheader span:nth-child(3)');

    if (testNameElement && resultValueElement && approvedOnElement && pidElement) {
        const testName = testNameElement.textContent.trim();
        const resultValue = resultValueElement.textContent.trim();
        const approvedOn = approvedOnElement.textContent.trim();
        const pid = pidElement.textContent.trim().replace("PID: ", "").trim();

        console.log("Extracted test data:", { TestName: testName, ResultValue: resultValue, ApprovedOn: approvedOn, PID: pid });

        chrome.storage.local.get(['testData'], (result) => {
            const existingTestData = result.testData || [];
            const existingEntry = existingTestData.find(t => t.TestName === testName && t.PID === pid);
            
            if (existingEntry) {
                existingEntry.ResultValue += `, ${resultValue}`;
            } else {
                existingTestData.push({ TestName: testName, ResultValue: resultValue, ApprovedOn: approvedOn, PID: pid });
            }

            chrome.storage.local.set({ testData: existingTestData }, () => {
                console.log("Test data updated:", existingTestData);
            });
        });

        chrome.runtime.sendMessage({ type: "saveTestData", data: { TestName: testName, ResultValue: resultValue, ApprovedOn: approvedOn, PID: pid } }, (response) => {
            console.log("Test data sent to background:", response);
            alert(response.status);
        });
    } else {
        console.log("One or more test data selectors not found. Extraction aborted.");
        alert("Test data not found!");
    }
}

// Inject buttons at the correct locations with improved UI

// Updated "Extract Patient Data" button injection selector (center aligned)
// Here, we assume the icon class "fa fa-user" for patient data (Font Awesome)
console.log("Injecting 'Extract Patient Data' button...");
createButton("extractPatientBtn", "Extract Patient Data", "fa fa-user", "#dvpatientviewonly > div > div > div.modal-body", extractPatientData, "#28a745", "white", true);

// Blue centered "Extract Test Data" button injection
// Using icon class "fa fa-flask" for test data (Font Awesome)
console.log("Injecting 'Extract Test Data' button...");
createButton("extractTestBtn", "Extract Test Data", "fa fa-flask", "#mdlviewlabtest > div > div > div.modal-body", extractTestData, "#3a82f7", "white", true);

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    if (message.type === "extractData") {
        console.log("Triggering extractPatientData...");
        extractPatientData();
    } else if (message.type === "extractTestData") {
        console.log("Triggering extractTestData...");
        extractTestData();
    }
    console.log("Sending response back to sender.");
    sendResponse({ status: "Extraction triggered" });
});