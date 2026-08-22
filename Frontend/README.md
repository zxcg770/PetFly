# Frontend Setup Guide

To run the frontend locally, you need to configure the environment variables for the API and Stripe.

## Required environment variables

Create a `.env` file in the Frontend folder with the following values:

```env
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
REACT_APP_API_URL=http://localhost:5001/api
```

You can also copy the example file:

```bash
cp .env.example .env
```

## Install and run

```bash
npm install
npm start
```

The app will be available at:

```text
http://localhost:3000
```

## Notes

- `REACT_APP_API_URL` should point to the backend API base URL.
- `REACT_APP_STRIPE_PUBLIC_KEY` must be a valid Stripe publishable key.
- Use your own credentials for all services instead of reusing someone else's keys.

## Stripe test mode

For local payment testing, use Stripe test keys and mock card data. No real money is moved.

- Card number: `4242 4242 4242 4242`
- Expiration: any future date, for example `12/34`
- CVC: any 3-digit code
- ZIP code: any valid 5-digit code
