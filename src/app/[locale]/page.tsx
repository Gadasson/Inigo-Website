import Hero from '../../components/Hero';
import ActionsGallery from '../../components/ActionsGallery';
import MeditationModes from '../../components/MeditationModes';
import TimeThatCounts from '../../components/TimeThatCounts';
import QuietEvents from '../../components/QuietEvents';
import WorldState from '../../components/WorldState';
import Places from '../../components/Places';
import DifferentSocialLanguage from '../../components/DifferentSocialLanguage';
import SafeSharing from '../../components/SafeSharing';
import EmailCapture from '../../components/EmailCapture';

export default function Home() {
  return (
    <>
      <Hero />
      <ActionsGallery />
      <MeditationModes />
      <TimeThatCounts />
      <QuietEvents />
      <WorldState />
      <Places />
      <DifferentSocialLanguage />
      <SafeSharing />
      <EmailCapture />
    </>
  );
}

