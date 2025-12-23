import Hero from '../../components/Hero';
import WhatThisIs from '../../components/WhatThisIs';
import HowItWorks from '../../components/HowItWorks';
import DiscoverReflect from '../../components/DiscoverReflect';
import PresenceInAction from '../../components/PresenceInAction';
import WorldState from '../../components/WorldState';
import Community from '../../components/Community';
import EarlyAdopters from '../../components/EarlyAdopters';
import FAQ from '../../components/FAQ';
import EmailCapture from '../../components/EmailCapture';

export default function Home() {
  return (
    <>
      <Hero />
      <WhatThisIs />
      <HowItWorks />
      <DiscoverReflect />
      <PresenceInAction />
      <WorldState />
      <Community />
      <EarlyAdopters />
      <FAQ />
      <EmailCapture />
    </>
  );
}

