# 🧪 Biochemical Data Extractor (MIAS Tool)

<!-- BADGES -->

![License](https://img.shields.io/badge/license-MIT-green)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![Status](https://img.shields.io/badge/status-Active-success)

---

## 🌟 Overview

The **Biochemical Data Extractor (MIAS Tool)** is a powerful and elegant Chrome Extension designed for **high-efficiency data collection**.

It seamlessly integrates with the **MIAS hospital information system** to scrape, persist, and transform complex patient test results into a **unified, analyst-ready CSV format**.

**🎯 Target Goal:** Transform hierarchical, multi-entry patient test data into a clean, pivoted, single-row structure — ready for direct analysis in **Excel** or any **statistical software**.

---

## ✨ Core Features & Functionality

| Icon | Feature                   | Description                                                                                    |
| ---- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| ⚡️   | **One-Click Extraction**  | Capture individual test results using an injected button or **Spacebar** shortcut.             |
| 💾   | **IndexedDB Persistence** | Secure, local storage of patient records and test results using the Service Worker.            |
| 🔄   | **Smart Merging**         | Prevents duplicate entries and auto-updates demographics (Name, Age, PID).                     |
| 📊   | **Pivoted CSV Export**    | Converts data into wide-format CSV with unique tests as columns (e.g., FBS, TSH, T.CHOL).      |
| 🗑️  | **Granular Management**   | Full-page view (`view.html`) for browsing, deleting single tests, or clearing patient records. |
| 🔔   | **Elegant Feedback**      | Non-intrusive toast notifications (Success, Duplicate Warning, Error).                         |

---

## 🖼️ Screenshots
**🔹 Popup UI**

<img width="408" height="405" alt="image" src="https://github.com/user-attachments/assets/91ae68aa-d8ad-44bf-a5f7-6d012e298633" />

*A quick access popup with controls for exporting data, viewing collected records, and clearing local storage.*

**🔹 Data Management (view.html)**
<img width="1920" height="839" alt="image" src="https://github.com/user-attachments/assets/bbde76ac-0c7c-427c-a336-363d9489b6ca" />

*A full-page interface to view and manage all collected patient data.*


## 🚀 Installation & Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/YourUsername/biochemical-data-extractor.git
   cd biochemical-data-extractor
   ```

2. **Load as Unpacked Extension**

   * Open Chrome (or any Chromium-based browser).
   * Navigate to `chrome://extensions`.
   * Enable **Developer mode** (top-right).
   * Click **Load unpacked**.
   * Select the `biochemical-data-extractor` folder.
     ✅ The MIAS Tool icon will now appear in your browser toolbar.

---

## ⚙️ Technical Deep Dive

### `background.js` (Service Worker)

* Acts as the **single source of truth** for data persistence.
* **Storage Layer:** Manages IndexedDB operations (read, write, delete).
* **Pivoting Logic:** Flattens `Patient { Tests: [...] }` into wide CSV format with dynamically generated test columns.

### `content.js` (Injected Script)

* Interfaces directly with the **MIAS system’s DOM and APIs**.
* **Scraping:** Extracts test results (TestName, ResultValue, ApprovedOn).
* **Profile Fetching:** Intercepts API calls (`Casesheetview.aspx`) to capture demographics.
* **Messaging:** Relays test data to the Service Worker for persistence.

### `view.js` / `view.html` (Data Management Interface)

* Provides a **standalone UI** for record management.
* **Real-Time Updates:** Listens for `dataUpdated` events from the Service Worker.
* **Action Delegation:** Delete requests are executed via messaging, preventing direct DB access from the UI.

---

## 👤 Author & Support

**Project by:** Sundaresan Nithiyanandam

📧 **Connect:**

* **LinkedIn:** [Your LinkedIn Profile](https://www.linkedin.com/in/myselfsundar/)
* **GitHub:** [Your GitHub Profile](https://github.com/drdroid7)

---

<p align="center"><b>🚀 Data Extraction Simplified.</b></p>
