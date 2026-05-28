import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const remindersResponse = await fetch(
      "https://xhxulrgygduvuimtwoaj.supabase.co/rest/v1/reminders?reminder_date=eq." +
        today,
      {
        headers: {
          apikey:
            "sb_publishable_jtqsCqZri1Moh_NYNnWO1A_HyGhUSD9",
          Authorization:
            "Bearer sb_publishable_jtqsCqZri1Moh_NYNnWO1A_HyGhUSD9",
        },
      }
    );

    const reminders = await remindersResponse.json();

    const settingsResponse = await fetch(
      "https://xhxulrgygduvuimtwoaj.supabase.co/rest/v1/settings?select=*",
      {
        headers: {
          apikey:
            "sb_publishable_jtqsCqZri1Moh_NYNnWO1A_HyGhUSD9",
          Authorization:
            "Bearer sb_publishable_jtqsCqZri1Moh_NYNnWO1A_HyGhUSD9",
        },
      }
    );

    const settings = await settingsResponse.json();

    if (!settings.length) {
      return NextResponse.json({
        error: "No email settings found",
      });
    }

    const emails = [
      settings[0].reminder_email_1,
      settings[0].reminder_email_2,
    ].filter(Boolean);

    if (!reminders.length) {
      return NextResponse.json({
        ok: true,
        message: `No reminders due on ${today}`,
      });
    }

    let html = `
      <h1>Reminder Hub — Due Today</h1>
      <p>You have ${reminders.length} reminder(s) due today.</p>
    `;

    reminders.forEach((r) => {
      html += `
        <div style="border:1px solid #ccc;padding:15px;margin-bottom:15px;border-radius:10px;">
          <h2>${r.title}</h2>
          <p><strong>Time:</strong> ${r.reminder_time || "N/A"}</p>
          <p><strong>Category:</strong> ${r.category || "N/A"}</p>
          <p><strong>Place:</strong> ${r.place || "N/A"}</p>
          <p><strong>Notes:</strong> ${r.notes || ""}</p>
        </div>
      `;
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: emails.join(","),
      subject: `Reminder Hub: ${reminders.length} due today`,
      html,
    });

    return NextResponse.json({
      ok: true,
      sent_to: emails,
      reminders: reminders.length,
      result,
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
    });
  }
}
