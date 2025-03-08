console.log("Content script loaded.");

// ======================= Toast Notification =======================
function showToast(message, type = 'success') {
    console.log(`Showing toast: ${message}`);
    const bgColor = type === 'success' ? '#4CAF50' : '#f44336';
    const iconPath = type === 'success' ? 
        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' : 
        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z';

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translate(-50%, -100%);
        background-color: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 6px rgb(0 0 0 / 20%);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.innerHTML = `<path fill="white" d="${iconPath}"/>`;

    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
        background: ${bgColor};
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
    `;
    iconContainer.appendChild(icon);

    const messageElement = document.createElement('span');
    messageElement.textContent = message;

    const contentContainer = document.createElement('div');
    contentContainer.style.display = 'flex';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.gap = '12px';
    contentContainer.appendChild(iconContainer);
    contentContainer.appendChild(messageElement);

    toast.appendChild(contentContainer);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
    }, 0);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -100%)';
        setTimeout(() => toast.remove(), 150);
    }, 1000);
}

// ======================= Button Creation =======================
function createButton(id, text, iconClass, parentSelector, onClickFunction, bgColor, textColor = "white", centerAlign = false) {
    console.log(`Creating button "${id}" in selector "${parentSelector}"...`);
    const parentElement = document.querySelector(parentSelector);
    if (parentElement && !document.getElementById(id)) {
        if (centerAlign) {
            parentElement.style.textAlign = "center";
        }
        const button = document.createElement("button");
        button.id = id;
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

// ======================= Darken Button Color =======================
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

// ======================= Extract Patient Data =======================
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
            showToast(response.status, 'success'); // Show success toast

            // Automate click to open new tab
            const openNewTabElement = document.querySelector('#dvoldpatient > div > div');
            if (openNewTabElement) {
                console.log("Clicking element to open new tab...");
                openNewTabElement.click();
            } else {
                console.log("Element to open new tab not found.");
                showToast("Failed to open new tab!", 'error');
            }
        });
    } else {
        console.log("Patient name or PID not found. Extraction aborted.");
        showToast("Patient data not found!", 'error'); // Show error toast
    }
}

// ======================= Extract Test Data =======================
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
            showToast(response.status, 'success'); // Show success toast

            // Automate click on #btnlabtestclose after successful extraction
            const closeButton = document.querySelector('#btnlabtestclose');
            if (closeButton) {
                console.log("Clicking #btnlabtestclose...");
                closeButton.click();
                showToast("Test data extracted successfully!", 'success'); // Show additional toast
            } else {
                console.log("#btnlabtestclose button not found.");
                showToast("Failed to close test modal!", 'error'); // Show error toast
            }
        });
    } else {
        console.log("One or more test data selectors not found. Extraction aborted.");
        showToast("Test data not found!", 'error'); // Show error toast
    }
}

// ======================= Message Listener =======================
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

// ======================= Inject Buttons =======================
console.log("Injecting 'Extract Patient Data' button...");
createButton(
    "extractPatientBtn", 
    "Extract Patient Data", 
    "fa fa-user", 
    "#dvpatientviewonly > div > div > div.modal-body", 
    extractPatientData, 
    "#28a745", 
    "white", 
    true
);

console.log("Injecting 'Extract Test Data' button...");
createButton(
    "extractTestBtn", 
    "Extract Test Data", 
    "fa fa-flask", 
    "#mdlviewlabtest > div > div > div.modal-body", 
    extractTestData, 
    "#3a82f7", 
    "white", 
    true
);