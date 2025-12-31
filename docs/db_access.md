# How to Access the Database with a GUI

You can connect to your dockerized SQL Server using tools like **Azure Data Studio** (recommended), **DBeaver**, or **SSMS**.

## Connection Details

| Setting | Value |
| :--- | :--- |
| **Server / Host** | `localhost` (if running locally) or `<YOUR_SERVER_IP>` |
| **Port** | `1433` |
| **Authentication** | SQL Login |
| **Username** | `sa` |
| **Password** | `YourStrong@Password123` |
| **Database** | `MedicalDb` (or leave default to list all) |
| **Trust Server Certificate** | **True** (Required) |

## Recommended Tools

### 1. Azure Data Studio (Cross-Platform) - Recommended

1. Download from [Microsoft](https://azure.microsoft.com/en-us/products/data-studio/).
2. Open Azure Data Studio and click **New Connection**.
3. Fill in the details:
   - **Connection type**: Microsoft SQL Server
   - **Server**: `localhost` (or server IP)
   - **Authentication type**: SQL Login
   - **User name**: `sa`
   - **Password**: `YourStrong@Password123`
   - **Trust server certificate**: Check this box (True).
4. Click **Connect**.

### 2. DBeaver (Universal)

1. Download from [dbeaver.io](https://dbeaver.io/).
2. Click **New Database Connection** -> **SQL Server**.
3. Fill in the host, port, user, and password.
4. Go to **Driver properties** tab:
   - Search for `trustServerCertificate`.
   - Set it to `true`.
5. Click **Finish**.

### 3. Portainer (Limited GUI)

If you just want to run quick queries without installing an app:

1. Go to your Container in Portainer.
2. Click **Console** (/bin/bash).
3. Run `sqlcmd` directly:

   ```bash
   /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Password123' -C
   ```
