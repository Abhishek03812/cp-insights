"use client";

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Activity, Code, Target, Trophy, Flame, X } from 'lucide-react';

export default function Dashboard() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [stats, setStats] = useState<{
    totalSolved: number;
    cfMax: number | string;
    lcMax: number | string;
    accuracy: number;
  }>({
    totalSolved: 0,
    cfMax: 'Unlinked',
    lcMax: 'Unlinked',
    accuracy: 0
  });
  const [ratingData, setRatingData] = useState<any[]>([]);
  const [topicData, setTopicData] = useState<any[]>([]);
  const [detailedTopics, setDetailedTopics] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  
  // Predictor State
  const [divType, setDivType] = useState('Div 2');
  const [rank, setRank] = useState<number | ''>('');
  const [solved, setSolved] = useState<number | ''>('');
  const [prediction, setPrediction] = useState<{ delta: number, newRating: number } | null>(null);

  const handlePredict = () => {
    if (!rank || !stats.cfMax || stats.cfMax === 'Unlinked') return;
    const currentRating = Number(stats.cfMax);
    const r = Number(rank);
    let perfRating = 0;
    
    // Calibrated Codeforces Logarithmic Performance Curve
    if (divType === 'Div 1') {
      perfRating = 3900 - Math.log10(r) * 700;
    } else if (divType === 'Div 2' || divType === 'Educational') {
      perfRating = 3800 - Math.log10(r) * 690;
    } else if (divType === 'Div 3') {
      perfRating = 3100 - Math.log10(r) * 530;
    } else { // Div 4
      perfRating = 2500 - Math.log10(r) * 430;
    }

    // Codeforces Elo roughly moves a quarter of the distance toward performance rating
    let delta = Math.round((perfRating - currentRating) / 4);
    
    // Minor solved bonus to fulfill the user's input
    if (solved !== '') {
       delta += (Number(solved) * 2);
    }
    
    // Codeforces doesn't cap massive gains for god-tier performances, but typically caps losses
    delta = Math.max(-200, delta);
    
    setPrediction({ delta, newRating: currentRating + delta });
  };

  // Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [cfHandle, setCfHandle] = useState('');
  const [lcHandle, setLcHandle] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAnalytics = async (silent = true) => {
    try {
      const storedUserId = localStorage.getItem('userId') || 'demo';
      const res = await fetch(`http://localhost:5000/api/analytics/dashboard?userId=${storedUserId}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Backend unavailable');
      const data = await res.json();
      
      const cfProfile = data.platforms?.find((p: any) => p.platform === 'Codeforces');
      const lcProfile = data.platforms?.find((p: any) => p.platform === 'LeetCode');

      setStats({
        totalSolved: data.overall?.totalProblemsSolved || 0,
        cfMax: cfProfile ? (cfProfile.maxRating || 0) : 'Unlinked',
        lcMax: lcProfile ? (lcProfile.maxRating || 0) : 'Unlinked',
        accuracy: Math.round(data.overall?.acceptanceRate || 0)
      });
      
      if (data.ratingData && data.ratingData.length > 0) {
        setRatingData(data.ratingData);
      } else {
        setRatingData([]);
      }

      if (data.topicData && data.topicData.length > 0) {
        setTopicData(data.topicData);
      } else {
        setTopicData([
          { subject: 'Graphs', A: 10, fullMark: 150 },
          { subject: 'DP', A: 10, fullMark: 150 },
          { subject: 'Strings', A: 10, fullMark: 150 },
          { subject: 'Math', A: 10, fullMark: 150 },
          { subject: 'Trees', A: 10, fullMark: 150 },
          { subject: 'Greedy', A: 10, fullMark: 150 },
        ]);
      }

      if (data.detailedTopics) {
        setDetailedTopics(data.detailedTopics);
      } else {
        setDetailedTopics([]);
      }

      if (data.feedback && data.feedback.length > 0) {
        setFeedback(data.feedback);
      } else {
        setFeedback([]);
      }

      
      setIsOfflineMode(false);
      if (!silent) alert("Data successfully synced! Your charts and statistics have been updated.");
    } catch (err) {
      console.warn("Backend not running, falling back to mock data.");
      setIsOfflineMode(true);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
  }, []);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const userId = localStorage.getItem('userId');
    
    try {
      if (cfHandle) {
        await fetch('http://localhost:5000/api/profiles/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, platform: 'Codeforces', handle: cfHandle })
        });
      }
      if (lcHandle) {
        await fetch('http://localhost:5000/api/profiles/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, platform: 'LeetCode', handle: lcHandle })
        });
      }

      await fetchAnalytics(false);
      setIsSyncing(false);
      setShowSyncModal(false);

    } catch (error) {
      console.error(error);
      alert("An error occurred while syncing data. Please make sure the backend is running.");
      setIsSyncing(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <main className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Overview</h1>
          <p>Welcome back! Here is your competitive programming summary.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }} onClick={() => setShowSyncModal(true)}>
          <Activity size={18} /> Link Accounts & Sync
        </button>
      </header>

      {isOfflineMode && (
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--accent-warning)', color: 'var(--accent-warning)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={20} />
          <strong>Demo Mode:</strong> The Node.js backend is offline. Displaying demonstration portfolio data.
        </div>
      )}

      {/* Quick Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card stat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Solved</span>
          <span className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalSolved}</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CF Peak Rating</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats.cfMax}</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LC Peak Rating</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{stats.lcMax}</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Accuracy</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.accuracy}%</span>
        </div>
      </section>

      {/* Live Rating Predictor */}
      <section className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-primary)' }}>🔮</span> Live CF Delta Predictor
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Contest Type</label>
            <select className="input-field" value={divType} onChange={(e) => setDivType(e.target.value)} style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '12px', padding: '1rem', fontSize: '1.05rem' }}>
              <option value="Div 1" style={{ color: 'black' }}>Div 1</option>
              <option value="Div 2" style={{ color: 'black' }}>Div 2</option>
              <option value="Div 3" style={{ color: 'black' }}>Div 3</option>
              <option value="Div 4" style={{ color: 'black' }}>Div 4</option>
              <option value="Educational" style={{ color: 'black' }}>Educational</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Problems Solved</label>
            <input type="number" className="input-field" placeholder="e.g. 4" value={solved} onChange={(e) => setSolved(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '12px', padding: '1rem', fontSize: '1.05rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Rank</label>
            <input type="number" className="input-field" placeholder="e.g. 1500" value={rank} onChange={(e) => setRank(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '12px', padding: '1rem', fontSize: '1.05rem' }} />
          </div>
          <button className="btn btn-primary" onClick={handlePredict} disabled={stats.cfMax === 'Unlinked'} style={{ height: '48px' }}>
            Predict Delta
          </button>
        </div>
        
        {prediction && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '2rem' }} className="animate-fade-in">
            <div>
              <span style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Expected Delta</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: prediction.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {prediction.delta > 0 ? '+' : ''}{prediction.delta}
              </span>
            </div>
            <div>
              <span style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>New Rating</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{prediction.newRating}</span>
            </div>
          </div>
        )}
      </section>

      {/* Actionable Insights Section */}
      {feedback.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-warning)' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-warning)' }}>
              <Flame size={20} /> Actionable Insights & Recommendations
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {feedback.map((item, idx) => (
                <li key={idx} style={{ lineHeight: '1.5' }}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Charts Section */}
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Rating Progression</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="var(--text-secondary)" 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().substring(2)}`;
                  }}
                  minTickGap={30}
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }} 
                  labelFormatter={(val, entries) => {
                    const d = new Date(val);
                    const name = entries && entries.length > 0 && entries[0].payload ? entries[0].payload.contestName : '';
                    return `${d.toLocaleDateString()} ${name ? '— ' + name : ''}`;
                  }}
                />
                <Line type="monotone" connectNulls dataKey="codeforces" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" connectNulls dataKey="leetcode" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Topic Strengths</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topicData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="transparent" />
                <Radar name="Proficiency" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Detailed Topic Breakdown */}
      {detailedTopics.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={20} /> Detailed Topic Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {detailedTopics.slice(0, 15).map((t, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '0.5rem' }}>{t.subject}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>Total: <strong style={{ color: 'white' }}>{t.A}</strong></span>
                    <span>CF: <strong style={{ color: 'var(--accent-primary)' }}>{t.cf}</strong></span>
                    <span>LC: <strong style={{ color: 'var(--accent-secondary)' }}>{t.lc}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowSyncModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h3 style={{ marginBottom: '1.5rem' }}>Link Platforms</h3>
            
            <form onSubmit={handleSync} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Codeforces Handle</label>
                <input 
                  type="text" 
                  value={cfHandle}
                  onChange={(e) => setCfHandle(e.target.value)}
                  placeholder="tourist"
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', fontSize: '1.05rem' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>LeetCode Handle</label>
                <input 
                  type="text" 
                  value={lcHandle}
                  onChange={(e) => setLcHandle(e.target.value)}
                  placeholder="algo_master"
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', fontSize: '1.05rem' }}
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', opacity: isSyncing ? 0.7 : 1 }} disabled={isSyncing}>
                {isSyncing ? "Syncing Data (This may take up to 10 seconds)..." : "Connect & Sync"}
              </button>
            </form>
          </div>
        </div>
      )}


    </main>
  );
}
