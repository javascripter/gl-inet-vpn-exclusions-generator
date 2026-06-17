# GL.iNet VPN Exclusions Generator

A simple web tool that provides an automatically updating domain and IP exclusion subscription for your GL.iNet router (running firmware v4.7+).

The generated link dynamically fetches the latest routing rules (synced with AdGuard), allowing you to bypass the VPN for selected streaming platforms, social networks, games, or custom websites and IP addresses of your choice.

<img src="./screenshot.png" width="640" alt="GL.iNet VPN Exclusions Generator Screenshot" />

## How to Use

### Step 1: Select Services & Add Custom Rules
1. Open the web application.
2. Select the services you want to exclude from the VPN (e.g., Netflix, YouTube, Spotify).
3. (Optional) In the **Custom Exclusions** box, type any specific domains (e.g., `mybank.com`) or IP addresses (e.g., `1.1.1.1`) you also want to bypass the VPN, one per line.

### Step 2: Copy the Subscription Link
1. Once you have made your selections, click the **Copy Link** button next to the generated subscription URL.
2. The URL will look like: `https://your-domain.vercel.app/api/exclusions?services=netflix%2Cyoutube&custom=mybank.com`

### Step 3: Paste the Link into Your GL.iNet Router
1. Log into your GL.iNet Admin Panel.
2. Go to **VPN** ➔ **VPN Dashboard**.
3. Under your active VPN profile (e.g., WireGuard or OpenVPN), look for the **Primary Tunnel** settings.
4. Click the **To** dropdown and select **Exclude specified Domain / IP List**.
5. Set the Mode switch to **Subscription URL**.
6. Paste the copied subscription link into the **Input URL Link** field.
7. Click **Apply** (or **Detect**).
8. Ensure the **Primary Tunnel** toggle is switched **On**.


## Local Development

If you want to run this application locally:

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

