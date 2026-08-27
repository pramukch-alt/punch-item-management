import pandas as pd

# Create a DataFrame with the exact column names expected by the backend
data = {
    'running_no': ['CIV-2026-0001', '', ''],
    'discipline': ['CIV', 'MEC', 'ELE'],
    'category': ['A', 'B', 'C'],
    'kks_tag': ['10LAB10 CT001', '', '20MBA20 AA002'],
    'description': ['Wall crack in control room (Update example)', 'Pump vibration high (New item example)', 'Lighting broken in hallway (New item example)']
}

df = pd.DataFrame(data)

# Save to Excel
output_path = r'D:\Punch Item List\PunchItem_BulkUpload_Template.xlsx'
df.to_excel(output_path, index=False)

print(f"Template created at: {output_path}")
