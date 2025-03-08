console.log("Background script running.");

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab && tab.url) {
    // Check if the new tab URL starts with the expected prefix
    const urlPrefix = "https://mias.smc.saveetha.com/Casesheet/Casesheetview.aspx?id=";
    if (tab.url.startsWith(urlPrefix)) {
      console.log("New tab loaded with matching URL prefix. Sending message to content script...");
      chrome.tabs.sendMessage(tabId, { type: "newTabLoaded" });
    }
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  chrome.storage.local.get({ patientRecords: [] }, (result) => {
    let patientRecords = result.patientRecords;

    // Save patient data
    if (message.type === "savePatientData") {
      const existingPatient = patientRecords.find(p => p.PID === message.data.PID);
      if (!existingPatient) {
        patientRecords.push({ ...message.data, Tests: [] });
        console.log("New patient added:", message.data);
      }
    }

    // Save test data
    if (message.type === "saveTestData") {
      const patient = patientRecords.find(p => p.PID === message.data.PID);
      if (patient) {
        patient.Tests.push({
          TestName: message.data.TestName,
          ResultValue: message.data.ResultValue,
          ApprovedOn: message.data.ApprovedOn
        });
        console.log("Test data added to patient:", patient.PID);
      }
    }

    // Update storage
    chrome.storage.local.set({ patientRecords }, () => {
      console.log("Updated patient records:", patientRecords);
      sendResponse({ status: "Data saved successfully" });
    });
  });

  return true; // Required for async sendResponse
});