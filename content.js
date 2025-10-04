// content.js - FINAL CLEANED CODE (Single Source of Truth: Background Script)

console.log("Content script loaded (Final updated version).");

// --- CONSTANTS for selectors and message types ---
const SELECTORS = {
    patient: {
        modal: "#dvpatientviewonly > div > div > div.modal-body",
        name: '#dvoldpatient > div > div > div.user-details > p:nth-child(2) > strong',
        pid: '#dvoldpatient > div > div > div.user-details > h3 > strong',
        age: '#dvoldpatient > div > div > div.user-details > p:nth-child(4) > strong',
        gender: '#dvoldpatient > div > div > div.user-details > p:nth-child(3) > strong',
        mobile: '#dvoldpatient > div > div > div.user-details > p:nth-child(5) > strong',
        openTabTrigger: '#dvoldpatient > div > div' 
    },
    test: {
        modal: "#mdlviewlabtest > div > div > div.modal-body",
        name: "#splabtestname",
        result: "#splabtestresult",
        approvedOn: "#splabtestapprovedon",
        // CRITICAL: Selector for PID in test modal header (used for Case ID)
        pid: '#pagemainheader span:nth-child(3)',
        closeButton: '#btnlabtestclose'
    },
    investigation: {
        tableButtons: '#tbldvinvestigation td:nth-child(10) button',
        mainContent: '#dvmainbarsub',
        hiddenPatientId: '#cphbody_hdnpatientid' 
    }
};

const MESSAGE_TYPES = {
    extractTest: 'extractTestData',
    savePatient: 'savePatientData',
    saveTest: 'saveTestData',
    // NEW: Message type for background script to trigger a toast here
    showToastNotification: 'showToast'
};

