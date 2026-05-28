import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function torontoToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Vercel cron may call without this header unless you configure it manually.
    // For manual testing, use the /api/send-reminders-test route or remove CRON_SECRET.
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM || 'Reminder Hub <onboarding@resend.dev>';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  if (!resendKey) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY. Website works, but emails are not enabled yet.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend(resendKey);
  const today = torontoToday();

  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const emails = [settings.reminder_email_1, settings.reminder_email_2].filter(Boolean);

  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('*')
    .eq('reminder_date', today)
    .neq('status', 'Done');

  if (remindersError) {
    return NextResponse.json({ error: remindersError.message }, { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ ok: true, message: `No reminders due on ${today}` });
  }

  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Reminder Hub — Due Today</h2>
      <p>You have ${reminders.length} reminder(s) due today: <b>${today}</b></p>
      ${reminders.map((r:any) => `
        <div style="border:1px solid #ddd;border-radius:12px;padding:12px;margin:12px 0">
          <h3 style="margin:0 0 8px">${r.title}</h3>
          <p><b>Time:</b> ${r.reminder_time ? String(r.reminder_time).slice(0,5) : 'Not set'}</p>
          <p><b>Category:</b> ${r.category || 'Not set'}</p>
          <p><b>Place:</b> ${r.place || 'Not set'}</p>
          <p><b>Notes:</b> ${r.notes || ''}</p>
        </div>
      `).join('')}
    </div>
  `;

  const result = await resend.emails.send({
    from,
    to: emails,
    subject: `Reminder Hub: ${reminders.length} reminder(s) due today`,
    html,
  });

  return NextResponse.json({ ok: true, today, sent_to: emails, reminders: reminders.length, result });
}
