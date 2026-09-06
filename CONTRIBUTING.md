# Contributing

Thank you for your interest in contributing to **NASA Daily Space Image Viewer**!  
This project welcomes improvements to UI, API logic, documentation, accessibility, and overall developer experience.

---

## 🧩 How to Contribute

### 1. Fork the Repository

Fork the project on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-username>/dailyspaceimage_nasa.git
cd dailyspaceimage_nasa
```
---

### 2. Create a Feature Branch

```bash
git checkout -b feature/my-new-feature
```

Use clear, conventional commit messages:

`
feat: add HD modal loading animation
fix: correct APOD date validation
docs: update README installation steps
`

---

## 🧪 Development Workflow

Install dependencies

```bash
npm install
```

Start the dev server

```bash
npm run dev
```

---

## ✔ Code Standards

- Follow Next.js + React best practices
- Use Tailwind CSS for styling
- Prefer server-side fetching for APOD data
- Keep components small, readable, and documented
- Use TypeScript for type safety
- Ensure all new UI is accessible (keyboard + ARIA)

---

## 🔍 Testing & Checks

Before submitting a PR, run:

```bash
npm run lint
npm run typecheck
npm run build
```

These match Vercel’s deployment checks.

---

## 📤 Submitting a Pull Request

1. Push your branch:

```bash
git push origin feature/my-new-feature
```

2. Open a Pull Request against main
3. Provide a clear description of:
   - What you changed
   - Why you changed it
   - Screenshots (if UI-related)
4. Wait for review and feedback

---