// ======================= Toast Notification (Updated to match the "Extraction Complete" single-line style and Pale colors) =======================
function showToast(message, type = 'success') {
    console.log(`Showing toast: ${message}`);
    
    // Adapted from Pale Toast color scheme for consistency
    const config = {
        success: { 
            bg: '#D4EDDA', // Light Green
            borderLeft: '5px solid #28A745', // Darker Green
            icon: '✓', 
            iconColor: '#28A745', 
            textColor: '#155724' 
        }, 
        error: { 
            bg: '#F8D7DA', // Light Red
            borderLeft: '5px solid #DC3545', // Darker Red
            icon: '!', 
            iconColor: '#DC3545', 
            textColor: '#721C24' 
        },   
        info: { // Using the blue style for generic messages
            bg: '#D6EBFF', 
            borderLeft: '5px solid #007BFF', 
            icon: 'i', 
            iconColor: '#007BFF', 
            textColor: '#004085' 
        },
        // Using 'warning' for duplicate entry as requested
        warning: { 
            bg: '#FFF3CD', // Light Yellow
            borderLeft: '5px solid #FFC107', // Darker Yellow
            icon: '!', 
            iconColor: '#FFC107', 
            textColor: '#856404' 
        }
    }[type] || { // Default to success if type is not recognized (most common)
        bg: '#D4EDDA', 
        borderLeft: '5px solid #28A745', 
        icon: '✓', 
        iconColor: '#28A745', 
        textColor: '#155724' 
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        bottom: auto;
        left: 50%;
        transform: translate(-50%, -100px); /* Start further off-screen for a better slide-in */
        background-color: ${config.bg};
        color: ${config.textColor};
        padding: 12px 20px;
        border-radius: 8px; 
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 16px; /* Slightly larger font for single line message */
        font-weight: 600; /* Bold text for high visibility */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Moderate shadow */
        z-index: 10000;
        opacity: 0;
        display: flex;
        align-items: center;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Smooth, modern transition */
        min-width: 200px;
        max-width: 90%;
        border-left: ${config.borderLeft}; 
        box-sizing: border-box; 
    `;
    
    // Single line structure: Icon and Message
    toast.innerHTML = `
        <span style="
            margin-right: 15px; 
            font-size: 1.5em; /* Large icon */
            color: ${config.iconColor}; 
            line-height: 1;
        ">${config.icon}</span>
        <span style="font-weight: 600; color: ${config.textColor};">
            ${message}
        </span>
    `;
    
    document.body.appendChild(toast);

    // Slide in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0px)';
    }, 50);

    // Slide out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -100px)'; /* Slide back up */
        setTimeout(() => {
            toast.remove();
        }, 400); // Match transition speed
    }, 2500); // Display time
}

// ======================= Button Creation (UPDATED FOR SVG) =======================
function createButton(id, text, svgIcon, parentSelector, onClickFunction, bgColor, textColor = "white", centerAlign = false) {
    const parentElement = document.querySelector(parentSelector);
    if (!parentElement || document.getElementById(id)) return;

    if (centerAlign) parentElement.style.textAlign = "center";

    const button = document.createElement("button");
    button.id = id;
    
    // Use inline SVG for the flask icon (Test tube/flask icon)
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M10 10v4h4v-4h-4z"></path>
        <path d="M12 14v4"></path>
    </svg>`;
    
    button.innerHTML = iconSvg + text;
    
    // Use standard, robust styles for buttons
    button.style.cssText = `
        background-color: ${bgColor}; 
        color: ${textColor}; 
        border: none;
        padding: 10px 16px; 
        margin: 10px; 
        border-radius: 8px; 
        cursor: pointer;
        font-size: 14px; 
        font-weight: 600;
        transition: all 0.2s ease-in-out;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3); 
        display: inline-flex; 
        align-items: center;
        justify-content: center;
    `;
    
    // Add hover effects
    button.onmouseover = () => {
        button.style.backgroundColor = darkenColor(bgColor, 0.15);
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
    };
    button.onmouseleave = () => {
        button.style.backgroundColor = bgColor;
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    };
    button.onclick = onClickFunction;

    parentElement.appendChild(button);
}

// ======================= Darken Button Color =======================
function darkenColor(hex, percent) {
    hex = hex.replace("#", "");
    let num = parseInt(hex, 16),
        r = (num >> 16) & 255,
        g = (num >> 8) & 255,
        b = num & 255;

    r = Math.round(r * (1 - percent));
    g = Math.round(g * (1 - percent));
    b = Math.round(b * (1 - percent));

    // Ensure we return a valid hex/rgb color string
    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// ======================= Query Selector Helper =======================
function getTextContent(selector, trim = true) {
    const element = document.querySelector(selector);
    if (element) return trim ? element.textContent.trim() : element.textContent;
    console.warn(`Element with selector "${selector}" not found.`);
    return "";
}

// ======================= Extract Test Data (from Modal) =======================
async function extractTestData() { 
    console.log("Extracting test data from modal...");
    
    // Extract PID directly from the test modal's header element
    const rawPID = getTextContent(SELECTORS.test.pid);
    const pid = rawPID ? rawPID.replace("PID: ", "").trim() : ""; // This yields the long PID/Case ID

    const testData = {
        TestName: getTextContent(SELECTORS.test.name),
        ResultValue: getTextContent(SELECTORS.test.result),
        ApprovedOn: getTextContent(SELECTORS.test.approvedOn),
        PID: pid
    };

    // Check only for essential test-related data
    if (!testData.TestName || !testData.ResultValue || !testData.PID) {
        showToast("Essential test data (Name, Result, or PID) not found!", 'error');
        console.error("Test data extraction failed. Data:", testData);
        // Do not close modal on error, allow user to inspect/retry
        return; 
    }

    // --- MESSAGE TO BACKGROUND SCRIPT (Single source of truth) ---
    try {
        // We no longer handle success toast here; background script handles it on completion.
        await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.saveTest, data: testData });
        // The background script will now send back a separate message to trigger the final toast.
        
    } catch (error) {
        console.error("Error sending test data to background:", error);
        showToast("Error communicating with extension background.", 'error');
    } finally {
        // Close modal after attempting to save
        document.querySelector(SELECTORS.test.closeButton)?.click();
    }
}

