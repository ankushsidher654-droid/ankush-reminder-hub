# Ankush Reminder Hub

## What this does
- Mobile-friendly reminder website
- Saves reminders into Supabase
- Optional fields: time, place, notes, category
- Auto email route is included for Vercel Cron + Resend

## Supabase URL
Use:
NEXT_PUBLIC_SUPABASE_URL=https://xhxulrgygduvuimtwoaj.supabase.co

## Supabase key
Use your publishable key:
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jtqsCqZri1Moh_NYNnWO1A_HyGhUSD9

## Before deploying
In Supabase SQL Editor, run:

alter table reminders
add column if not exists email_sent_at timestamp with time zone;

## Vercel environment variables
Add these in Vercel Project Settings > Environment Variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
REMINDER_FROM
CRON_SECRET

The website works without RESEND_API_KEY, but automatic email sending will not work until you add Resend.
