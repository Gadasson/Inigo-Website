import ChallengeCapabilityGate from '@/components/studio/challenges/ChallengeCapabilityGate';

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return <ChallengeCapabilityGate>{children}</ChallengeCapabilityGate>;
}
