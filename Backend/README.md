# Backend Setup Guide

To start the backend successfully, you need a few external services and API credentials.

## Required services

1. MongoDB
   - A MongoDB database is required for the app data.
   - You can use MongoDB Atlas or a local MongoDB instance.
   - Provide the connection string in the `MONGO_URI` environment variable.

2. Google Gemini API key
   - Required for the regulation Q&A / RAG feature.
   - Set it in `GEMINI_API_KEY`.

3. Stripe secret key
   - Required for payment functionality.
   - Set it in `STRIPE_SECRET_KEY`.

4. Cloudinary credentials
   - Required for image uploads.
   - Set these values:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`

5. JWT secret
   - Required for authentication.
   - Set any secure random string in `JWT_SECRET`.

## Environment variables

Create a `.env` file in the Backend folder with values similar to:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Install and run

```bash
npm install
npm run dev
```

You can also start it with:

```bash
npm start
```

## Stripe test mode

For local payment testing, use Stripe test keys and mock card data. No real money is moved.

- Card number: `4242 4242 4242 4242`
- Expiration: any future date, for example `12/34`
- CVC: any 3-digit code
- ZIP code: any valid 5-digit code

If the app uses Docker, make sure the required services are reachable before starting the backend.
