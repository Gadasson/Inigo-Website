export default function Home() {
  return (
    <div className="min-h-screen bg-soft-sand text-deep-earth">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-inigo-green">
            Inigo
          </h1>
          <p className="text-2xl md:text-3xl mb-8 text-earth-brown">
            Plastic to Ecstatic
          </p>
          <p className="text-lg md:text-xl mb-12 text-deep-earth max-w-2xl mx-auto">
            From fake to real. From numb to now. Join the frequency that transforms 
            plastic existence into ecstatic presence.
          </p>
          <button className="bg-inigo-green text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
            Join the Movement
          </button>
        </div>
      </section>

      {/* Meaning Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-deep-earth">
            What Does &ldquo;Plastic to Ecstatic&rdquo; Mean?
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-inigo-green">Plastic</h3>
              <p className="text-lg text-deep-earth mb-4">
                The artificial, synthetic, disconnected way of living that leaves us 
                feeling hollow and unfulfilled.
              </p>
              <ul className="space-y-2 text-deep-earth">
                <li>• Endless scrolling and digital numbness</li>
                <li>• Consumer culture that never satisfies</li>
                <li>• Disconnection from nature and community</li>
                <li>• Living through screens instead of senses</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-inigo-green">Ecstatic</h3>
              <p className="text-lg text-deep-earth mb-4">
                The natural, authentic, connected state of being that fills us with 
                joy, purpose, and wonder.
              </p>
              <ul className="space-y-2 text-deep-earth">
                <li>• Present moment awareness and gratitude</li>
                <li>• Deep connection with nature and others</li>
                <li>• Authentic self-expression and creativity</li>
                <li>• Living through experience and feeling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-20 px-4 bg-soft-sand">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-deep-earth">
            Who Is This For?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-inigo-green">The Seeker</h3>
              <p className="text-deep-earth">
                You feel there&apos;s more to life than what you&apos;re currently experiencing. 
                You&apos;re ready to break free from the plastic matrix.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-inigo-green">The Meditator</h3>
              <p className="text-deep-earth">
                You practice presence and want to deepen your connection to the 
                ecstatic nature of reality. Join our community.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-inigo-green">The Revolutionary</h3>
              <p className="text-deep-earth">
                You believe quiet is the new revolution. You&apos;re ready to shift 
                consciousness and inspire others to do the same.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-20 px-4 bg-earth-brown text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            The Inigo Manifesto
          </h2>
          <div className="space-y-8 text-lg">
            <p>
              We believe that the greatest revolution of our time is not political, 
              but personal. It&apos;s the shift from plastic existence to ecstatic being.
            </p>
            <p>
              We believe that quiet is the new revolution. In a world of constant 
              noise and distraction, the most radical act is to be still and present.
            </p>
            <p>
              We believe that transformation happens through frequency, not force. 
              When we align with the natural rhythms of life, magic happens.
            </p>
            <p>
              We believe that everyone has access to ecstasy. It&apos;s not a privilege 
              or a destination, but our natural state when we remove the plastic layers.
            </p>
          </div>
        </div>
      </section>

      {/* World State Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-deep-earth">
            The State of Our World
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-red-600">Plastic Reality</h3>
              <div className="space-y-4 text-deep-earth">
                <div className="bg-red-50 p-6 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">8.3B</p>
                  <p>Plastic pieces in our oceans</p>
                </div>
                <div className="bg-red-50 p-6 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">6+ hours</p>
                  <p>Average daily screen time</p>
                </div>
                <div className="bg-red-50 p-6 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">70%</p>
                  <p>People feel disconnected from nature</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-6 text-inigo-green">Ecstatic Potential</h3>
              <div className="space-y-4 text-deep-earth">
                <div className="bg-green-50 p-6 rounded-xl">
                  <p className="text-2xl font-bold text-inigo-green">∞</p>
                  <p>Moments of presence available</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <p className="text-2xl font-bold text-inigo-green">100%</p>
                  <p>Natural joy accessible to all</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <p className="text-2xl font-bold text-inigo-green">24/7</p>
                  <p>Connection to source available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-inigo-green text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Shift?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Join thousands of others who are already experiencing the transformation 
            from plastic to ecstatic. Your journey starts now.
          </p>
          <div className="space-y-4">
            <button className="bg-white text-inigo-green px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 mr-4">
              Start Meditating
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-inigo-green transition-all duration-300 transform hover:scale-105">
              Join Community
            </button>
          </div>
          <p className="mt-8 text-sm opacity-80">
            &ldquo;Quiet is the new revolution. Join the frequency.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}
