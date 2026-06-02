# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Store management admin dashboard (Chinese UI, zh-cn locale). Vue 3 + Vite, plain JavaScript (no TypeScript). No ESLint, Prettier, or test framework configured.

## Commands

- `npm run dev` — Dev server on port 3000 (auto-opens browser)
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Architecture

**Stack:** Vue 3 Composition API (`<script setup>`), Element Plus, Pinia, Vue Router (hash mode), Axios, ECharts, @vueuse/core.

**No `@` path alias** — all imports use relative paths (e.g., `../../api/goods`). `vite.config.js` is minimal.

**Backend** expected at `http://127.0.0.1:8800`. API response format: `{ code: 0, result: ..., message: ... }` — non-zero `code` is treated as error.

### Auth & RBAC

1. Login via captcha + credentials → JWT stored in `localStorage` as `token`
2. First authenticated navigation triggers `userStore.getPermissions()` which returns `{ user, roles, menus, buttons }`
3. `menus` (route paths like `"/goods_manage"`) are matched against `asyncRoutes` in `src/router/index.js` and injected via `router.addRoute()` in the `beforeEach` guard in `src/main.js`
4. `buttons` (identifiers like `"goods:add_btn"`) are checked in templates with `userStore.buttons.includes(...)` to show/hide action buttons

### Key directories

- `src/api/` — One module per domain (goods, order, user, rbac, etc.). Each exports named functions wrapping the Axios instance from `src/utils/request.js`
- `src/store/user.js` — Single Pinia store holding auth state, permissions, menus, and buttons
- `src/router/index.js` — `constantRoutes` (always available) and `asyncRoutes` (permission-gated, dynamically injected)
- `src/layout/index.vue` — App shell: collapsible sidebar, header with breadcrumbs/search/theme toggle/notifications, main content area
- `src/views/` — Page components per module, following a table + pagination + dialog pattern with Element Plus
- `src/components/BaseChart.vue` — Reusable ECharts wrapper with dark mode and resize handling

### Conventions

- All UI uses Element Plus components (`el-card`, `el-table`, `el-pagination`, `el-form`, `el-dialog`, `el-upload`)
- Element Plus icons are globally registered in `src/main.js` — use them directly in templates
- Image uploads POST to `<baseURL>/upload` with Bearer token; image URLs from backend are relative — prepend `baseURL` for display
- New API endpoints go in the appropriate file under `src/api/`, using the shared Axios instance
- Dark mode is handled via `useColorMode` from `@vueuse/core` and Element Plus dark CSS variables
