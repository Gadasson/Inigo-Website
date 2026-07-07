import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { StudioAccessProvider } from '@/contexts/StudioAccessContext';
import StudioGate from '@/components/studio/StudioGate';
import './studio.css';

export const metadata: Metadata = {
  title: 'Studio — Inigo',
  description: 'Inigo Studio',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-root">
      <AuthProvider>
        <StudioAccessProvider>
          <StudioGate>{children}</StudioGate>
        </StudioAccessProvider>
      </AuthProvider>
    </div>
  );
}
