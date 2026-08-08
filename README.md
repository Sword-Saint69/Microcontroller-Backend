# Mosaic Console

Dark React control console for configuring and testing the Mosaic ESP32-S3
dashboard backend.

## Development

```bash
npm install
npm run dev
```

Local development defaults to `http://127.0.0.1:8000`. Hosted builds default to
`https://mossaic-igyrquia.b4a.run`. The URL can also be changed from **Device
setup** after opening the application.

To use another backend on Vercel, add this project environment variable and
redeploy:

```text
VITE_API_BASE_URL=https://your-api.example
```

Do not include a trailing slash or an API path such as `/api/v1`.

## Production build

```bash
npm run build
```

The generated static application is written to `dist/`.
