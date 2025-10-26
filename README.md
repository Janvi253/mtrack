This is an internal tracking dashboard built with [Next.js](https://nextjs.org) and Tailwind CSS.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Authentication
Navigate to `/login` to sign in. After a successful login you are redirected to the home (Daily Task) view.

### Request Form
A green "Request Form" button has been added to the login page. You can also visit `/request-form` directly once you know the route. The form currently stores state locally and just shows an alert on submit (replace with an API call under `src/app/request-form/page.tsx`).

### Tech Notes
- Next.js App Router
- Tailwind CSS v4 (via `@tailwindcss/postcss` plugin) – global styles in `src/app/globals.css`
- Reusable navigation component in `src/components/Navbar.tsx`

## Future Improvements
- Persist Request Form submissions to a database (e.g. MongoDB API route under `src/app/api/requests`).
- Add validation & field-level error messages.
- Display analytics dashboards (charts) using a chart library.
- Role-based access control.

## Folder Structure (Relevant Parts)
```
src/
	app/
		login/page.tsx          # Login with Request Form button
		request-form/page.tsx   # New Request Form page
		layout.tsx              # Root layout with Navbar
	components/
		Navbar.tsx
```

## Deployment
Build and start:
```bash
npm run build
npm start
```
