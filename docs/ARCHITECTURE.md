# Privacy Tracker: Architecture & Philosophy

This document outlines the core technical architecture, privacy protocols, and security guardrails implemented in **Privacy Tracker**.

---

## 🔒 1. Privacy-Respecting Telemetry Design

Our telemetry collection philosophy prioritizes user anonymity while providing site owners with meaningful insights. We strictly comply with GDPR, CCPA, and ePrivacy regulations by eliminating visitor cookies entirely.

### Daily-Rotating Session Hashes
To track unique visitor flow through a website without storing persistent identifiers, we generate an ephemeral `sessionId` using a SHA-256 hash containing:
- Visitor IP address (discarded immediately after hashing, never saved to disk).
- User-Agent string.
- The site's unique Website ID.
- A daily-rotating cryptographic date salt.

$$\text{SessionID} = \text{SHA-256}(\text{IP} + \text{UserAgent} + \text{WebsiteID} + \text{DailyDateSalt})$$

*Why this is secure*: 
- An attacker cannot reverse the hash to recover the user's IP.
- Because the date salt rotates daily, visitor profiles cannot be tracked across different calendar days.

---

## 🛡️ 2. Request Origin Verification (Anti-Spoofing)

To protect the server from spam, domain spoofing, and unauthorized hits using your tracking key:

1.  **Header Verification**: On every hit, `/api/collect` parses the HTTP `Origin` or `Referer` headers.
2.  **Domain Matching**: The parsed hostname is compared directly to the registered target `domain` of the tracked website.
3.  **Strict Blocking**: Requests originating from unauthorized external domains return a `403 Forbidden` response.
4.  **Bypass Configuration**: For testing, you can set `DISABLE_ORIGIN_VERIFICATION=true` in your `.env` file. Localhost requests are allowed by default to facilitate local development.

---

## 🔑 3. Biometric Passkey Authentication

Instead of traditional passwords which are susceptible to brute-forcing, credential stuffing, and phishing, the administrative panel is guarded exclusively by **FIDO2/WebAuthn Passkeys**:

- **No Passwords**: The database only stores base64-encoded public keys and counter values; no credentials exist on the server to be leaked.
- **Phishing Protection**: Authenticator credentials are cryptographically bound to the Relying Party ID (`ALLOWED_RP_ID`), protecting you against DNS/Host header spoofing.
- **Stateless Verification**: Challenges are stored in secure, short-lived HTTP-only cookies (`auth_challenge`), keeping session states stateless.
