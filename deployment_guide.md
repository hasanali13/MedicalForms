# Deployment Guide: Portainer & HestiaCP

This guide explains how to deploy the MedicalForms application using Portainer for container management and HestiaCP as a reverse proxy.

## Prerequisites

- Server with Docker & Portainer installed.
- HestiaCP installed and running.
- A domain pointing to your server IP (e.g., `forms.example.com`).

## Step 1: Deploy with Portainer

1. Login to your **Portainer** instance.
2. Go to **Stacks** > **Add stack**.
3. Name the stack: `medical-forms`.
4. Select **Upload** (if uploading `docker-compose.yml` directly) or **Repository** (if connecting to Git).
    - *Method A (Manual Editor)*: Copy the contents of `docker-compose.yml` and paste it into the Web Editor.
5. **Environment Variables**:
    - You can change the `MSSQL_SA_PASSWORD` in the Compose file if needed. Update the connection string in the `app` service to match!
6. Click **Deploy the stack**.

Wait for the containers (`medical_forms_app` and `medical_forms_db`) to start. You can check the logs of `medical_forms_app` to ensure it says "Application started...".

## Step 2: Configure HestiaCP (Reverse Proxy)

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

## Troubleshooting

- **Database Access**: The application automatically tries to create the database on startup. If you see connection errors in the logs, ensure the `db` container is healthy and the password in the connection string matches the `MSSQL_SA_PASSWORD`.
- **Port Conflicts**: If port `8080` is already in use on your host, change it in `docker-compose.yml` (e.g., `8081:8080`) and update the HestiaCP Proxy Pass to `http://127.0.0.1:8081`.
