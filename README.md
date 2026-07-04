# Privacy Tracker

A privacy-focused, zero-cookie, open-source analytics platform designed for lightweight self-hosting. Track page views, referrers, and device types on your website without annoying cookie banners or privacy violations.

## Core Philosophy & Privacy Design

Unlike traditional analytics tools (e.g., Google Analytics) that build long-term user profiles and require intrusive cookie consent banners, **Privacy Tracker** operates with strict compliance under GDPR, CCPA, and the ePrivacy Directive:

1. **No Cookies / LocalStorage**: The client-side script does not read, write, or require local browser cookies or storage.
2. **Anonymized Sessions**: The server discards the raw IP address immediately. It generates a daily-rotating session hash using:
   `SHA256(IP + UserAgent + WebsiteID + DailyDateSalt)`
   This allows tracking unique visitors and page path flow for a single calendar day without building persistent cross-day identity profiles.
3. **Vanilla JS Tracker**: The tracking script is tiny (< 1KB), non-blocking, and loads asynchronously.

## Features

- **Multi-Site Dashboard**: Track multiple domain configurations under a single unified view.
- **Real-Time Telemetry**: Real-time page view counts, top pages, referrers, and device breakdown.
- **Easy Self-Hosting**: Built with Next.js, Prisma, and SQLite—runs instantly on a low-resource VPS without database servers.
- **PostgreSQL Compatibility**: Easily swap SQLite for PostgreSQL by changing a single environment variable.
- **Passwordless Admin Access**: Log in securely using magic email links.

---

## Getting Started

### 1. Installation

```bash
git clone https://github.com/your-username/privacy-tracker.git
cd privacy-tracker
npm install
```

### 2. Configure Database & Environment

Create a `.env` file in the root of the project:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="https://your-analytics-domain.com"

# WebAuthn Host/Origin Constraints (Protects against Host header spoofing)
ALLOWED_RP_ID="your-analytics-domain.com"
ALLOWED_RP_ORIGIN="https://your-analytics-domain.com"
```

Sync the database schema:
```bash
npx prisma db push
```

### 3. Build & Run

```bash
npm run build
npm run dev
```

---

## Client Integration

Embed this code in the `<head>` or before `</body>` of the websites you want to track:

```html
<script 
  src="https://your-analytics-domain.com/tracker.js" 
  data-endpoint="https://your-analytics-domain.com/api/collect"
  data-website-id="YOUR_WEBSITE_ID"
  async
></script>
```

---

## 🤖 Developer & Agent Context

This repository includes an [AGENTS.md](AGENTS.md) file in the root directory. It contains detailed directory structures, database schema models, authentication flow diagrams, and coding standards specifically designed for human developers and **AI Coding Agents** to quickly parse and contribute safely to this project.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
