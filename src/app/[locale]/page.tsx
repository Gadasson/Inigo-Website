import Hero from '../../components/Hero';
import WorldState from '../../components/WorldState';
import DiscoverReflect from '../../components/DiscoverReflect';
import Community from '../../components/Community';
import EarlyAdopters from '../../components/EarlyAdopters';
import FAQ from '../../components/FAQ';
import EmailCapture from '../../components/EmailCapture';

export default function Home() {
  return (
    <>
      <Hero />
      <DiscoverReflect />
      <WorldState />
      <Community />
      <EarlyAdopters />
      <FAQ />
      <EmailCapture />
    </>
  );
}

