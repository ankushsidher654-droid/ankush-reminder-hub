import './globals.css';

export const metadata = {
  title: 'Ankush Reminder Hub',
  description: 'Private reminder tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
