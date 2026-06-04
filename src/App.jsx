import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Cpu, Trash2, Plus, UserMinus, Shield, LogOut, Search, UserPlus, ChevronUp, ChevronDown, CheckCircle2, Trophy } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyA-h2xUbIB1LDbRV7VjFZqzCIsjE2KP5HE",
  authDomain: "heroschool2026.firebaseapp.com",
  projectId: "heroschool2026",
  storageBucket: "heroschool2026.firebasestorage.app",
  messagingSenderId: "70652055677",
  appId: "1:70652055677:web:1fc54f98b315c963b6e114",
  measurementId: "G-BMX5X1E85Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cyber-sync-app';

const getTeamCollection = (uid) => collection(db, 'artifacts', appId, 'users', uid, 'teams');

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [memberData, setMemberData] = useState({ name: '', code: '' });
  const [scoreAdjustments, setScoreAdjustments] = useState({});
  const [activeTab, setActiveTab] = useState('manage');
  const [scanResult, setScanResult] = useState(null);
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { console.error("驗證失敗:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isLoggedIn) return;
    const q = query(getTeamCollection(user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user, isLoggedIn]);

  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    await addDoc(getTeamCollection(user.uid), { name: newTeamName, score: 0, members: [], captain: '', viceCaptain: '' });
    setNewTeamName('');
  };

  const updateTeam = async (id, data) => await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'teams', id), data);
  const deleteTeam = async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'teams', id));

  const addMember = async (team) => {
    if (!memberData.name || !memberData.code) return;
    const newMembers = [...(team.members || []), { name: memberData.name, code: memberData.code }];
    await updateTeam(team.id, { members: newMembers });
    setMemberData({ name: '', code: '' });
  };

  const applyScoreAdjustment = (team, operation) => {
    const val = parseInt(scoreAdjustments[team.id] || 0);
    if (isNaN(val)) return;
    const currentScore = team.score || 0;
    const newScore = operation === 'add' ? currentScore + val : currentScore - val;
    updateTeam(team.id, { score: newScore });
    setScoreAdjustments(prev => ({ ...prev, [team.id]: '' }));
  };

  const handleScan = (e) => {
    if(e.key === 'Enter') {
      const inputCode = e.target.value.trim();
      let foundMember = null;
      let foundTeam = null;

      teams.forEach(t => {
        const m = (t.members || []).find(mem => mem.code === inputCode);
        if (m) { foundMember = m; foundTeam = t; }
      });

      if(foundMember) {
        setScanResult({ ...foundMember, teamName: foundTeam.name, teamScore: foundTeam.score });
        setTimeout(() => setScanResult(null), 3000);
      } else {
        setScanResult({ name: '查無此人', code: '無效代碼' });
        setTimeout(() => setScanResult(null), 3000);
      }
      e.target.value = '';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 text-center w-full max-w-sm">
          <Cpu size={48} className="text-cyan-400 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-6">指揮中心登入</h2>
          <input type="password" placeholder="輸入授權碼" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-center mb-4" />
          <button onClick={() => { if(accessCode === 'hero2026') setIsLoggedIn(true); }} className="w-full bg-cyan-600 text-white px-8 py-3 rounded-xl font-bold">建立安全連線</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-cyan-400 flex items-center gap-2"><Shield /> 指揮中心</h1>
        <div className="flex gap-4 text-sm font-bold">
          <button onClick={() => setActiveTab('manage')} className={activeTab === 'manage' ? 'text-white' : 'text-slate-500'}>管理</button>
          <button onClick={() => setActiveTab('scan')} className={activeTab === 'scan' ? 'text-white' : 'text-slate-500'}>簽到</button>
          <button onClick={() => setActiveTab('rank')} className={activeTab === 'rank' ? 'text-white' : 'text-slate-500'}>排行</button>
          <button onClick={() => setIsLoggedIn(false)} className="text-red-400 ml-4"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {activeTab === 'manage' ? (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex gap-2">
              <input className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={newTeamName} placeholder="新增隊伍名稱..." onChange={(e) => setNewTeamName(e.target.value)} />
              <button onClick={addTeam} className="bg-cyan-600 px-6 py-2 rounded-lg font-bold"><Plus /></button>
            </div>
            {teams.map(team => (
              <div key={team.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <input className="bg-transparent text-xl font-bold text-white w-1/2" defaultValue={team.name} onBlur={(e) => updateTeam(team.id, { name: e.target.value })} />
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg">
                        <span className="font-mono text-cyan-400">{team.score || 0} pts</span>
                        <input type="number" className="w-12 bg-slate-950 text-white text-center rounded" placeholder="值" onChange={(e) => setScoreAdjustments({...scoreAdjustments, [team.id]: e.target.value})} />
                        <button onClick={() => applyScoreAdjustment(team, 'add')} className="text-green-500"><ChevronUp size={16}/></button>
                        <button onClick={() => applyScoreAdjustment(team, 'sub')} className="text-red-500"><ChevronDown size={16}/></button>
                    </div>
                    <Trash2 size={16} className="text-red-500 cursor-pointer" onClick={() => deleteTeam(team.id)} />
                </div>
                
                <div className="bg-slate-800 p-4 rounded-lg mb-4 flex gap-2">
                    <input className="w-1/3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" placeholder="姓名" value={memberData.name} onChange={(e) => setMemberData({...memberData, name: e.target.value})}/>
                    <input className="w-1/3 bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" placeholder="辨認碼" value={memberData.code} onChange={(e) => setMemberData({...memberData, code: e.target.value})}/>
                    <button onClick={() => addMember(team)} className="bg-cyan-700 flex-1 rounded text-sm"><UserPlus size={16} className="mx-auto"/></button>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  {(team.members || []).map((m, i) => (
                      <span key={i} className="bg-slate-800 px-3 py-1 rounded text-sm flex items-center gap-2 text-slate-300">
                          {m.name} <span className="text-cyan-600 font-mono text-xs">#{m.code}</span>
                          <UserMinus size={14} className="text-red-400 cursor-pointer" onClick={() => updateTeam(team.id, { members: team.members.filter((_, idx) => idx !== i) })}/>
                      </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'rank' ? (
          <div className="space-y-4">
            {[...teams].sort((a,b) => (b.score || 0) - (a.score || 0)).map((t, idx) => (
              <div key={t.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Trophy className={idx === 0 ? 'text-amber-400' : 'text-slate-600'} size={32} />
                    <span className="text-xl font-bold">{t.name}</span>
                </div>
                <span className="text-3xl font-black text-cyan-400">{t.score || 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 p-8 rounded-xl text-center border border-slate-800">
            <Search className="mx-auto mb-4 text-cyan-500" size={48} />
            <input autoFocus className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 text-center text-white" placeholder="請掃描辨認碼以簽到..." onKeyDown={handleScan} />
            {scanResult && (
                <div className="mt-8 p-6 bg-slate-800 rounded-xl text-center border border-cyan-500">
                    <CheckCircle2 className="mx-auto text-green-500 mb-2" size={48} />
                    <h2 className="text-2xl font-bold text-white mb-2">{scanResult.name}</h2>
                    <p className="text-cyan-400 text-lg">所屬隊伍: {scanResult.teamName}</p>
                    <p className="text-white text-xl font-bold mt-2">目前隊伍積分: {scanResult.teamScore} pts</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
