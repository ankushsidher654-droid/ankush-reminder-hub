'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Reminder = {
  id: number;
  title: string;
  reminder_date: string;
  reminder_time?: string | null;
  place?: string | null;
  notes?: string | null;
  category?: string | null;
  status?: string | null;
  created_at?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const emptyForm = {
  title: '',
  reminder_date: '',
  reminder_time: '',
  place: '',
  notes: '',
  category: 'Appointment',
};

export default function Home() {
  const [form, setForm] = useState(emptyForm);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const ad = `${a.reminder_date} ${a.reminder_time || '00:00'}`;
      const bd = `${b.reminder_date} ${b.reminder_time || '00:00'}`;
      return ad.localeCompare(bd);
    });
  }, [reminders]);

  async function loadReminders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('reminder_date', { ascending: true })
      .order('reminder_time', { ascending: true });
    if (error) setMessage(error.message);
    else setReminders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReminders();
  }, []);

  function updateField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function saveReminder(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!form.title.trim() || !form.reminder_date) {
      setMessage('Title and date are required.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      reminder_date: form.reminder_date,
      reminder_time: form.reminder_time || null,
      place: form.place || null,
      notes: form.notes || null,
      category: form.category || null,
      status: 'Pending',
    };

    setLoading(true);
    const result = editingId
      ? await supabase.from('reminders').update(payload).eq('id', editingId)
      : await supabase.from('reminders').insert(payload);

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(editingId ? 'Reminder updated.' : 'Reminder saved.');
      setEditingId(null);
      setForm(emptyForm);
      await loadReminders();
    }
    setLoading(false);
  }

  function editReminder(r: Reminder) {
    setEditingId(r.id);
    setForm({
      title: r.title || '',
      reminder_date: r.reminder_date || '',
      reminder_time: r.reminder_time ? r.reminder_time.slice(0,5) : '',
      place: r.place || '',
      notes: r.notes || '',
      category: r.category || 'Appointment',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function markDone(id: number) {
    await supabase.from('reminders').update({ status: 'Done' }).eq('id', id);
    await loadReminders();
  }

  async function deleteReminder(id: number) {
    const ok = confirm('Delete this reminder?');
    if (!ok) return;
    await supabase.from('reminders').delete().eq('id', id);
    await loadReminders();
  }

  return (
    <main className="container">
      <section className="header">
        <h1>Ankush Reminder Hub</h1>
        <p>Fast phone-friendly reminders for appointments, bills, and important tasks.</p>
      </section>

      <form className="card" onSubmit={saveReminder}>
        <div className="row">
          <h2>{editingId ? 'Edit Reminder' : '+ Add Reminder'}</h2>
          {editingId && <button type="button" className="btn secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
        </div>

        <div className="grid">
          <div className="full">
            <label>Title *</label>
            <input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Pay Bell bill / Dentist appointment" />
          </div>

          <div>
            <label>Date *</label>
            <input type="date" value={form.reminder_date} onChange={e => updateField('reminder_date', e.target.value)} />
          </div>

          <div>
            <label>Time optional</label>
            <input type="time" value={form.reminder_time} onChange={e => updateField('reminder_time', e.target.value)} />
          </div>

          <div>
            <label>Category optional</label>
            <select value={form.category} onChange={e => updateField('category', e.target.value)}>
              <option>Appointment</option>
              <option>Bill</option>
              <option>Work</option>
              <option>Personal</option>
              <option>Family</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label>Place optional</label>
            <input value={form.place} onChange={e => updateField('place', e.target.value)} placeholder="Clinic / Brampton / Online" />
          </div>

          <div className="full">
            <label>Notes optional</label>
            <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Extra details..." />
          </div>
        </div>

        <button className="btn primary" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Reminder' : 'Save Reminder'}</button>
        {message && <p className="muted">{message}</p>}
      </form>

      <section className="card">
        <div className="row">
          <h2>Upcoming Reminders</h2>
          <span className="pill">{sorted.filter(r => r.status !== 'Done').length} pending</span>
        </div>

        {loading && <p className="empty">Loading...</p>}
        {!loading && sorted.length === 0 && <p className="empty">No reminders yet. Add one above.</p>}

        {sorted.map(r => (
          <div className="card item" key={r.id}>
            <div className="row">
              <h3>{r.title}</h3>
              <span className="pill">{r.category || 'Other'}</span>
            </div>
            <p className="muted">
              <b>Date:</b> {r.reminder_date}
              {r.reminder_time ? ` at ${r.reminder_time.slice(0,5)}` : ''}
            </p>
            {r.place && <p className="muted"><b>Place:</b> {r.place}</p>}
            {r.notes && <p className="muted"><b>Notes:</b> {r.notes}</p>}
            <p className="muted"><b>Status:</b> <span className="status">{r.status || 'Pending'}</span></p>

            <div className="actions">
              <button className="btn secondary" type="button" onClick={() => editReminder(r)}>Edit</button>
              <button className="btn secondary" type="button" onClick={() => markDone(r.id)}>Done</button>
              <button className="btn danger" type="button" onClick={() => deleteReminder(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