// ======================= Fetch Patient Profile Data in Background =======================
function fetchProfileInBackground() {
    console.log("Background fetch for patient profile initiated (triggered by 'View' button)...");

    const shortPatientId = document.querySelector(SELECTORS.investigation.hiddenPatientId)?.value;
    
    // Attempt to get the Long PID/Case ID from the header
    let casePID = getTextContent(SELECTORS.test.pid);
    casePID = casePID ? casePID.replace("PID: ", "").trim() : shortPatientId; 
    
    const patientIdForFetch = shortPatientId;

    if (!patientIdForFetch) {
        console.error("Could not find hidden patient ID to fetch profile.");
        showToast("Patient ID not found for profile fetch.", 'error'); 
        return;
    }

    // Fetch using the Short Patient ID as the API likely expects it
    const url = `../Handler/Student.ashx?Page=PATIENTHISTORYFACT&Mode=CASEGETPATIENTDETAILS&Pid=${patientIdForFetch}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.Table && data.Table.length > 0) {
                const profile = data.Table[0];
                
                // CRITICAL: Use the Long PID/CasePID as the primary PID for storage
                const finalPID = casePID || shortPatientId; 

                // --- UPDATED: Constructing patientProfileData, EXCLUDING unwanted fields ---
                const patientProfileData = {
                    Name: `${profile.FirstName || ''} ${profile.LastName || ''}`.trim(),
                    PID: finalPID, // THIS IS THE KEY USED FOR MERGING IN BACKGROUND SCRIPT
                    
                    // Only include desired demographic fields
                    Age: profile.Age,
                    Gender: profile.Gender,
                    Mobile: profile.Phonenumber,
                };

                // Send message to background script for persistence (IndexedDB)
                chrome.runtime.sendMessage({ type: MESSAGE_TYPES.savePatient, data: patientProfileData }, (response) => {
                    // We no longer handle success toast here; background script handles it on completion.
                    if (response && response.status && response.status.startsWith("Error")) {
                        showToast(`Error saving patient profile: ${response.status}`, 'error');
                    }
                });

            } else {
                throw new Error("Profile data not found in server response.");
            }
        })
        .catch(error => {
            console.error('Error fetching profile data:', error);
            showToast("Failed to fetch patient profile data.", 'error');
        });
}

// ======================= Attach Listeners to Existing Buttons =======================
function attachListenersToViewButtons() {
    const investigationTableButtons = document.querySelectorAll(SELECTORS.investigation.tableButtons);

    if (investigationTableButtons.length === 0) {
        return; 
    }

    investigationTableButtons.forEach(button => {
        // Use explicit check for data attribute existence
        if (button.dataset.profileListenerAttached === 'true') { 
            return;
        }
        
        button.addEventListener('click', fetchProfileInBackground);
        button.dataset.profileListenerAttached = 'true';
    });
    console.log(`Attached background profile fetch to ${investigationTableButtons.length} 'View' buttons.`);
}

// ======================= Initialization =======================
function init() {
    // Listener for messages from other parts of the extension (e.g., popup.js or background.js)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Received message:", message);
        switch (message.type) {
            case MESSAGE_TYPES.extractTest:
                // Call the async function
                extractTestData();
                sendResponse({ status: "Test extraction triggered" });
                break;
                
            // Handle the consolidated toast message from background.js
            case MESSAGE_TYPES.showToastNotification:
                showToast(message.message, message.toastType);
                sendResponse({ status: "Toast displayed" });
                break;

            default:
                sendResponse({ status: "Unknown message type" });
        }
        return true; // Indicates an asynchronous response
    });

    // Listener for Spacebar key press
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space" && !event.repeat) {
            console.log("Spacebar pressed. Triggering Extract Test Data button...");
            document.getElementById("extractTestBtn")?.click(); 
        }
    });

    // Inject the 'Extract Test Data' button into the test modal
    createButton(
        "extractTestBtn", 
        "Extract Test Data", 
        // SVG icon is now handled internally in createButton for robustness
        null, 
        SELECTORS.test.modal, 
        // Pass the function directly
        () => extractTestData(), 
        "#3a82f7", 
        "white", 
        true
    );

    // --- Mutation Observer to wait for the Investigation table to load ---
    const mainContentObserver = new MutationObserver((mutationsList, observer) => {
        // We look for the investigation table buttons, which indicate the table is ready
        if (document.querySelector(SELECTORS.investigation.tableButtons)) {
            attachListenersToViewButtons();
        }
    });

    const mainContentArea = document.querySelector(SELECTORS.investigation.mainContent);
    if (mainContentArea) {
        mainContentObserver.observe(mainContentArea, { childList: true, subtree: true });
        // Run an initial attempt in case the content is already loaded (e.g., on page refresh)
        attachListenersToViewButtons(); 
    } else {
        console.warn(`${SELECTORS.investigation.mainContent} not found, cannot observe for investigation table.`);
    }
}

// Run the initialization function
init();