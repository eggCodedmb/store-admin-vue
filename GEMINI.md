# GEMINI.md - store-admin-vue

## Project Overview
`store-admin-vue` is a modern administrative dashboard designed for store management. It is built using **Vue 3** and **Vite**, featuring a robust role-based access control (RBAC) system with dynamic route generation.

- **Frontend Framework:** Vue 3 (Composition API, `<script setup>`)
- **Build Tool:** Vite
- **UI Component Library:** Element Plus
- **State Management:** Pinia
- **Routing:** Vue Router (Hash Mode)
- **HTTP Client:** Axios

## Key Features
- **Dynamic Routing:** Routes are dynamically added based on user permissions fetched from the backend.
- **RBAC:** Detailed permission management for menus and buttons.
- **Theming:** Support for Element Plus dark mode.
- **Modular Design:** Clear separation of concerns between APIs, stores, layouts, and views.

## Project Structure
- `src/api/`: Modular API request definitions (e.g., `user.js`, `goods.js`).
- `src/layout/`: Main application layout components.
- `src/router/`: Route configurations, including constant and asynchronous routes.
- `src/store/`: Pinia state management (e.g., `user.js`).
- `src/utils/`: Utility functions, including the Axios instance in `request.js`.
- `src/views/`: Page components categorized by module (Store, User, Goods, System, etc.).

## Building and Running
The following commands are defined in `package.json`:

- **Start Development Server:** `npm run dev` (Default port: 3000)
- **Build for Production:** `npm run build`
- **Preview Production Build:** `npm run preview`

## Development Conventions

### API Requests
- All API requests should be defined in the `src/api/` directory.
- Use the pre-configured Axios instance from `@/utils/request.js`.
- The base URL is currently set to `http://127.0.0.1:8800`.
- Token is automatically injected into the `Authorization` header from `localStorage`.

### State Management
- Use Pinia for global state.
- Follow the pattern established in `src/store/user.js`.

### Routing and Permissions
- **Constant Routes:** Public routes like `/login` and `/404` are defined in `constantRoutes`.
- **Async Routes:** Protected routes are defined in `asyncRoutes` and matched against the `menus` array returned by the `/user/permissions` API.
- Navigation guards in `src/main.js` handle token validation and dynamic route injection.

### UI Standards
- Use **Element Plus** components for consistency.
- Icons are globally registered and should be used from `@element-plus/icons-vue`.
- Chinese (zh-cn) is the default locale for Element Plus.

## Interaction Guidelines
When working on this project, ensure that:
1. New API endpoints are added to the appropriate file in `src/api/`.
2. UI components leverage Element Plus and follow the existing layout patterns.
3. Any changes to the routing logic account for the dynamic permission-based injection system.
