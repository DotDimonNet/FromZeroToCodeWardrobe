# HTTP API

All requests/responses use JSON and camelCase. Authentication uses the HttpOnly session cookie. First GET `/api/csrf`, then send its `token` as `X-CSRF-TOKEN` for every POST/PUT/DELETE. Re-fetch after authentication changes. Unsafe requests without a valid token return 400.

| Method | Path                             | Purpose                                                                              |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/config`                    | Controlled vocabulary, curated edits, demo/provider availability                     |
| GET    | `/api/health`                    | Database connectivity                                                                |
| GET    | `/api/auth/me`                   | Current user or `null`                                                               |
| POST   | `/api/auth/register`             | `{ email, password, displayName }`                                                   |
| POST   | `/api/auth/activate`             | `{ userId, token }`                                                                  |
| POST   | `/api/auth/resend-activation`    | `{ email }`                                                                          |
| POST   | `/api/auth/login`                | `{ email, password }`                                                                |
| POST   | `/api/auth/logout`               | Sign out                                                                             |
| POST   | `/api/auth/forgot`               | `{ email }`                                                                          |
| POST   | `/api/auth/reset`                | `{ userId, token, password }`                                                        |
| PUT    | `/api/auth/profile`              | `{ displayName, city }`                                                              |
| POST   | `/api/auth/password`             | `{ currentPassword, newPassword }`                                                   |
| GET    | `/api/auth/external/Google`      | OAuth challenge when configured                                                      |
| GET    | `/api/auth/external/Facebook`    | OAuth challenge when configured                                                      |
| POST   | `/api/auth/demo?seller=false`    | Development demo only                                                                |
| GET    | `/api/garments`                  | Owned pieces; query: search/category/color/season/style/era/sort/available/favorites |
| POST   | `/api/garments`                  | Create garment                                                                       |
| PUT    | `/api/garments/{id}`             | Update owned garment                                                                 |
| DELETE | `/api/garments/{id}`             | Delete owned garment, unless referenced by an outfit                                 |
| POST   | `/api/outfits/generate`          | `{ season, style, era, palette, trendId }`                                           |
| GET    | `/api/outfits`                   | Owned saved looks                                                                    |
| POST   | `/api/outfits`                   | `{ name, garmentIds, preferences }`                                                  |
| PUT    | `/api/outfits/{id}/sharing`      | `{ enabled }`                                                                        |
| DELETE | `/api/outfits/{id}`              | Delete owned look                                                                    |
| GET    | `/api/outfits/shared/{token}`    | Public opt-in outfit                                                                 |
| GET    | `/api/market`                    | Community listings, including availability and ownership flags                       |
| POST   | `/api/market`                    | Publish listing                                                                      |
| DELETE | `/api/market/{id}`               | Withdraw own available listing                                                       |
| POST   | `/api/market/{id}/reserve`       | `{ note }`; server supplies buyer and price                                          |
| GET    | `/api/market/orders`             | Orders where current user is buyer or seller                                         |
| POST   | `/api/market/orders/{id}/action` | `{ action: "Accept" / "Decline" / "Cancel" / "Complete" }`                           |

Garment body: `name`, `category`, `color`, `season`, `style`, `era`, `imageKey`, `isAvailable`, `isFavorite`. Listing body: `title`, `description`, `category`, `imageKey`, `size`, `condition`, `mode`, `priceCents`, `city`. Use values from `/api/config`. Listing modes are `Sell`, `Lend`, `Giveaway`; condition values are `New`, `Like new`, `Very good`, `Good`.

Query `sort` supports `newest`, `name`, `color`. Wardrobe reads and market browse are capped at 500 records for the MVP; pagination is a future enhancement.

Status conventions: 201 created; 204 deletion/action success; 400 invalid input/CSRF; 401 signed out/incorrect login; 403 inactive account; 404 missing or another user's private resource; 409 stale state, unavailable stock or forbidden lifecycle transition; 429 rate limit/lockout; 503 unavailable configured service. Business errors contain a safe `title` and `status`. Identity validation uses standard ASP.NET validation problems.
