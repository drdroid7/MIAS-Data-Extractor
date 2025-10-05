This is a great request\! To achieve a more attractive and advanced look, I'll incorporate modern README practices, including badges, stylized headers, and structured blockquotes for technical depth.

Here is the enhanced and highly attractive README file for your project:

-----

````markdown
# 🧪 Biochemical Data Extractor (MIAS Tool)

<!-- BADGES -->
![Version](https://img.shields.io/badge/Version-1.0-blue.svg)
![Language](https://img.shields.io/badge/Language-JavaScript-yellow.svg)
![Framework](https://img.shields.io/badge/Browser-Chrome%20MV3-red.svg)
![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)

---

## 🌟 Overview

A powerful and elegant Chrome Extension designed for high-efficiency data collection. The **Biochemical Data Extractor** seamlessly integrates with the MIAS hospital information system to scrape, persist, and transform complex patient test results into a unified, analyst-ready CSV format.

> 🎯 **Target Goal:** Transform hierarchical, multi-entry patient test data into a clean, pivoted, single-row structure, ready for direct analysis in Excel or statistical software.

---

## ✨ Core Features & Functionality

| Icon | Feature | Description |
| :---: | :--- | :--- |
| ⚡️ | **One-Click Extraction** | Uses a dynamically injected button and a **Spacebar** shortcut to capture individual test results from the target modal. |
| 💾 | **IndexedDB Persistence** | Patient records and all associated tests are securely stored locally within the browser's Service Worker, ensuring data continuity. |
| 🔄 | **Smart Merging** | Automatically updates patient demographics (Name, Age, PID) and prevents the saving of **duplicate test entries** based on matching (Test Name + Result + Date). |
| 📊 | **Pivoted CSV Export** | The core data transformation: generates a wide-format CSV where unique biochemical tests are mapped to individual columns (e.g., `FBS`, `TSH`, `T.CHOL`). |
| 🗑️ | **Granular Management** | A dedicated full-page view (`view.html`) allows users to monitor all collected data and perform **single-test deletion** or **full patient record removal**. |
| 🔔 | **Elegant Feedback** | Non-intrusive toast notifications provide immediate status feedback (Success, Warning for Duplicates, Error) directly on the target page. |

---

## 🚀 Installation & Setup

### **1. Clone the Repository**

Clone the project files to your local machine:

```bash
git clone [https://github.com/YourUsername/biochemical-data-extractor.git](https://github.com/YourUsername/biochemical-data-extractor.git)
cd biochemical-data-extractor
````

### **2. Load as Unpacked Extension**

1.  Open **Google Chrome** (or any Chromium-based browser).
2.  Navigate to `chrome://extensions`.
3.  Toggle **Developer mode** on (top right corner).
4.  Click the **Load unpacked** button.
5.  Select the **`biochemical-data-extractor`** directory.

The **MIAS Tool** icon will now appear in your browser toolbar.

-----

## ⚙️ Technical Deep Dive

The architecture ensures maximum reliability and efficiency by isolating concerns across files:

### **`background.js` (Service Worker)**

> The single source of truth for data persistence and heavy lifting. It ensures that the browser tab's status does not affect data operations.

  * **Storage:** Manages IndexedDB connection, read, write, and delete operations.
  * **Pivoting Logic:** Contains the sophisticated logic to flatten hierarchical `Patient { Tests: [...] }` data into a wide CSV format, dynamically determining necessary test columns.

### **`content.js` (Injected Script)**

> Handles the interaction with the target website's DOM and internal API.

  * **Scraping:** Queries the DOM for test result details (`TestName`, `ResultValue`, `ApprovedOn`).
  * **Profile Fetch:** Triggers patient demographic fetching by attaching a listener to the site's existing "View" buttons, intercepting an internal API call (`Casesheetview.aspx` handler) for the profile data.
  * **Messaging:** Uses `chrome.runtime.sendMessage` to delegate all saving and persistent tasks to the Service Worker.

### **`view.js` / `view.html` (Data Management Interface)**

> A completely separate extension page (`chrome-extension://.../view.html`) for managing collected records.

  * **Real-time Updates:** Listens for the `dataUpdated` event broadcast by the Service Worker, ensuring the table automatically refreshes when data is scraped on the target site or deleted on the View page.
  * **Action Delegation:** All delete actions immediately message the Service Worker to perform the database modification, preventing direct DB access from the UI layer.

-----

## 👤 Author & Support

A project by **Sundaresan Nithiyanandam**.

\<div style="padding: 10px 20px; border: 1px solid \#1abc9c; border-radius: 8px; background-color: \#2c3e50; color: white;"\>
\<h4\>📧 Connect:\</h4\>
\<p\>If you encounter any issues, have feature requests, or want to discuss the code, please reach out\!\</p\>
\<ul\>
\<li\>
\<strong\>LinkedIn:\</strong\>
\<a href="[Insert your LinkedIn URL here]" target="\_blank" style="color: \#3498db; text-decoration: none;"\>[Your LinkedIn Profile Link]\</a\>
\</li\>
\<li\>
\<strong\>GitHub:\</strong\>
\<a href="[Insert your GitHub URL here]" target="\_blank" style="color: \#3498db; text-decoration: none;"\>[Your GitHub Profile Link]\</a\>
\</li\>
\</ul\>
\</div\>

-----

\<p align="center"\>
🚀 Data Extraction Simplified.
\</p\>

```
```
