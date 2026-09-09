# Code Vault

A private, cross-device code snippet vault built with Next.js and Vercel Blob.

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSaumendraRaul%2FPython-codes&project-name=code-vault-billi&repository-name=code-vault&env=APP_PASSWORD&envDescription=Choose%20a%20strong%20password%20to%20unlock%20your%20private%20Code%20Vault.&stores=%5B%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22private%22%7D%5D)

The Vercel setup flow will ask you to choose `APP_PASSWORD` and will create a **private Vercel Blob** store for the saved snippets.

## Features

- Save Python, React, JavaScript, TypeScript, SQL, Java, C/C++, Bash, HTML/CSS and plain text snippets
- Search snippets by title, notes, tags, language, or code
- Edit, copy, and delete snippets
- Password-gated API access
- Mobile-friendly UI
- Private Vercel Blob storage for snippet data

## Manual Vercel setup

1. Import this repository into Vercel.
2. In the project, create/connect a **Private Vercel Blob** store.
3. Add an environment variable named `APP_PASSWORD` with a strong password.
4. Redeploy once after adding the environment variable if Vercel does not do it automatically.
5. Open the deployment URL on any device and enter the same password.

New Blob connections on Vercel can use OIDC automatically, so the app does not expose storage credentials to the browser.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

For full local persistence, link the project with Vercel and pull the Blob environment configuration.
