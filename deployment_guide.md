# Deployment Guide

This guide covers two deployment paths for MedicalForms:

- **Path A — Portainer + HestiaCP**: use `docker-compose.yml`, expose port `8080` on the host, and proxy to it from HestiaCP.
- **Path B — Dokploy**: use `dokploy.yml`, let Dokploy's built-in Traefik terminate TLS and route by hostname. No host ports required.

Pick one. Don't deploy both against the same database volume.

## Path A: Portainer & HestiaCP

Uses `docker-compose.yml` at the repo root.

### Prerequisites

- Server with Docker & Portainer installed.
- HestiaCP installed and running.
- A domain pointing to your server IP (e.g., `forms.example.com`).

### Step 1: Deploy with Portainer

1. Login to your **Portainer** instance.
2. Go to **Stacks** > **Add stack**.
3. Name the stack: `medical-forms`.
4. Select **Repository** (Recommended).
    - **Repository URL**: `https://github.com/hasanali13/MedicalForms.git`
    - **Repository Reference**: `refs/heads/main` (or your branch name)
    - **Compose path**: `docker-compose.yml` *(do not use `dokploy.yml` here — that file is for Path B and requires the external `dokploy-network`)*
5. **Environment Variables**:
    - Add `ASPNETCORE_ENVIRONMENT` = `Production`
    - Add `MSSQL_SA_PASSWORD` = `YourStrong@Password123`
    - *Note*: The `ConnectionStrings__MedicalContext` is already defined in the compose file to use the db service, but you can override it here if needed.
6. Click **Deploy the stack**.

Portainer will clone your repository, build the Docker image (since the compose file specifies a build context), and start the application.

Wait for the containers (`medical_forms_app` and `medical_forms_db`) to start. You can check the logs of `medical_forms_app` to ensure it says "Application started...".

### Step 2: Configure HestiaCP (Reverse Proxy)

1. Login to **HestiaCP**.
2. Go to **Web** and click **Add Web Domain**.
3. Enter your domain name (e.g., `forms.example.com`).
4. Uncheck "DNS Support" and "Mail Support" (unless you need them).
5. Click **Save**.
6. Click on the domain you just created to edit it.
7. Check **SSL Support** -> **Lets Encrypt Support** (to get HTTPS).
8. Click **Advanced Options**.
9. **Proxy Template**: Choose `default`.
10. **Backend Template**: Choose `default`.
11. **Custom Nginx Configuration**:
    You need to forward traffic to the local Docker port (8080).

    If HestiaCP supports "Proxy Pass" in the UI (newer versions), set:
    - **Proxy Pass**: `http://127.0.0.1:8080`

    *If there is no direct UI field, use the "Nginx Config" button or manually edit the config:*

    ```nginx
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    ```

12. Click **Save**.

### Troubleshooting

- **Database Access**: The application automatically tries to create the database on startup. If you see connection errors in the logs, ensure the `db` container is healthy and the password in the connection string matches the `MSSQL_SA_PASSWORD`.
- **Port Conflicts**: If port `8080` is already in use on your host, change it in `docker-compose.yml` (e.g., `8081:8080`) and update the HestiaCP Proxy Pass to `http://127.0.0.1:8081`.

## Path B: Dokploy

Uses `dokploy.yml` at the repo root. Dokploy ships with a Traefik reverse proxy and Let's Encrypt resolver, so you don't need HestiaCP or host port bindings.

### Prerequisites

