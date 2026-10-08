import GuidedSessionCapabilityGate from '@/components/studio/GuidedSessionCapabilityGate';

export default function GuidedSessionsLayout({ children }: { children: React.ReactNode }) {
  return <GuidedSessionCapabilityGate>{children}</GuidedSessionCapabilityGate>;
}
