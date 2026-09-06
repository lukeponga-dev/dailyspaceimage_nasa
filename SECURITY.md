# Security Policy

This document outlines the security practices, reporting process, and guidelines for responsibly disclosing vulnerabilities in the **NASA Daily Space Image Viewer** project.

---

## 🔐 Supported Versions

Security updates apply to the latest version of the project:

- **main branch** — actively maintained  
- Older branches or forks — not guaranteed to receive patches

---

## 🛡 Reporting a Vulnerability

If you discover a security issue, please report it responsibly.

**Email:** `hello@lukeponga.dev`  
**Subject:** `Security Report – dailyspaceimage_nasa`

Please include:

- A clear description of the vulnerability  
- Steps to reproduce  
- Potential impact  
- Any suggested fixes (optional)

We will acknowledge your report within **48 hours** and provide a timeline for remediation.

---

## 🚫 Do Not Report Security Issues Via

- GitHub Issues  
- GitHub Discussions  
- Social media  
- Public forums

These channels are not monitored for sensitive disclosures.

---

## 🔍 What Constitutes a Security Issue?

Examples of valid security concerns:

- Exposure of API keys or environment variables  
- Authentication or authorization bypass  
- Remote code execution  
- Injection vulnerabilities (XSS, SQLi, etc.)  
- Sensitive data leaks  
- Broken access control  
- Unsafe dependency versions

---

## 🧪 Non‑Security Issues

The following are **not** considered security vulnerabilities:

- UI bugs  
- Performance issues  
- Missing features  
- Documentation errors  
- Rate limit errors from NASA API  
- Incorrect APOD data returned by NASA

Please report these via normal GitHub Issues.

---

## 🔧 Security Best Practices (Project Maintainers)

Maintainers follow these guidelines:

- Keep dependencies updated  
- Avoid exposing API keys in client-side code  
- Use server-side fetching for NASA APOD API  
- Validate and sanitize all external data  
- Use HTTPS for all deployments  
- Follow Vercel’s security recommendations  
- Rotate API keys if suspicious activity is detected

---

## 🏷 Responsible Disclosure

We appreciate responsible disclosure and will:

- Investigate all reports  
- Patch confirmed vulnerabilities  
- Credit contributors (optional)  
- Avoid punitive action for good-faith research

---

## 🙌 Thank You

Your efforts help keep the NASA Daily Space Image Viewer safe for everyone.  
We appreciate your time and commitment to responsible security practices.
