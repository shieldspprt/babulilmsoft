# ilmsoft - School Management System with Credit System

A multi-school SaaS platform with daily credit-based access control.

## Credit System

### How it Works
- **1 Credit = 1 Day** of system access
- Schools purchase credits to activate their account
- Credits expire after the purchased period ends
- Dashboard is locked when credits run out

### Pricing Plans

| Plan | Credits | Duration | Price (PKR) | Per Day |
|------|---------|----------|-------------|---------|
| Monthly | 30 | 30 Days | Rs 2,000 | ~Rs 67 |
| Quarterly+ | 100 | 100 Days | Rs 5,000 | Rs 50 (Save 17%) |

### Credit Purchase Flow

1. **School Admin**: Selects a plan and sends payment via JazzCash or Bank Transfer
2. **School Admin**: Submits payment reference in the dashboard
3. **System**: Creates a pending credit request
4. **ilmsoft Admin**: Reviews and approves/rejects the request
5. **On Approval**: Credits are added to the school's account immediately

### Database Schema

#### Tables
- `schools` - School profiles with `total_credits` and `credit_expires_at`
- `credit_requests` - Pending/approved/rejected purchase requests
- `admin_users` - ilmsoft administrators who can approve requests

#### Key Features
- **CreditGuard Component**: Blocks dashboard access when credits expire
- **Real-time Updates**: Credit status updates immediately on approval
- **Expiry Tracking**: Automatic expiration date calculation

## Admin Access

To create an admin user:

1. Sign up normally at `/signup`
2. Get the user ID from Supabase auth
3. Insert into admin_users table:

```sql
INSERT INTO public.admin_users (user_id, email) 
VALUES ('user-uuid-here', 'admin@example.com');
```

4. Access admin panel at `/admin`

## Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

> Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

## Development

```bash
npm install
npm run dev
```

## Deployment

The app is configured for static hosting on Netlify or similar platforms.

### Payment Accounts

Payment details are configured in `src/pages/Dashboard.tsx`. Update the JazzCash number and bank IBAN with your actual accounts before going live.
