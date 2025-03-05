import pandas as pd
import tkinter as tk
from tkinter import filedialog
import os

# Open file dialog to select the file (CSV or Excel)
root = tk.Tk()
root.withdraw()  # Hide the root window
file_path = filedialog.askopenfilename(title="Select File", filetypes=[("Excel Files", "*.xlsx"), ("CSV Files", "*.csv")])

# Check if a file was selected
if not file_path:
    print("No file selected. Exiting...")
    exit()

# Flag to track if a temporary CSV file was created
temp_csv_created = False

# Convert Excel to CSV if needed
if file_path.endswith(".xlsx"):
    df = pd.read_excel(file_path)  # Read Excel file
    temp_csv_path = file_path.replace(".xlsx", ".csv")
    df.to_csv(temp_csv_path, index=False)  # Save as CSV
    file_path = temp_csv_path  # Update path to the converted CSV
    temp_csv_created = True  # Mark that a temporary file was created

# Define output path
output_path = file_path.replace(".csv", "_transformed.xlsx")

# Load the dataset
df = pd.read_csv(file_path)

# Pivot the data to organize test results
df_pivot = df.pivot_table(index=["Age", "Gender", "Mobile", "Name", "PID"], 
                           columns="TestName", 
                           values="ResultValue", 
                           aggfunc="first").reset_index()

# Remove multi-index from columns
df_pivot.columns.name = None  

# Save the transformed data to Excel
df_pivot.to_excel(output_path, index=False)

# Delete the temporary CSV file if it was created
if temp_csv_created:
    os.remove(file_path)

print(f"Transformation complete! File saved as: {output_path}")
