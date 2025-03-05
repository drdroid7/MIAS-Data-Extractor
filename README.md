<div align="center">  
  <img src="https://img.shields.io/badge/MIAS%20Suite-Chrome%20Extension-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="MIAS Suite Badge">  
  <h1>MIAS Suite - Chrome Extension</h1>  
  <p>A powerful extension to extract, store, and manage biochemical test values efficiently.</p>  
</div>  

---

## 🚀 Overview  
**MIAS Suite** is a **Chrome extension** designed to automate **biochemical test data extraction** from a password-protected medical website. It ensures **efficient storage**, **intelligent test panel handling**, and **seamless Excel export** while maintaining an intuitive UI/UX.  

🔹 **Extract patient and test data with one click**  
🔹 **Export to Excel**
---

## ✨ Features  

### 🔍 Automated Data Extraction  
✔️ Click **'Extract Patient Data'** to capture **Patient Name & PID**  
✔️ Click **'Extract Test Data'** to extract **Test Name, Result Value & Approved On**  

### 📂 Efficient Storage with Chrome Local Storage
✔️ **Stores extracted data locally** for faster retrieval  
✔️ **Prevents performance lag** with periodic data flushing  

### 📊 Seamless Data Export  
✔️ Export test results as an **Excel file**  

### 🖥 User-Friendly UI/UX  
✔️ **Well-aligned buttons** for smooth workflow  
✔️ **Live status updates & patient count display**  

### ⚙️ Data Transformation Tools  
✔️ **Transform Exported Data**:  
   - Python script (`transform.py`) to pivot CSV/Excel test data into a structured Excel format  
   - Organizes data by `Age`, `Gender`, `Mobile`, `Name`, `PID`, with `TestName` as columns  
   - Supports both `.csv` and `.xlsx` inputs via a file picker UI (using `tkinter`)  
   - Outputs a new Excel file with `_transformed` suffix (e.g., `data_transformed.xlsx`)  
✔️ **Run Easily on Windows**:  
   - Batch script (`run_transform.bat`) to execute `transform.py` from its directory  
   - Keeps terminal open after execution for feedback

---

## 🛠 Installation Guide  

1. **Clone this repository**  
   ```bash
   git clone https://github.com/yourusername/MIAS-Suite.git
   ```
2. **Open Chrome Extensions** (`chrome://extensions/`)  
3. **Enable Developer Mode** (toggle at the top right)  
4. **Click "Load Unpacked"** and select the cloned folder  
5. **Extension is now ready to use! 🚀**  

---

## 📖 Usage Guide  

1️⃣ **Navigate to the medical website**  
2️⃣ Click **'Extract Patient Data'** → Saves **Patient Name & PID**  
3️⃣ Click **'Extract Test Data'** → Saves **Test Name, Result & Approved On**  
4️⃣ **Data is securely stored in Chrome Local Storage**  
5️⃣ Export data as **Excel file** 
6️⃣ Transform Exported Data (Optional):

Run run_transform.bat (Windows) or python transform.py
Select your exported .csv or .xlsx file
Check the output file (e.g., data_transformed.xlsx)

---

## 🤝 Contributing  
🔹 Fork the repository & create a new branch  
🔹 Open issues for **bugs or feature requests**  
🔹 Submit a **pull request** with your enhancements  

---

## 📜 License  
This project is licensed under the **MIT License**.  

---

### 🎯 Future Improvements  
🚀 Enhance **Google Drive file organization**  
🚀 Implement **AI-based test result analysis**  
