# Haven Market

A small e-commerce demo with a responsive, plain HTML/CSS/JavaScript storefront and an Express/MongoDB API. The storefront reads products and categories from the backend, keeps the shopping bag in browser storage, and supports registration, sign-in, order placement, demo payments, and order history.

## Features

- Responsive storefront with product search, category filters, sorting, favorites, and a persistent cart.
- User registration and sign-in using bearer-token authentication.
- Account profile editing, authenticated checkout, and order history.
- Demo card payment. No real payment is processed.
- Admin dashboard for product, order, and user management.
- Optional Cloudinary support for admin product uploads.

## Requirements

- Node.js (a current LTS release is recommended)
- MongoDB connection string
- npm

## Backend setup

Open a terminal in `backend/` and install dependencies:

```bash
npm install
```

Create `backend/.env` with your own values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/haven-market
JWT_SECRET=replace-this-with-a-long-random-secret

# Required for the seed script admin account
ADMIN_NAME=Store Admin
ADMIN_EMAIL=admin@store.com
ADMIN_PASSWORD=replace-this-password

# Optional: needed only when uploading product images through Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Start MongoDB, then seed the sample catalog and admin account:

```bash
npm run seed
```

The seed script replaces all existing products with the sample catalog. It requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` to be set, and creates an admin only if that email does not already exist. Public registration always creates a regular user; an existing administrator can promote users from the protected admin dashboard.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default. For a normal start without nodemon, use `npm start`. The Express app also serves the frontend directory at `/`.

## Frontend setup

With the backend running, open:

```text
http://localhost:5000/
```

The UI is in `frontend/` and uses no frontend package manager or build step. `index.html` is the storefront; `product.html`, `cart.html`, `checkout.html`, `login.html`, `register.html`, `profile.html`, `orders.html`, and `admin.html` provide the linked product, account, and store-management pages. API requests use the `/api` path on the current site by default, which works when Express serves both the frontend and API from the same origin. Storefront requests are handled in `app.js`; the standalone pages share `pages.js`.

If you deploy the frontend and backend to different domains, set the API base URL in each page's `<head>` before its deferred JavaScript:

```html
<script>
  window.STORE_API_URL = 'https://your-deployed-backend.example.com/api';
</script>
<script defer src="app.js"></script>
```

Replace the example with your deployed backend's real URL, ending in `/api`. The backend currently enables CORS for cross-origin requests. For local development with the frontend served separately from port `5000`, set the value to `http://localhost:5000/api`.

## Demo checkout

Sign in or create an account, add products to your bag, then submit a delivery address and a 16-digit card number. Any 16 digits are accepted except a card number ending in `0000`, which is declined. This is a demo-only payment flow; it does not charge money.

## API overview

All routes are prefixed with `/api`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create an account |
| `POST` | `/auth/login` | Public | Sign in |
| `GET` | `/products` | Public | List products; optional `search` and `category` query parameters |
| `GET` | `/products/categories` | Public | List product categories |
| `GET` | `/products/:id` | Public | Get one product |
| `GET`, `PUT` | `/users/profile` | Signed in | Read or update the current profile |
| `POST` | `/orders` | Signed in | Create an order with `{ items: [{ productId, qty }], shippingAddress }` |
| `GET` | `/orders/mine` | Signed in | List the current user's orders |
| `GET` | `/orders/:id` | Owner or admin | Get an order |
| `POST` | `/payments/:id/pay` | Signed in | Make a demo payment with `{ cardNumber }` |
| `GET` | `/admin/stats`, `/admin/orders`, `/admin/users` | Admin | Admin dashboard data |
| `PUT` | `/admin/orders/:id/status` | Admin | Update an order status |
| `PUT`, `DELETE` | `/admin/users/:id/role`, `/admin/users/:id` | Admin | Change a user's role or remove a user |
| `POST`, `PUT`, `DELETE` | `/products`, `/products/:id` | Admin | Create, edit, or delete catalog products |

For protected endpoints, send `Authorization: Bearer <token>`. Admin product and user-management endpoints are also defined in `backend/Routes/`; admin access requires an account with role `admin`.

## Tests

From `backend/`:

```bash
npm test
```

The auth tests require a reachable MongoDB instance and the `MONGO_URI` environment variable.

## Project layout

```text
backend/
  Config/       MongoDB and Cloudinary configuration
  Controllers/  API request handlers
  Models/       Mongoose schemas
  Routes/       API route definitions
  Services/     Order and image services
  Validations/  Request validation
  data/         Seed products
  scripts/      Database seed script
frontend/
  index.html    Storefront
  product.html  Product details
  cart.html     Shopping bag
  checkout.html Checkout and demo payment
  login.html    Sign in
  register.html Account creation
  profile.html  Profile editing
  orders.html   Customer order history
  admin.html    Admin dashboard
  styles.css    Responsive visual styling
  app.js        Storefront interactions
  pages.js      API integration for standalone pages
```
## Deployed Link
backend/
https://ecommerce-store-codealpha.onrender.com

frontend
https://ecommerce-store-task-1-codealphatec-chi.vercel.app