# Code Vault

A private, cross-device code snippet vault built with Next.js and Vercel Blob.

## Features

- Save Python, React, JavaScript, TypeScript, SQL, Java, C/C++, Bash, HTML/CSS and plain text snippets
- Search snippets by title, notes, tags, language, or code
- Edit, copy, and delete snippets
- Password-gated API access
- Mobile-friendly UI
- Private Vercel Blob storage for snippet data

## Deploy on Vercel

1. Import this repository into Vercel.
2. In the project, create/connect a **Private Vercel Blob** store.
3. Add an environment variable named `APP_PASSWORD` with a strong password.
4. Redeploy once after adding the environment variable if Vercel does not do it automatically.
5. Open the deployment URL on any device and enter the same password.

New Blob connections on Vercel can use OIDC automatically, so the app does not need to expose storage credentials to the browser.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

For full local persistence, link the project with Vercel and pull the Blob environment configuration.
