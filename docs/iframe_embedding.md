# Iframe Embedding Guide

The Medical Forms application supports embedding the public form (`/ViewPublicForms/FillForm`) into external websites using an `<iframe>`.

## How to Embed

To embed the form, use the following HTML snippet:

```html
<iframe 
    src="https://your-domain.com/ViewPublicForms/FillForm" 
    width="100%" 
    height="800px" 
    frameborder="0"
    allow="geolocation; microphone; camera"
></iframe>
```

## Features

- **Sidebar-Free**: The embedded form automatically uses a simplified layout (`_PublicLayout.cshtml`) that removes the admin sidebar and navigation.
- **Responsive**: The form is designed to work within various iframe widths.

## Security Requirements

### 1. HTTPS Requirement
Because the application uses `SameSite=None` and `Secure=Always` for cookies (to ensure anti-forgery tokens work across domains), the application **MUST** be served over **HTTPS**. If served over HTTP, browsers will block the cookies, and form submission will fail.

### 2. Frame Ancestors
By default, the application allows framing from **any** domain (`frame-ancestors *`). 

If you wish to restrict framing to specific trusted domains only, you can modify the middleware in `Program.cs`:

```csharp
// In Program.cs
context.Response.Headers["Content-Security-Policy"] = "frame-ancestors https://trusted-domain.com https://another-domain.com;";
```

## Troubleshooting

- **Form won't submit**: Check if the site is running on HTTPS. Open the browser console and look for cookie-related warnings.
- **Refused to display in a frame**: Ensure the `X-Frame-Options` header is being correctly removed by the middleware for the `/FillForm` path.
