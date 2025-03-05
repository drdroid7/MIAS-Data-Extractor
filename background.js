console.log("Background script running.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  chrome.storage.local.get({ patientRecords: [] }, (result) => {
    let patientRecords = result.patientRecords;

    if (message.type === "savePatientData") {
      let existingPatient = patientRecords.find(p => p.PID === message.data.PID);
      if (!existingPatient) {
        patientRecords.push({ ...message.data, Tests: [] });
      }
    }

    if (message.type === "saveTestData") {
      let patient = patientRecords.find(p => p.PID === message.data.PID);
      if (patient) {
        patient.Tests.push({
          TestName: message.data.TestName,
          ResultValue: message.data.ResultValue,
          ApprovedOn: message.data.ApprovedOn
        });
      }
    }

    chrome.storage.local.set({ patientRecords }, () => {
      console.log("Updated patient records:", patientRecords);
      sendResponse({ status: "Data saved successfully" });
    });
  });

  return true;
});
