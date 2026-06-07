import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Cpu, Trash2, Plus, UserMinus, Shield, LogOut, Search, UserPlus, ChevronUp, ChevronDown, CheckCircle2, Trophy, XCircle, Unlock } from 'lucide-react';

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

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [memberData, setMemberData] = useState({ name: '', code: '' });
  const [scoreInputs, setScoreInputs] = useState({}); // 用於暫存手動輸入的數值
  const [activeTab, setActiveTab] = useState('scan');
  const [scanResult, setScanResult] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    signInAnonymously(auth).catch(console.error);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const teamsCol = collection(db, 'artifacts', appId, 'users', user.uid, 'teams');
    const unsubscribe = onSnapshot(query(teamsCol), (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const safeDoc = (id) => doc(db, 'artifacts', appId, 'users', user.uid, 'teams', id);
  const addTeam = async () => {
    if (!newTeamName.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'teams'), { name: newTeamName, score: 0, members: [] });
    setNewTeamName('');
  };

  const updateTeam = async (id, data) => await updateDoc(safeDoc(id), data);
  const deleteTeam = async (id) => await deleteDoc(safeDoc(id));
  const addMember = async (team) => {
    if (!memberData.name || !memberData.code) return;
    const newMembers = [...(team.members || []), { name: memberData.name, code: memberData.code }];
    await updateTeam(team.id, { members: newMembers });
    setMemberData({ name: '', code: '' });
  };

  // 手動調整積分邏輯
  const handleScoreChange = (teamId, operation) => {
    const val = parseInt(scoreInputs[teamId] || 0);
    if (isNaN(val)) return;
    const team = teams.find(t => t.id === teamId);
    const currentScore = team.score || 0;
    const newScore = operation === 'add' ? currentScore + val : currentScore - val;
    updateTeam(teamId, { score: newScore });
    setScoreInputs(prev => ({ ...prev, [teamId]: '' })); // 清空輸入框
  };

  const processScan = (inputCode) => {
    const code = inputCode.trim();
    let found = null;
    teams.forEach(t => {
      const m = (t.members || []).find(mem => mem.code === code);
      if (m) found = { ...m, teamName: t.name, teamScore: t.score };
    });
    setScanResult(found ? { type: 'success', ...found } : { type: 'error' });
    setTimeout(() => setScanResult(null), 3000);
    setScanInput('');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-cyan-400 flex items-center gap-2"><Shield /> 指揮中心</h1>
        <div className="flex gap-4 text-sm font-bold">
          <button onClick={() => setActiveTab('scan')} className={activeTab === 'scan' ? 'text-white' : 'text-slate-500'}>簽到</button>
          {isLoggedIn ? (
            <>
              <button onClick={() => setActiveTab('manage')} className={activeTab === 'manage' ? 'text-white' : 'text-slate-500'}>管理</button>
              <button onClick={() => setActiveTab('rank')} className={activeTab === 'rank' ? 'text-white' : 'text-slate-500'}>排行</button>
              <button onClick={() => setIsLoggedIn(false)} className="text-red-400 ml-4"><LogOut size={16} /></button>
            </>
          ) : (
            <button onClick={() => setActiveTab('login')} className="text-cyan-400 flex items-center gap-1"><Unlock size={14}/> 登入</button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {activeTab === 'scan' && (
          <div className="bg-slate-900 p-8 rounded-xl text-center border border-slate-800">
            <h2 className="text-white mb-6">英雄簽到系統</h2>
            <input autoFocus className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 text-center text-white" placeholder="掃描代碼以簽到..." value={scanInput} onChange={(e) => { setScanInput(e.target.value); if(e.target.value.length >= 3) processScan(e.target.value); }} />
            {scanResult && (
              <div className={`mt-8 p-6 rounded-xl border ${scanResult.type === 'success' ? 'border-cyan-500' : 'border-red-500'}`}>
                {scanResult.type === 'success' ? <><h2 className="text-xl font-bold">{scanResult.name}</h2><p>隊伍: {scanResult.teamName}</p><p className="mt-2 text-cyan-400">目前分數: {scanResult.teamScore}</p></> : <p>查無代碼</p>}
              </div>
            )}
          </div>
        )}
        {activeTab === 'login' && !isLoggedIn && (
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center max-w-sm mx-auto">
            <input type="password" placeholder="輸入管理員授權碼" onChange={(e) => setAccessCode(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-3 rounded mb-4" />
            <button onClick={() => { if(accessCode === 'hero2026') setIsLoggedIn(true); }} className="w-full bg-cyan-600 py-2 rounded">驗證進入</button>
          </div>
        )}
        {activeTab === 'manage' && isLoggedIn && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-2">
              <input className="flex-1 bg-slate-950 p-2 rounded" placeholder="新增隊伍名稱" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
              <button onClick={addTeam} className="bg-cyan-700 px-4 rounded"><Plus size={20}/></button>
            </div>
            {teams.map(t => (
              <div key={t.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl">{t.name} <span className="text-cyan-400 font-mono">({t.score || 0} pts)</span></h3>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-16 bg-slate-950 p-1 rounded text-center text-sm" placeholder="數值" onChange={(e) => setScoreInputs({...scoreInputs, [t.id]: e.target.value})} value={scoreInputs[t.id] || ''} />
                    <button onClick={() => handleScoreChange(t.id, 'add')} className="bg-green-900 p-1 rounded text-green-400"><ChevronUp size={20}/></button>
                    <button onClick={() => handleScoreChange(t.id, 'sub')} className="bg-red-900 p-1 rounded text-red-400"><ChevronDown size={20}/></button>
                    <button onClick={() => deleteTeam(t.id)} className="text-red-500 ml-4"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  <input className="bg-slate-950 p-2 rounded w-1/3 text-sm" placeholder="姓名" onChange={(e) => setMemberData({...memberData, name: e.target.value})}/>
                  <input className="bg-slate-950 p-2 rounded w-1/3 text-sm" placeholder="代碼" onChange={(e) => setMemberData({...memberData, code: e.target.value})}/>
                  <button onClick={() => addMember(t)} className="bg-cyan-800 p-2 rounded flex-1"><UserPlus size={16}/></button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {(t.members || []).map((m, i) => <span key={i} className="bg-slate-800 px-2 py-1 rounded text-xs">{m.name} (#{m.code})</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'rank' && isLoggedIn && (
          <div className="space-y-4">
            {[...teams].sort((a,b) => (b.score || 0) - (a.score || 0)).map((t, i) => (
              <div key={t.id} className="bg-slate-900 p-4 rounded-xl flex justify-between items-center">
                <span className="font-bold">#{i+1} {t.name}</span>
                <span className="text-cyan-400 font-black">{t.score || 0} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
