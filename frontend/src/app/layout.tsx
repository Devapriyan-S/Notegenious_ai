import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NoteGenius AI — Smart AI Notebook',
  description: 'An AI-powered smart notebook that runs entirely in the browser. Summarize, expand, translate, and chat with your notes using Groq AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0f0f1a] text-slate-200 h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
