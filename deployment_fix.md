# How to Fix Vercel 404 Not Found Error

The "404: NOT_FOUND" error on Vercel typically occurs when Vercel's build system cannot find the entry point of your web application. In your project structure, the code resides in a subdirectory named `studio-main`, while the repository root likely contains nothing but that folder.

## Root Cause
When you deploy to Vercel, it defaults to looking for a `package.json` in the **root directory** of your repository. Since your `package.json` is inside `studio-main/`, Vercel doesn't know how to build or serve the application, resulting in a 404.

## Solution: Configure Root Directory on Vercel

The most efficient way to fix this without moving your files is to tell Vercel where the app lives:

1.  **Open your Project on Vercel Dashboard.**
2.  Go to **Settings** > **General**.
3.  Scroll down to the **Root Directory** section.
4.  Click **Edit** and select the `studio-main` folder.
5.  Click **Save**.
6.  **Redeploy** your project (go to the "Deployments" tab and click "Redeploy" on the latest one).

---

## Alternative: Add vercel.json (Not Recommended for this case)
You *could* add a `vercel.json` at the roots, but setting the Root Directory in the UI is the standard "best practice" for monorepos or projects with subdirectories.

## Concept: What is Vercel protecting you from?
Vercel is a Zero-Config deployment platform, but it requires a standard structure (like `package.json` at the root) to work "magically". By throwing a 404, it's telling you that the static output it expected to find after a build doesn't exist. Setting the `Root Directory` tells Vercel's build pipeline to "CD" into that folder before running `npm install` and `npm run build`.

## Warning Signs to Watch For
- Always check if your `package.json` is at the root.
- If using a monorepo structure, always verify the "Root Directory" settings in your deployment platform (Vercel, Netlify, etc.).
- A "404" on the root URL `/` immediately after a successful-looking deployment is the number one sign of an incorrect root directory.