- A running Dokploy instance (Traefik + `dokploy-network` are created during Dokploy install).
- Domains pointing to the Dokploy host:
  - `forms.example.com` for the app
  - `adminer.example.com` for Adminer (optional — remove if you don't want it public)

### Step 1: Create the Compose service

1. In Dokploy, create a new **Project**, then add a **Compose** service.
2. **Source**: select Git and point to the repo (`https://github.com/hasanali13/MedicalForms.git`, branch `main`).
3. **Compose Path**: `dokploy.yml`
4. **Compose Type**: `docker-compose`.

### Step 2: Set environment variables

In the service's **Environment** tab:

```env
APP_HOST=forms.example.com
ADMINER_HOST=adminer.example.com
MSSQL_SA_PASSWORD=YourStrong@Password123
```

`dokploy.yml` reads all three via `${...}` — the compose file itself contains no secrets and no hostnames.

### Step 3: Deploy

Click **Deploy**. Dokploy will build the app image, start the stack on `dokploy-network`, and Traefik will:

- route `https://forms.example.com` → app container on port 8080
- route `https://adminer.example.com` → adminer container on port 8080
- request Let's Encrypt certificates automatically

The database is only reachable on the internal `medical-net` — it is never exposed to Traefik or the host.

### Notes for Dokploy deployments

- **Adminer exposure**: Leaving Adminer on a public hostname is a significant surface. Either remove the `db-gui` service from `dokploy.yml`, restrict access at Traefik (basicauth middleware), or point `ADMINER_HOST` to a domain behind a VPN.
- **Database backups**: Use Dokploy's **Volumes** UI or `docker cp` into the mssql container just like the Portainer flow below. Volume name will be `<project>_mssql_data`.
- **Iframe embedding**: HTTPS via Traefik satisfies the `SameSite=None` cookie requirement — see note below.

> [!IMPORTANT]
> **Iframe Support & Security**: If you plan to embed the forms in an `<iframe>` on external websites, you **must** use HTTPS. The application is configured with `SameSite=None` cookies for cross-site support, which modern browsers only allow over secure connections. Both paths above provide HTTPS (HestiaCP via Let's Encrypt, Dokploy via Traefik + Let's Encrypt).

## How to Import a Database Backup (.bak)

If you have an existing database backup (e.g., `MedicalDb.bak`), follow these steps to restore it inside the container.

> [!NOTE]
> The commands below assume the Portainer deployment, where the db container is named `medical_forms_db`. On Dokploy the container name will be prefixed by the project/service slug — run `docker ps` and substitute the actual name (or use the container ID).

### 1. Upload the Backup

Upload your `.bak` file to your server (e.g., using FileZilla or SCP) to a know location, for example `/root/MedicalDb.bak`.

### 2. Copy Backup to Container

You need to copy the file from your host server into the running SQL Server container.
Run this command in your server terminal:

```bash
docker cp /root/MedicalDb.bak medical_forms_db:/var/opt/mssql/MedicalDb.bak
```

### 3. Verify File Inside Container

Check if the file is accessible to SQL Server:

```bash
docker exec -it medical_forms_db ls -l /var/opt/mssql/
```

### 4. Restore the Database

You will use the `sqlcmd` tool inside the container to run the T-SQL RESTORE command.

**Option A: Simple Restore (Overwrite)**
If your backup file names align with defaults:

```bash
docker exec -it medical_forms_db /opt/mssql-tools/bin/sqlcmd \
   -S localhost -U sa -P YourStrong@Password123 \
   -Q "RESTORE DATABASE [MedicalDb] FROM DISK = N'/var/opt/mssql/MedicalDb.bak' WITH FILE = 1, NOUNLOAD, REPLACE, STATS = 5"
```

**Option B: Restore with MOVE (If file names differ)**
If you get an error like *"Directory lookup for the file... failed"*, you need to specify the physical paths for the internal database files (`.mdf` and `.ldf`).

1. Check logical names:

    ```bash
    docker exec -it medical_forms_db /opt/mssql-tools/bin/sqlcmd \
       -S localhost -U sa -P YourStrong@Password123 \
       -Q "RESTORE FILELISTONLY FROM DISK = N'/var/opt/mssql/MedicalDb.bak'"
    ```

    *Note the output values in the `LogicalName` column (e.g., `MedicalDb` and `MedicalDb_log`).*

2. Run Restore with MOVE:

    ```bash
    docker exec -it medical_forms_db /opt/mssql-tools/bin/sqlcmd \
       -S localhost -U sa -P YourStrong@Password123 \
       -Q "RESTORE DATABASE [MedicalDb] FROM DISK = N'/var/opt/mssql/MedicalDb.bak' WITH MOVE 'MedicalDb' TO '/var/opt/mssql/data/MedicalDb.mdf', MOVE 'MedicalDb_log' TO '/var/opt/mssql/data/MedicalDb_log.ldf', NOUNLOAD, REPLACE, STATS = 5"
    ```
