# CSJ — Chotty Shah Jee

Static e-commerce site (HTML/CSS/vanilla JS) with Firebase Auth + Firestore
as the only backend. Built for GitHub Pages.

## File structure

```
csj/
├── index.html
├── admin.html
├── firestore.rules
├── README.md
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── firebase-config.js
│   ├── seed-data.js
│   ├── main.js
│   └── admin.js
└── images/
    ├── csj-1.jpg ... csj-9.jpg   (add these yourself — see below)
    └── fallback.svg
```

## 1. Add your product images

Add nine JPGs named `images/csj-1.jpg` through `images/csj-9.jpg` (one per
product, in display order). If an image is missing or fails to load, the
site falls back to `images/fallback.svg` automatically — it will not throw
a JavaScript error.

## 2. Firebase Console steps

Project: **csj-brand** (the config in `js/firebase-config.js` already points
here — no changes needed unless you rotate keys).

1. **Authentication** → Sign-in method → enable **Email/Password**.
2. **Authentication** → Users → add the admin user with email
   `csjbrand@gmail.com`, and confirm its UID is
   `QJjEVBmFJBadwqXKGn4ITtxJlXi1` (this UID is hard-coded as the only admin
   in both `js/firebase-config.js` and `firestore.rules` — if it ever
   changes, update it in both places).
3. **Firestore Database** → create a database in **production mode** (any
   region). Stay on the **Spark (free)** plan — nothing here needs Blaze or
   Storage.
4. **Firestore Database** → Rules → paste in the contents of
   `firestore.rules` from this repo → Publish.
5. Leave **Storage** untouched/disabled — this project never uses it.

You do **not** need to manually create the `products`, `siteSettings`, or
`orders` collections — the admin panel creates them automatically the first
time you log in (see below).

## 3. Deploy to GitHub Pages

1. Create a new GitHub repository and push this entire folder to it (the
   repo root should contain `index.html`, not a subfolder).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch", branch `main`, folder `/ (root)`. Save.
4. Wait a minute for the first deploy, then open the URL GitHub Pages gives
   you (e.g. `https://yourusername.github.io/your-repo/`).
5. Because this project uses ES module `<script type="module">` tags, it
   must be served over http(s) — GitHub Pages does this automatically.
   Opening `index.html` directly from your local filesystem will not work.

## 4. First admin login

1. Visit `admin.html` on your deployed site.
2. Sign in with `csjbrand@gmail.com` and its password.
3. On first successful login, the admin panel checks whether the
   `products` collection is empty; if so, it imports the 9 launch products
   in one batch write. It will never re-import or duplicate them on later
   logins.
4. Any account other than UID `QJjEVBmFJBadwqXKGn4ITtxJlXi1` sees an
   "Access denied" screen and is signed out — the check is done against the
   Firebase Auth UID, not the email string.

## 5. Testing checklist

- [ ] Public site loads the 9 products from Firestore (not a hard-coded
      array) and displays correct name/price/colors/tag for each.
- [ ] Category filter pills show all real categories plus "All", and
      filtering works.
- [ ] Clicking a product image or name opens the detail modal with the
      correct product, colour swatches, and quantity stepper.
- [ ] "Add to cart" and "Buy now" work from both the product card and the
      detail modal, for every one of the 9 products.
- [ ] Cart drawer opens/closes, quantity +/− works, removing an item works,
      subtotal updates live.
- [ ] Checkout form validates required fields (name, phone, city, address).
- [ ] Placing an order writes a new document to the `orders` collection in
      Firestore with a unique `orderId`, `status: "pending"`, and correct
      item/price totals.
- [ ] After a successful order, WhatsApp opens (to `923227707172`) with the
      order details pre-filled, and the confirmation modal shows the order
      ID.
- [ ] If Firestore is unreachable when placing an order, the site shows a
      visible warning instead of pretending the order succeeded.
- [ ] `admin.html` shows the login screen when signed out, "Access denied"
      for a non-admin account, and the full panel for the admin UID.
- [ ] Admin → Products shows all 9 seeded products, including their active
      status, image, price, category, and display order.
- [ ] Admin → Add product, Edit, Hide/Show, and Delete all work and persist
      after a page refresh.
- [ ] Admin → Orders → Pending shows new orders with full customer and item
      detail; Mark completed / Reject move the order to the right tab
      without deleting it.
- [ ] Admin → Website settings loads current values, and Save updates the
      `siteSettings` document — reflected on the public site after reload.
- [ ] On mobile widths, the storefront and admin panel both remain usable
      (nav collapses, grid reflows, modals stay scrollable).
- [ ] No console errors such as `Cannot read properties of undefined`,
      `undefined.colors`, or `imgFallback is not defined` appear during any
      of the above.
