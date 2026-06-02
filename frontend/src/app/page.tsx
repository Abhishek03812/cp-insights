export default function Home() {
  return (
    <main className="container animate-fade-in">
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="text-gradient animate-fade-in delay-1">
            CP Insight
          </h1>
          <p className="animate-fade-in delay-2" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            The ultimate analytics platform for competitive programmers. Track your progress, identify weaknesses, and predict your future ratings.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }} className="animate-fade-in delay-3">
            <a href="/register" className="btn btn-primary">Get Started</a>
            <a href="/login" className="btn btn-outline">Login</a>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }} className="animate-fade-in delay-3">
          <div className="glass-card">
            <h3>Deep Analytics</h3>
            <p>Connect your Codeforces, LeetCode, and CodeChef profiles to get unparalleled insights into your competitive programming journey.</p>
          </div>
          
          <div className="glass-card">
            <h3>Weak Topic Detection</h3>
            <p>Our algorithms automatically identify your weak topics like DP or Graphs and suggest targeted practice to improve your rating.</p>
          </div>

          <div className="glass-card">
            <h3>Rating Prediction</h3>
            <p>Know where you stand. Predict your future contest ratings using advanced statistical models and weighted moving averages.</p>
          </div>
        </section>
        
      </div>
    </main>
  );
}
