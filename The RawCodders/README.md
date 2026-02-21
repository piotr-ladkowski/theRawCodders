# Welcome to your Convex + React (Vite) + Convex Auth app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Vite](https://vitest.dev/) for optimized web hosting
- [Tailwind](https://tailwindcss.com/) for building great looking UI
- [Convex Auth](https://labs.convex.dev/auth) for authentication

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```
npm install
npm run dev
```

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t react-vite-convexauth
```

For more information on how to configure Convex Auth, check out the [Convex Auth docs](https://labs.convex.dev/auth/).

For more examples of different Convex Auth flows, check out this [example repo](https://www.convex.dev/templates/convex-auth).

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Run with Docker Compose

You can run Convex backend, Convex dashboard, and the Vite frontend together:

```bash
docker compose up --build
```

Optional environment variables:

- `PORT` (default: `3210`) - Convex backend port
- `SITE_PROXY_PORT` (default: `3211`) - Convex site proxy port
- `DASHBOARD_PORT` (default: `6791`) - Convex dashboard port
- `FRONTEND_PORT` (default: `5173`) - React app port
- `VITE_CONVEX_URL` (default: `http://127.0.0.1:${PORT}`) - URL compiled into the Vite frontend

After startup:

- Frontend: `http://127.0.0.1:${FRONTEND_PORT:-5173}`
- Backend: `http://127.0.0.1:${PORT:-3210}`
- Dashboard: `http://127.0.0.1:${DASHBOARD_PORT:-6791}`

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
