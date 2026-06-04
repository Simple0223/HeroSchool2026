import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Cpu, Trash2, Plus, UserMinus, Shield, LogOut, Search, UserPlus, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

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
  const [newMemberInputs, setNewMemberInputs] = useState({});
  const [scoreAdjustments, setScoreAdjustments] = useState({});
  const [activeTab, setActiveTab] = useState('manage');
  const [scanResult, setScanResult] = useState(null);
  const [scannedName, setScannedName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(getTeamCollection(user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("資料獲取失敗:", err));
    return () => unsubscribe();
  }, [user]);
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) { console.error("Google 登入失敗:", err); }
  };

  const addTeam = async () => {
    if (!user || !newTeamName.trim()) return;
    await addDoc(getTeamCollection(user.uid), { name: newTeamName, score: 0, members: [], captain: '', viceCaptain: '' });
    setNewTeamName('');
  };

  const updateTeam = async (id, data) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'teams', id), data);
  };

  const deleteTeam = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'teams', id));
  };

  const addMember = async (team) => {
    const name = newMemberInputs[team.id];
    if (name && name.trim()) {
      await updateTeam(team.id, { members: [...(team.members || []), name.trim()] });
      setNewMemberInputs({ ...newMemberInputs, [team.id]: '' });
    }
  };

  const applyScoreAdjustment = (team, operation) => {
    const val = parseInt(scoreAdjustments[team.id] || 0);
    if (isNaN(val) || !user) return;
    const newScore = operation === 'add' ? (team.score || 0) + val : (team.score || 0) - val;
    updateTeam(team.id, { score: newScore });
  };

  const handleScan = (e) => {
    if(e.key === 'Enter') {
        const inputName = e.target.value.trim();
        const foundTeam = teams.find(t => (t.members || []).includes(inputName));
        if(foundTeam) {
            setScanResult(foundTeam);
            setScannedName(inputName);
            setTimeout(() => { setScanResult(null); setScannedName(''); }, 3000);
        } else {
            setScanResult(null); setScannedName('查無此人');
            setTimeout(() => { setScannedName(''); }, 3000);
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
          <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 px-8 py-3 rounded-xl font-bold">
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-cyan-400 flex items-center gap-2"><Shield /> 指揮中心</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setActiveTab('manage')} className={activeTab === 'manage' ? 'text-white underline' : 'text-slate-500'}>管理</button>
          <button onClick={() => setActiveTab('scan')} className={activeTab === 'scan' ? 'text-white underline' : 'text-slate-500'}>簽到</button>
          <button onClick={() => setActiveTab('rank')} className={activeTab === 'rank' ? 'text-white underline' : 'text-slate-500'}>排行</button>
          <button onClick={() => setIsLoggedIn(false)} className="text-red-400 ml-4"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {activeTab === 'manage' ? (
          <>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex gap-2">
              <input className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white" value={newTeamName} placeholder="新增隊伍名稱..." onChange={(e) => setNewTeamName(e.target.value)} />
              <button onClick={addTeam} className="bg-cyan-600 px-6 py-2 rounded-lg font-bold"><Plus /></button>
            </div>
            {teams.map(team => (
              <div key={team.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <input className="bg-transparent text-xl font-bold text-white w-full" defaultValue={team.name} onBlur={(e) => updateTeam(team.id, { name: e.target.value })} />
                  <button onClick={() => deleteTeam(team.id)} className="text-red-500"><Trash2 size={18}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-cyan-400 font-bold text-xl">分數: {team.score || 0}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" className="w-16 bg-slate-900 text-white p-1 rounded text-center" placeholder="數值" onChange={(e) => setScoreAdjustments({...scoreAdjustments, [team.id]: e.target.value})} />
                      <button onClick={() => applyScoreAdjustment(team, 'add')} className="bg-green-700 p-1 rounded"><ChevronUp size={16}/></button>
                      <button onClick={() => applyScoreAdjustment(team, 'sub')} className="bg-red-700 p-1 rounded"><ChevronDown size={16}/></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select className="bg-slate-800 p-1 rounded text-sm" value={team.captain || ''} onChange={(e) => updateTeam(team.id, { captain: e.target.value })}><option value="">隊長</option>{(team.members || []).map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <select className="bg-slate-800 p-1 rounded text-sm" value={team.viceCaptain || ''} onChange={(e) => updateTeam(team.id, { viceCaptain: e.target.value })}><option value="">副隊長</option>{(team.members || []).map(m => <option key={m} value={m}>{m}</option>)}</select>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm" placeholder="輸入新隊員名稱..." value={newMemberInputs[team.id] || ''} onChange={(e) => setNewMemberInputs({...newMemberInputs, [team.id]: e.target.value})}/>
                  <button onClick={() => addMember(team)} className="bg-cyan-700 px-4 py-2 rounded-lg text-sm flex items-center gap-1"><UserPlus size={16}/> 加入</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(team.members || []).map((m, i) => (
                      <span key={i} className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${m === team.captain ? 'bg-amber-900 text-amber-200' : m === team.viceCaptain ? 'bg-sky-900 text-sky-200' : 'bg-slate-800 text-slate-300'}`}>
                          {m} <UserMinus size={14} className="text-red-400 cursor-pointer" onClick={() => updateTeam(team.id, { members: team.members.filter((_, idx) => idx !== i) })}/>
                      </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : activeTab === 'rank' ? (
          <div className="space-y-4">
            {[...teams].sort((a,b) => (b.score || 0) - (a.score || 0)).map((t, idx) => (
              <div key={t.id} className={`flex justify-between items-center p-6 rounded-xl border ${idx === 0 ? 'bg-amber-900/20 border-amber-500' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-slate-600">#{idx + 1}</span>
                    <span className="text-2xl font-bold text-white">{t.name}</span>
                </div>
                <span className="text-4xl font-black text-cyan-400">{t.score || 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 p-8 rounded-xl text-center">
            <Search className="mx-auto mb-4 text-cyan-500" size={48} />
            <input autoFocus className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 text-center text-white" placeholder="輸入姓名以簽到..." onKeyDown={handleScan} />
            {scanResult && (
                <div className="mt-8 p-6 bg-slate-800 rounded-xl text-center border border-cyan-500">
                    <CheckCircle2 className="mx-auto text-green-500 mb-2" size={48} />
                    <h2 className="text-2xl font-bold text-white mb-2">{scannedName}</h2>
                    <p className="text-cyan-400 text-lg">所屬隊伍: {scanResult.name}</p>
                    <p className="text-white text-xl font-bold mt-2">目前積分: {scanResult.score || 0}</p>
                </div>
            )}
            {scannedName === '查無此人' && <p className="text-red-500 mt-4">找不到該隊員。</p>}
          </div>
        )}
      </div>
    </div>
  );
}
