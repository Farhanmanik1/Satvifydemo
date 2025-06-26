# 🚀 Satvify Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- ✅ Supabase project set up
- ✅ Razorpay account created
- ✅ Vercel account ready
- ✅ GitHub repository with latest code

## Step 1: Database Setup

### 1.1 Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Click "Run" to execute all commands

### 1.2 Verify Tables Created
Check that these tables exist in your database:
- `profiles`
- `products`
- `orders`
- `order_items`
- `product_reviews` (NEW)
- `carts`
- `support_tickets`

## Step 2: Environment Variables

### 2.1 Supabase Configuration
Get these from your Supabase project settings:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2.2 Razorpay Configuration
Get these from your Razorpay dashboard:
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_or_live_key
RAZORPAY_KEY_SECRET=your-secret-key
```

### 2.3 Application URL
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add all the variables from Step 2

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID
   vercel env add RAZORPAY_KEY_SECRET
   vercel env add NEXT_PUBLIC_APP_URL
   ```

## Step 4: Post-Deployment Setup

### 4.1 Test Core Features
- ✅ User registration/login
- ✅ Product browsing
- ✅ Add to cart functionality
- ✅ Checkout process
- ✅ Payment integration
- ✅ Order management
- ✅ Admin dashboard

### 4.2 Create Admin User
1. Register a new account on your deployed site
2. Go to Supabase dashboard → Table Editor → profiles
3. Find your user and change role to 'superadmin'

### 4.3 Add Sample Products
The database setup includes sample products, but you can add more:
1. Login as admin
2. Use Supabase dashboard to add products directly
3. Or create an admin interface for product management

## Step 5: Domain Configuration (Optional)

### 5.1 Custom Domain
1. In Vercel dashboard, go to project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 5.2 Update Environment Variables
Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Step 6: Monitoring & Analytics

### 6.1 Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and usage

### 6.2 Supabase Monitoring
- Check database usage in Supabase dashboard
- Monitor API calls and performance

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set correctly
   - Ensure all dependencies are in package.json
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies are set correctly
   - Ensure tables exist

3. **Payment Issues**
   - Verify Razorpay keys (test vs live)
   - Check Razorpay dashboard for failed payments
   - Ensure HTTPS is enabled for production

4. **Authentication Issues**
   - Check Supabase auth settings
   - Verify redirect URLs in Supabase dashboard
   - Ensure profile creation trigger is working

### Getting Help

- Check Vercel deployment logs
- Monitor Supabase logs
- Check browser console for errors
- Review network requests in developer tools

## Security Checklist

- ✅ Environment variables are secure
- ✅ RLS policies are enabled
- ✅ API keys are not exposed in client code
- ✅ HTTPS is enabled
- ✅ Input validation is in place
- ✅ Authentication is working properly

## Performance Optimization

- ✅ Images are optimized
- ✅ Database queries are efficient
- ✅ Caching is implemented where appropriate
- ✅ Bundle size is optimized

---

🎉 **Congratulations!** Your Satvify cloud kitchen is now live!

Visit your deployed application and test all features. Don't forget to update the README with your live URL.
