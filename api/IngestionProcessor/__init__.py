import logging
import azure.functions as func
import pandas as pd
from azure.storage.blob import BlobServiceClient
import pyodbc
from hashlib import md5
import os
from io import BytesIO
from azure.identity import DefaultAzureCredential

# Config
storage_account_url = "https://erpdashboardstorage.blob.core.windows.net"
container_name = "erp-data"
sql_server = "erp-dashboard-server.database.windows.net"
database = "erp-dashboard-db"
driver = "{ODBC Driver 17 for SQL Server}"

# Expected schemas
schemas = {
    "enrollment.csv": {
        "table": "Enrollment",
        "columns": ["StudentID", "Name", "Program", "EnrollmentDate", "Department"]
    },
    "attendance.csv": {
        "table": "Attendance",
        "columns": ["StudentID", "Date", "Status"]
    },
    "grades.csv": {
        "table": "Grades",
        "columns": ["StudentID", "Course", "Grade"]
    }
}

def main(msg: func.QueueMessage) -> None:
    logging.info(f"Processing queue message: {msg.get_body().decode('utf-8')}")
    blob_path = msg.get_body().decode('utf-8')   # e.g. "raw/enrollment.csv"
    file_name = os.path.basename(blob_path)

    try:
        # 1. Connect to Blob with MSI
        credential = DefaultAzureCredential()
        blob_service = BlobServiceClient(account_url=storage_account_url, credential=credential)
        blob_client = blob_service.get_blob_client(container=container_name, blob=blob_path)

        # 2. Download blob
        blob_data = blob_client.download_blob().readall()
        file_hash = md5(blob_data).hexdigest()

        # 3. Read CSV
        df = pd.read_csv(BytesIO(blob_data))

        if file_name not in schemas:
            logging.warning(f"File {file_name} not mapped. Skipping.")
            return

        schema = schemas[file_name]
        if set(df.columns) != set(schema["columns"]):
            logging.error(f"Schema mismatch in {file_name}")
            return

        # 4. Connect to SQL with Managed Identity
        token = credential.get_token("https://database.windows.net/.default").token
        conn_str = f"DRIVER={driver};SERVER={sql_server};DATABASE={database};Authentication=ActiveDirectoryAccessToken"
        conn = pyodbc.connect(conn_str, attrs_before={1256: token})
        cursor = conn.cursor()

        # 5. Insert rows
        placeholders = ",".join(["?" for _ in schema["columns"]])
        query = f"INSERT INTO {schema['table']} ({','.join(schema['columns'])}) VALUES ({placeholders})"

        for _, row in df.iterrows():
            cursor.execute(query, tuple(row[col] for col in schema["columns"]))

        conn.commit()
        cursor.close()
        conn.close()
        logging.info(f"✅ Successfully ingested {file_name}")

    except Exception as e:
        logging.error(f"❌ Error ingesting {file_name}: {e}")
