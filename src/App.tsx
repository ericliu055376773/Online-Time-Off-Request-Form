import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { 
  ChevronLeft, List, Clock as ClockIcon, 
  Plus, X, Check, Calendar, Trash2,
  Settings, Save, Edit2, LogOut, Camera, Lock, Eye, EyeOff, ChevronDown,
  FileText, MessageSquare, Users, BarChart3
} from 'lucide-react';

// ==========================================
// 1. Firebase 初始化與設定
// ==========================================
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return {
    apiKey: "AIzaSyClRBviF-ODfFH71NK8v11reSmw9v-dN9I",
    authDomain: "online-leave-request-form.firebaseapp.com",
    projectId: "online-leave-request-form",
    storageBucket: "online-leave-request-form.firebasestorage.app",
    messagingSenderId: "710134095872",
    appId: "1:710134095872:web:a232f0deb124b4521b78e5"
  };
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);

const getAppId = () => {
  if (typeof __app_id !== 'undefined') return __app_id;
  return 'my-leave-app-ui-demo'; 
};
const appId = getAppId();

// ==========================================
// 2. 主元件 App
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  
  // 網站全域設定
  // branches 格式: [{ name: '門店名', password: '密碼', employees: ['員工A', '員工B'] }]
  const defaultConfig = {
    title: '員工請假紀錄',
    branches: [],
    leaveTypes: ['事假', '病假', '特休', '公假', '喪假', '婚假', '產假', '生理假'],
    leaveReasons: []
  };
  const [config, setConfig] = useState(defaultConfig);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [draftConfig, setDraftConfig] = useState(defaultConfig);
  const [newBranch, setNewBranch] = useState('');
  const [newBranchPassword, setNewBranchPassword] = useState('');
  const [newLeaveType, setNewLeaveType] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // ★ 門店登入狀態
  const [loggedInBranch, setLoggedInBranch] = useState(null);
  const [loginBranchSelected, setLoginBranchSelected] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // UI 狀態
  const [activeTab, setActiveTab] = useState('leave'); // 'leave' | 'notes' | 'stats'
  const [isBackendOpen, setIsBackendOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ★ 假單篩選狀態
  const [leaveFilterMode, setLeaveFilterMode] = useState('month'); // 'month' | 'today' | 'custom'
  const [showLeaveFilterMenu, setShowLeaveFilterMenu] = useState(false);
  const [customFilterYear, setCustomFilterYear] = useState(new Date().getFullYear());
  const [customFilterMonth, setCustomFilterMonth] = useState(new Date().getMonth() + 1);

  // ★ 統計月份選擇
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState(new Date().getMonth() + 1);
  const [showStatsMonthPicker, setShowStatsMonthPicker] = useState(false);
  
  // 管理員登入
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 後台密碼顯示
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // 編輯狀態
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // ★ 備註
  const [notes, setNotes] = useState([]);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  // ★ 員工管理
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [editingEmployeeIndex, setEditingEmployeeIndex] = useState(null);
  const [editingEmployeeValue, setEditingEmployeeValue] = useState('');

  // 表單狀態
  const defaultFormData = {
    name: '', branch: '', leaveType: '事假',
    startDate: '', endDate: '',
    reasonType: '', reasonDetail: '', photoBase64: ''
  };
  const [formData, setFormData] = useState(defaultFormData);

  const leaveTypes = config.leaveTypes;
  const branchNames = (config.branches || []).map(b => typeof b === 'string' ? b : b.name);

  // ★ 取得目前門店的員工列表
  const getCurrentBranchEmployees = () => {
    if (!loggedInBranch) return [];
    const branch = (config.branches || []).find(b => (typeof b === 'string' ? b : b.name) === loggedInBranch);
    if (!branch || typeof branch === 'string') return [];
    return branch.employees || [];
  };

  const getBranchColor = (branchName) => {
    const index = branchNames.indexOf(branchName);
    const shades = ['bg-gray-900', 'bg-zinc-700', 'bg-neutral-800', 'bg-stone-600', 'bg-slate-800'];
    return shades[index >= 0 ? index % shades.length : 0];
  };

  const getBranchPassword = (branchName) => {
    const branch = (config.branches || []).find(b => (typeof b === 'string' ? b : b.name) === branchName);
    if (!branch || typeof branch === 'string') return '';
    return branch.password || '';
  };

  // ------------------------------------------
  // Firebase 身份驗證
  // ------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) { setUser(currentUser); }
      else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
          else await signInAnonymously(auth);
        } catch (error) { 
          console.error("登入失敗:", error);
          setConfigLoaded(true);  // 即使登入失敗也讓畫面顯示
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ------------------------------------------
  // Firebase 資料讀取（共用路徑，所有裝置共享）
  // ------------------------------------------
  useEffect(() => {
    if (!user) return;
    
    // ★ 改為共用路徑：artifacts/{appId}/public/data/leave_requests
    const unsubLeave = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leave_requests'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setLeaveRequests(data);
    }, (err) => console.error("讀取請假單失敗:", err));

    // ★ 改為共用路徑：artifacts/{appId}/public/data/notes
    const unsubNotes = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notes'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const dA = a.createdAt?.toDate?.() || new Date(a.dateTime || 0);
        const dB = b.createdAt?.toDate?.() || new Date(b.dateTime || 0);
        return dB - dA;
      });
      setNotes(data);
    }, (err) => console.error("讀取備註失敗:", err));

    const unsubConfig = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.branches && data.branches.length > 0 && typeof data.branches[0] === 'string') {
          data.branches = data.branches.map(name => ({ name, password: '', employees: [] }));
        }
        if (data.branches) {
          data.branches = data.branches.map(b => ({
            ...(typeof b === 'string' ? { name: b, password: '', employees: [] } : b),
            employees: (typeof b === 'string' ? [] : b.employees) || []
          }));
        }
        setConfig(data);
      }
      setConfigLoaded(true);
    }, (err) => { console.error("讀取設定失敗:", err); setConfigLoaded(true); });

    return () => { unsubLeave(); unsubNotes(); unsubConfig(); };
  }, [user]);

  // ------------------------------------------
  // 門店登入
  // ------------------------------------------
  const handleBranchLogin = () => {
    if (!loginBranchSelected) { setLoginPasswordError('請先選擇門店'); return; }
    const correctPwd = getBranchPassword(loginBranchSelected);
    if (!correctPwd) { setLoggedInBranch(loginBranchSelected); return; }
    if (loginPassword === correctPwd) { setLoggedInBranch(loginBranchSelected); setLoginPassword(''); setLoginPasswordError(''); }
    else { setLoginPasswordError('密碼錯誤，請重新輸入'); }
  };

  const handleBranchLogout = () => {
    setLoggedInBranch(null); setLoginBranchSelected(''); setLoginPassword('');
    setLoginPasswordError(''); setShowLoginPassword(false); setActiveTab('leave');
  };

  // ------------------------------------------
  // ★ 員工管理（門店級別）
  // ------------------------------------------
  const saveEmployeesToFirestore = async (updatedBranches) => {
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
      await updateDoc(configRef, { branches: updatedBranches });
    } catch (error) {
      console.error("儲存員工名單失敗:", error);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim() || !loggedInBranch) return;
    const updatedBranches = config.branches.map(b => {
      if (b.name === loggedInBranch) {
        return { ...b, employees: [...(b.employees || []), newEmployeeName.trim()] };
      }
      return b;
    });
    await saveEmployeesToFirestore(updatedBranches);
    setNewEmployeeName('');
  };

  const handleDeleteEmployee = async (index) => {
    if (!window.confirm('確定要刪除這位員工嗎？')) return;
    const updatedBranches = config.branches.map(b => {
      if (b.name === loggedInBranch) {
        const emps = [...(b.employees || [])];
        emps.splice(index, 1);
        return { ...b, employees: emps };
      }
      return b;
    });
    await saveEmployeesToFirestore(updatedBranches);
  };

  const handleStartEditEmployee = (index, name) => {
    setEditingEmployeeIndex(index);
    setEditingEmployeeValue(name);
  };

  const handleSaveEditEmployee = async () => {
    if (editingEmployeeIndex === null || !editingEmployeeValue.trim()) return;
    const updatedBranches = config.branches.map(b => {
      if (b.name === loggedInBranch) {
        const emps = [...(b.employees || [])];
        emps[editingEmployeeIndex] = editingEmployeeValue.trim();
        return { ...b, employees: emps };
      }
      return b;
    });
    await saveEmployeesToFirestore(updatedBranches);
    setEditingEmployeeIndex(null);
    setEditingEmployeeValue('');
  };

  // ------------------------------------------
  // 表單邏輯
  // ------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFabClick = () => {
    if (activeTab === 'notes') { setIsFormOpen(false); openNoteForm(); }
    else if (activeTab === 'leave') {
      setIsNoteFormOpen(false);
      setFormData({ ...defaultFormData, branch: loggedInBranch });
      setEditingId(null); setMessage({ type: '', text: '' }); setIsFormOpen(true);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false); setFormData(defaultFormData); setEditingId(null); setMessage({ type: '', text: '' });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMessage({ type: 'info', text: '照片壓縮處理中...' });
    try {
      const compressedBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > h) { if (w > 800) { h *= 800 / w; w = 800; } } else { if (h > 800) { w *= 800 / h; h = 800; } }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
        };
      });
      if (compressedBase64.length * 0.75 > 950 * 1024) setMessage({ type: 'error', text: '圖片過大，請換一張' });
      else { setFormData(prev => ({ ...prev, photoBase64: compressedBase64 })); setMessage({ type: '', text: '' }); }
    } catch { setMessage({ type: 'error', text: '圖片處理失敗' }); }
  };

  const removePhoto = () => { setFormData(prev => ({ ...prev, photoBase64: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch) { setMessage({ type: 'error', text: '請選擇分店！' }); return; }
    if (!formData.name.trim()) { setMessage({ type: 'error', text: '請選擇員工姓名！' }); return; }
    if (!formData.startDate) { setMessage({ type: 'error', text: '請選擇開始時間！' }); return; }
    if (!formData.endDate) { setMessage({ type: 'error', text: '請選擇結束時間！' }); return; }
    if (!formData.reasonType.trim()) { setMessage({ type: 'error', text: '請輸入請假事由！' }); return; }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) { setMessage({ type: 'error', text: '結束時間必須晚於開始時間！' }); return; }
    if (!user) { setMessage({ type: 'error', text: '尚未連線，請稍後再試。' }); return; }

    setIsSubmitting(true); setMessage({ type: '', text: '' });
    const saveData = {
      name: formData.name, branch: formData.branch, leaveType: formData.leaveType,
      startDate: formData.startDate, endDate: formData.endDate,
      reasonType: formData.reasonType, reasonDetail: formData.reasonDetail,
      reason: formData.reasonType.trim(), photoBase64: formData.photoBase64
    };
    try {
      if (editingId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leave_requests', editingId), { ...saveData, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leave_requests'), { ...saveData, status: '待審核', createdAt: serverTimestamp() });
      closeForm();
    } catch { setMessage({ type: 'error', text: '儲存失敗' }); }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = (req) => {
    setFormData({ name: req.name, branch: req.branch, leaveType: req.leaveType, startDate: req.startDate, endDate: req.endDate, reasonType: req.reasonType || req.reason || '', reasonDetail: req.reasonDetail || '', photoBase64: req.photoBase64 || '' });
    setEditingId(req.id); setMessage({ type: '', text: '' }); setIsNoteFormOpen(false); setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm('確定要刪除這筆請假紀錄嗎？')) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leave_requests', id)); } catch {}
  };

  // ------------------------------------------
  // 備註
  // ------------------------------------------
  const getNowDateTimeString = () => {
    const now = new Date(); const p = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}/${p(now.getMonth() + 1)}/${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
  };

  const openNoteForm = (note = null) => {
    setIsFormOpen(false);  // ★ 先關閉假單表單
    if (note) { setNoteContent(note.content); setEditingNoteId(note.id); }
    else { setNoteContent(''); setEditingNoteId(null); }
    setIsNoteFormOpen(true);
  };
  const closeNoteForm = () => { setIsNoteFormOpen(false); setNoteContent(''); setEditingNoteId(null); };

  const handleNoteSubmit = async () => {
    if (!noteContent.trim() || !user) return;
    setIsSubmittingNote(true);
    try {
      if (editingNoteId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notes', editingNoteId), { content: noteContent.trim(), updatedAt: serverTimestamp() });
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notes'), { content: noteContent.trim(), branch: loggedInBranch, dateTime: getNowDateTimeString(), createdAt: serverTimestamp() });
      closeNoteForm();
    } catch {} finally { setIsSubmittingNote(false); }
  };

  const handleDeleteNote = async (id) => {
    if (!user || !window.confirm('確定要刪除這筆備註嗎？')) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notes', id)); } catch {}
  };

  // ------------------------------------------
  // ★ 請假統計（支援選擇月份）
  // ------------------------------------------
  const getMonthlyStats = () => {
    const targetYear = statsYear;
    const targetMonth = statsMonth - 1; // JS month is 0-based

    const monthlyRequests = leaveRequests.filter(req => {
      if (loggedInBranch && loggedInBranch !== '__admin__' && req.branch !== loggedInBranch) return false;
      const startDate = new Date(req.startDate);
      return startDate.getFullYear() === targetYear && startDate.getMonth() === targetMonth;
    });

    // 依員工分組統計
    const statsMap = {};
    monthlyRequests.forEach(req => {
      const name = req.name || '未知';
      if (!statsMap[name]) statsMap[name] = { count: 0, types: {} };
      statsMap[name].count += 1;
      const t = req.leaveType || '其他';
      statsMap[name].types[t] = (statsMap[name].types[t] || 0) + 1;
    });

    // 轉為陣列並按次數排序
    return Object.entries(statsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  };

  // ------------------------------------------
  // 管理員後台
  // ------------------------------------------
  const handleAdminLogout = () => { setIsBackendOpen(false); setLoggedInBranch(null); setIsSettingsMode(false); };

  const handleOpenSettings = () => { setDraftConfig(JSON.parse(JSON.stringify(config))); setIsSettingsMode(true); setVisiblePasswords({}); };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global'), draftConfig); setIsSettingsMode(false); }
    catch {} finally { setIsSavingConfig(false); }
  };

  const handleAddBranch = () => {
    if (!newBranch.trim() || !newBranchPassword.trim()) return;
    setDraftConfig(prev => ({ ...prev, branches: [...prev.branches, { name: newBranch.trim(), password: newBranchPassword.trim(), employees: [] }] }));
    setNewBranch(''); setNewBranchPassword('');
  };
  const handleUpdateBranchPassword = (i, v) => { setDraftConfig(prev => { const u = [...prev.branches]; u[i] = { ...u[i], password: v }; return { ...prev, branches: u }; }); };
  const handleUpdateBranchName = (i, v) => { setDraftConfig(prev => { const u = [...prev.branches]; u[i] = { ...u[i], name: v }; return { ...prev, branches: u }; }); };
  const handleRemoveArrayItem = (field, index) => { setDraftConfig(prev => { const a = [...prev[field]]; a.splice(index, 1); return { ...prev, [field]: a }; }); };
  const handleAddLeaveReason = () => { if (!newLeaveReason.trim()) return; setDraftConfig(prev => ({ ...prev, leaveReasons: [...(prev.leaveReasons || []), newLeaveReason.trim()] })); setNewLeaveReason(''); };
  const handleRemoveLeaveReason = (i) => { setDraftConfig(prev => { const a = [...(prev.leaveReasons || [])]; a.splice(i, 1); return { ...prev, leaveReasons: a }; }); };
  const togglePasswordVisibility = (i) => { setVisiblePasswords(prev => ({ ...prev, [i]: !prev[i] })); };

  // ★ 假單篩選邏輯
  const getFilteredLeaveRequests = () => {
    // 先依門店過濾
    let filtered = leaveRequests.filter(r => r.branch === loggedInBranch);
    
    if (leaveFilterMode === 'today') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
      filtered = filtered.filter(r => {
        const d = new Date(r.startDate);
        const dStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
        return dStr === todayStr;
      });
    } else if (leaveFilterMode === 'month') {
      const now = new Date();
      filtered = filtered.filter(r => {
        const d = new Date(r.startDate);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    } else if (leaveFilterMode === 'custom') {
      filtered = filtered.filter(r => {
        const d = new Date(r.startDate);
        return d.getFullYear() === customFilterYear && d.getMonth() === customFilterMonth - 1;
      });
    }
    return filtered;
  };

  const getFilterLabel = () => {
    if (leaveFilterMode === 'today') {
      const t = new Date();
      return `${t.getMonth() + 1}/${t.getDate()} 當日假單`;
    }
    if (leaveFilterMode === 'month') {
      const t = new Date();
      return `${t.getFullYear()}年${t.getMonth() + 1}月 假單`;
    }
    if (leaveFilterMode === 'custom') {
      return `${customFilterYear}年${customFilterMonth}月 假單`;
    }
    return '假單總覽';
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const h = (new Date(end) - new Date(start)) / 3600000;
    return h < 1 ? '小於 1 小時' : `${Math.round(h * 10) / 10} 小時`;
  };

  // ==========================================
  // 3. 渲染
  // ==========================================

  // ★ 閃爍動畫 style（寫在元件內，不需改 index.html）
  useEffect(() => {
    if (document.getElementById('pulse-style')) return;
    const style = document.createElement('style');
    style.id = 'pulse-style';
    style.textContent = `
      @keyframes btnPulse {
        0%, 100% { background-color: #f3f4f6; color: #6b7280; }
        50% { background-color: #333333; color: #ffffff; }
      }
      .btn-pulse { animation: btnPulse 2s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }, []);

  if (!configLoaded) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 flex justify-center font-sans">
        <div className="w-full max-w-[400px] bg-[#f8f9fa] relative shadow-2xl flex flex-col h-[100dvh] overflow-hidden text-gray-800 items-center justify-center">
          <div className="text-gray-400 text-sm">載入中...</div>
        </div>
      </div>
    );
  }

  // ★ 門店登入畫面
  if (!loggedInBranch) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 flex justify-center font-sans">
        <div className="w-full max-w-[400px] bg-[#f8f9fa] relative shadow-2xl flex flex-col h-[100dvh] overflow-hidden text-gray-800">
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-16 h-16 bg-[#333333] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-wide cursor-pointer hover:opacity-60 transition-opacity select-none" onClick={() => setShowAdminLoginModal(true)}>{config.title}</h1>
            <p className="text-sm text-gray-400 mb-10">請選擇您的門店並輸入密碼</p>

            {branchNames.length === 0 ? (
              <div className="text-center text-gray-400 text-sm space-y-2">
                <p>尚未設定任何門店</p>
                <p className="text-xs">請管理員先至後台新增門店</p>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">選擇門店</label>
                  <div className="relative">
                    <select value={loginBranchSelected} onChange={(e) => { setLoginBranchSelected(e.target.value); setLoginPasswordError(''); setLoginPassword(''); }}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none shadow-sm">
                      <option value="">請選擇門店</option>
                      {branchNames.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {loginBranchSelected && getBranchPassword(loginBranchSelected) && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">門店密碼</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock className="w-4 h-4" /></div>
                      <input type={showLoginPassword ? 'text' : 'password'} value={loginPassword}
                        onChange={e => { setLoginPassword(e.target.value); setLoginPasswordError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleBranchLogin()}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-11 py-3.5 text-sm font-medium text-gray-800 outline-none shadow-sm" placeholder="請輸入門店密碼" />
                      <button onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {loginPasswordError && <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{loginPasswordError}</p>}

                <button onClick={handleBranchLogin} disabled={!loginBranchSelected}
                  className="w-full bg-[#333333] hover:bg-black disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold tracking-wide transition shadow-lg mt-2">
                  進入系統
                </button>
              </div>
            )}
          </div>
          <div className="px-8 pb-10 pt-4"></div>

          {/* 管理員登入 Modal — 只需密碼 */}
          {showAdminLoginModal && (
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowAdminLoginModal(false)}>
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">管理員登入</h3>
                  <button onClick={() => { setShowAdminLoginModal(false); setLoginError(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">管理員密碼</label>
                    <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setLoginError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') { if (adminPassword === '6773') { setShowAdminLoginModal(false); setIsBackendOpen(true); setLoggedInBranch('__admin__'); setAdminPassword(''); setLoginError(''); } else { setLoginError('密碼錯誤！'); } } }}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none" placeholder="請輸入管理員密碼" />
                  </div>
                  {loginError && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">{loginError}</p>}
                  <button type="button" onClick={() => { if (adminPassword === '6773') { setShowAdminLoginModal(false); setIsBackendOpen(true); setLoggedInBranch('__admin__'); setAdminPassword(''); setLoginError(''); } else { setLoginError('密碼錯誤！'); } }}
                    className="w-full bg-[#333333] hover:bg-black text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2">確認登入</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ★ 統計資料
  const monthlyStats = getMonthlyStats();
  const now = new Date();
  const currentMonthLabel = `${statsYear} 年 ${statsMonth} 月`;
  const employees = getCurrentBranchEmployees();

  // ==========================================
  // ★ 已登入主介面
  // ==========================================
  return (
    <div className="min-h-[100dvh] bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-[400px] bg-[#f8f9fa] relative shadow-2xl flex flex-col h-[100dvh] overflow-hidden text-gray-800">
        
        {/* 頂部 */}
        <header className="flex justify-between items-center px-6 pt-12 pb-4 bg-[#f8f9fa] z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isBackendOpen ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-400 font-medium">{isBackendOpen ? '管理員' : loggedInBranch}</span>
          </div>
          <h1 className="text-xl font-bold tracking-wide text-gray-900 cursor-pointer hover:opacity-60 transition-opacity select-none"
            onClick={() => { 
              if (isBackendOpen) { setIsBackendOpen(false); setIsSettingsMode(false); }
              else { setShowAdminLoginModal(true); setAdminPassword(''); setLoginError(''); }
            }}>{config.title}</h1>
          <div className="flex items-center gap-2">
            {/* ★ 員工管理按鈕 — 僅門店員工可見 */}
            {!isBackendOpen && loggedInBranch !== '__admin__' && (
              <button onClick={() => { setIsEmployeeModalOpen(true); setEditingEmployeeIndex(null); setNewEmployeeName(''); }}
                className="text-gray-400 hover:text-gray-700 transition p-1"><Users className="w-4 h-4" /></button>
            )}
            <button onClick={isBackendOpen ? handleAdminLogout : handleBranchLogout} className="text-xs text-gray-400 hover:text-red-500 transition font-medium">登出</button>
          </div>
        </header>

        {/* 內容 */}
        {isBackendOpen ? (
          // ==============================
          // 後台
          // ==============================
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-white rounded-t-3xl shadow-inner mt-2">
            {isSettingsMode ? (
              <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setIsSettingsMode(false)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition"><ChevronLeft className="w-6 h-6" /></button>
                  <h2 className="text-lg font-bold text-gray-800">系統設定</h2>
                  <div className="w-6"></div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">系統標題文字</label>
                  <input type="text" value={draftConfig.title} onChange={(e) => setDraftConfig(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">分店名單管理</label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {(draftConfig.branches || []).map((b, i) => {
                      const obj = typeof b === 'string' ? { name: b, password: '' } : b;
                      const vis = visiblePasswords[i];
                      return (
                        <div key={i} className="bg-white px-3 py-3 rounded-lg border border-gray-100 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <input type="text" value={obj.name} onChange={(e) => handleUpdateBranchName(i, e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent outline-none flex-1 mr-2" />
                            <button onClick={() => handleRemoveArrayItem('branches', i)} className="text-gray-300 hover:text-red-500 transition shrink-0"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <input type={vis ? 'text' : 'password'} value={obj.password} onChange={(e) => handleUpdateBranchPassword(i, e.target.value)} className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 outline-none" placeholder="設定密碼" />
                            <button onClick={() => togglePasswordVisibility(i)} className="text-gray-400 hover:text-gray-600 shrink-0">{vis ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                          </div>
                          {/* 顯示員工數量 */}
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Users className="w-3 h-3" />
                            <span>員工 {(obj.employees || []).length} 人</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
                      <input type="text" value={newBranch} onChange={e => setNewBranch(e.target.value)} placeholder="新門店名稱..." className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input type="text" value={newBranchPassword} onChange={e => setNewBranchPassword(e.target.value)} placeholder="設定密碼..." className="flex-1 text-sm outline-none bg-transparent" />
                        </div>
                        <button onClick={handleAddBranch} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition text-sm shrink-0">新增</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">假別清單管理</label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {(draftConfig.leaveTypes || []).map((t, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{t}</span>
                        <button onClick={() => handleRemoveArrayItem('leaveTypes', i)} className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <input type="text" value={newLeaveType} onChange={e => setNewLeaveType(e.target.value)} placeholder="輸入新假別..." className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
                      <button onClick={() => { if (!newLeaveType.trim()) return; setDraftConfig(prev => ({ ...prev, leaveTypes: [...prev.leaveTypes, newLeaveType.trim()] })); setNewLeaveType(''); }} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition">新增</button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 pb-10">
                  <button onClick={handleSaveConfig} disabled={isSavingConfig} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold tracking-wide transition shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2">
                    {isSavingConfig ? '儲存中...' : <><Save className="w-5 h-5"/> 儲存設定</>}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex justify-between items-center">管理員後台 <div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">已登入</div></h2>
                <div className="space-y-4">
                  <button onClick={handleOpenSettings} className="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-gray-100 transition-all active:scale-[0.98]">
                    <div className="bg-white p-3 rounded-full shadow-sm"><Settings className="w-6 h-6 text-gray-700" /></div>
                    <span className="text-[15px] font-bold text-gray-800 tracking-wide">系統設定</span>
                  </button>
                  <button onClick={handleAdminLogout} className="w-full bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center gap-4 hover:bg-red-100 transition-all active:scale-[0.98]">
                    <div className="bg-white p-3 rounded-full shadow-sm text-red-500"><LogOut className="w-6 h-6" /></div>
                    <span className="text-[15px] font-bold text-red-600 tracking-wide">登出管理員帳號</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // ==============================
          // 前台（三個分頁）
          // ==============================
          <div className="flex-1 overflow-y-auto px-6 pb-32 pt-4">
            {activeTab === 'leave' ? (
              /* --- 假單總覽（篩選後顯示） --- */
              <div className="mb-4">
                {/* 篩選標籤 */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-sm font-bold text-gray-700">{getFilterLabel()}</span>
                  <span className="text-xs text-gray-400">{getFilteredLeaveRequests().length} 筆</span>
                </div>
                {(() => {
                  const filtered = getFilteredLeaveRequests();
                  return filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">此期間沒有請假紀錄</div>
                ) : (
                  <div className="relative pt-2">
                    {filtered.map((req) => (
                      <div key={req.id} className="flex relative mb-6 group bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-50">
                        <div className={`w-10 shrink-0 flex items-center justify-center ${getBranchColor(req.branch)}`}>
                          <span className="text-white text-[13px] font-bold tracking-[0.2em] py-3 select-none" style={{ writingMode: 'vertical-rl' }}>{req.branch}</span>
                        </div>
                        <div className="flex-1 p-4 relative bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-gray-900 text-[15px] leading-tight">{req.name}</h4>
                            <div className="flex items-center gap-2.5">
                              <button onClick={() => handleEdit(req)} className="text-gray-300 hover:text-blue-500 transition"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(req.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center text-xs text-gray-400"><Calendar className="w-3.5 h-3.5 mr-2 shrink-0" /><span className="truncate">{new Date(req.startDate).toLocaleDateString('zh-TW')} - {new Date(req.endDate).toLocaleDateString('zh-TW')}</span></div>
                            <div className="flex items-center text-xs text-gray-400"><ClockIcon className="w-3.5 h-3.5 mr-2 shrink-0" /><span>時長：{calculateDuration(req.startDate, req.endDate)} ({req.leaveType})</span></div>
                          </div>
                          {req.photoBase64 && (<div className="mb-3 rounded-lg overflow-hidden border border-gray-100 max-h-32 bg-gray-50 flex justify-center"><img src={req.photoBase64} alt="" className="object-cover h-full w-full" /></div>)}
                          <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-50">
                            <p className="text-[13px] text-gray-600 leading-relaxed break-words">{req.reason || req.reasonType || ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
                })()}
              </div>
            ) : activeTab === 'notes' ? (
              /* --- 備註（只顯示本門店） --- */
              <div className="mb-4">
                {(() => {
                  const filteredNotes = notes.filter(n => n.branch === loggedInBranch);
                  return filteredNotes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>目前沒有任何備註</p>
                    <p className="text-xs mt-1">點擊右下角 + 新增備註</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {filteredNotes.map((note) => (
                      <div key={note.id} className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400"><Calendar className="w-3.5 h-3.5" /><span>{note.dateTime}</span></div>
                          <div className="flex items-center gap-2.5">
                            <button onClick={() => openNoteForm(note)} className="text-gray-300 hover:text-blue-500 transition"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteNote(note.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {note.branch && <div className="mb-2"><span className="inline-block bg-gray-200 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{note.branch}</span></div>}
                        <p className="text-[13px] text-gray-700 leading-relaxed break-words whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                );
                })()}
              </div>
            ) : (
              /* --- ★ 請假統計（可選月份） --- */
              <div className="mb-4">
                {/* 月份選擇器 */}
                <div className="flex items-center gap-2 mb-4">
                  <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none">
                    {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select value={statsMonth} onChange={e => setStatsMonth(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50 p-5 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-gray-800">請假統計</h3>
                    <span className="text-xs text-gray-400 font-medium">{currentMonthLabel}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{loggedInBranch} · 共 {monthlyStats.reduce((s, e) => s + e.count, 0)} 筆</p>

                  {monthlyStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>該月份尚無請假紀錄</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monthlyStats.map((emp, i) => {
                        const maxCount = monthlyStats[0]?.count || 1;
                        const barWidth = Math.max((emp.count / maxCount) * 100, 15);
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm font-bold text-gray-800">{emp.name}</span>
                              <span className="text-sm font-bold text-gray-900">{emp.count} 次</span>
                            </div>
                            {/* 長條圖 */}
                            <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div className="h-full bg-gray-800 rounded-full flex items-center transition-all duration-500 ease-out" style={{ width: `${barWidth}%` }}>
                              </div>
                            </div>
                            {/* 假別明細 */}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Object.entries(emp.types).map(([type, count]) => (
                                <span key={type} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{type} {count}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 管理員登入 Modal */}
        {showAdminLoginModal && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => { setShowAdminLoginModal(false); setLoginError(''); }}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">管理員登入</h3>
                <button onClick={() => { setShowAdminLoginModal(false); setLoginError(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">管理員密碼</label>
                  <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setLoginError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (adminPassword === '6773') { setShowAdminLoginModal(false); setIsBackendOpen(true); setLoggedInBranch('__admin__'); setAdminPassword(''); setLoginError(''); } else { setLoginError('密碼錯誤！'); } } }}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none" placeholder="請輸入管理員密碼" />
                </div>
                {loginError && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">{loginError}</p>}
                <button type="button" onClick={() => { if (adminPassword === '6773') { setShowAdminLoginModal(false); setIsBackendOpen(true); setLoggedInBranch('__admin__'); setAdminPassword(''); setLoginError(''); } else { setLoginError('密碼錯誤！'); } }}
                  className="w-full bg-[#333333] hover:bg-black text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2">確認登入</button>
              </div>
            </div>
          </div>
        )}

        {/* ★ 員工管理 Modal */}
        {isEmployeeModalOpen && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-end justify-center" onClick={() => setIsEmployeeModalOpen(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-[400px] shadow-2xl max-h-[75%] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-gray-600" />{loggedInBranch} 員工管理</h3>
                <button onClick={() => setIsEmployeeModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>尚未新增任何員工</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employees.map((emp, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                        {editingEmployeeIndex === i ? (
                          <>
                            <input type="text" value={editingEmployeeValue} onChange={e => setEditingEmployeeValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveEditEmployee()}
                              className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none" autoFocus />
                            <button onClick={handleSaveEditEmployee} className="text-green-500 hover:text-green-700 transition"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingEmployeeIndex(null)} className="text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium text-gray-700">{emp}</span>
                            <button onClick={() => handleStartEditEmployee(i, emp)} className="text-gray-300 hover:text-blue-500 transition"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteEmployee(i)} className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 pb-8">
                <div className="flex gap-2">
                  <input type="text" value={newEmployeeName} onChange={e => setNewEmployeeName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddEmployee()}
                    placeholder="輸入新員工姓名..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none" />
                  <button onClick={handleAddEmployee} disabled={!newEmployeeName.trim()}
                    className="bg-[#333333] hover:bg-black disabled:bg-gray-300 text-white px-5 rounded-xl font-bold transition text-sm">新增</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAB — 管理員後台時隱藏 */}
        {!isBackendOpen && loggedInBranch !== '__admin__' && activeTab !== 'stats' && (
          <button onClick={handleFabClick}
            className="absolute bottom-[120px] right-6 w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 z-30 bg-[#333333] text-white hover:bg-black active:scale-95">
            <Plus className="w-7 h-7" />
          </button>
        )}

        {/* ★ 假單篩選彈出選單 */}
        {showLeaveFilterMenu && (
          <div className="absolute inset-0 z-20" onClick={() => setShowLeaveFilterMenu(false)}>
            <div className="absolute bottom-[100px] left-4 right-4 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] border border-gray-100 p-3 space-y-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setLeaveFilterMode('month'); setActiveTab('leave'); setShowLeaveFilterMenu(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${leaveFilterMode === 'month' ? 'bg-[#333333] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                📅 查詢當月假單
              </button>
              <button onClick={() => { setLeaveFilterMode('today'); setActiveTab('leave'); setShowLeaveFilterMenu(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${leaveFilterMode === 'today' ? 'bg-[#333333] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                📋 查詢當日假單
              </button>
              <div className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition ${leaveFilterMode === 'custom' ? 'bg-[#333333] text-white' : 'bg-gray-50 text-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <span>🔍 查詢自選月份假單</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <select value={customFilterYear} onChange={e => setCustomFilterYear(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none">
                    {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select value={customFilterMonth} onChange={e => setCustomFilterMonth(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                  <button onClick={() => { setLeaveFilterMode('custom'); setActiveTab('leave'); setShowLeaveFilterMenu(false); }}
                    className="bg-[#333333] text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-black transition shrink-0">查詢</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ★ 底部導航列（三個分頁）— 管理員後台時隱藏 */}
        <nav className={`absolute bottom-0 w-full bg-white px-4 py-4 flex justify-center items-center gap-2 rounded-t-[36px] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-10 pb-8 ${isBackendOpen ? 'hidden' : ''}`}>
          <div onClick={() => { 
              setIsFormOpen(false); setIsNoteFormOpen(false);
              if (activeTab !== 'leave') { 
                setIsBackendOpen(false); setActiveTab('leave'); setShowLeaveFilterMenu(false); 
              } else { 
                setShowLeaveFilterMenu(!showLeaveFilterMenu); 
              }
            }}
            className={`flex-1 px-2 py-3 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition ${activeTab === 'leave' && !isBackendOpen ? 'bg-[#333333] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 btn-pulse'}`}>
            <List className="w-4 h-4" />
            <span className="text-[13px] font-medium">假單總覽</span>
          </div>
          <div onClick={() => { setIsBackendOpen(false); setActiveTab('notes'); setIsFormOpen(false); setIsNoteFormOpen(false); setShowLeaveFilterMenu(false); }}
            className={`flex-1 px-2 py-3 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition ${activeTab === 'notes' && !isBackendOpen ? 'bg-[#333333] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <MessageSquare className="w-4 h-4" />
            <span className="text-[13px] font-medium">備註</span>
          </div>
          <div onClick={() => { setIsBackendOpen(false); setActiveTab('stats'); setIsFormOpen(false); setIsNoteFormOpen(false); setShowLeaveFilterMenu(false); }}
            className={`flex-1 px-2 py-3 rounded-full flex items-center justify-center gap-1.5 cursor-pointer transition ${activeTab === 'stats' && !isBackendOpen ? 'bg-[#333333] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <BarChart3 className="w-4 h-4" />
            <span className="text-[13px] font-medium">統計</span>
          </div>
        </nav>

        {/* 假單表單 Modal */}
        {isFormOpen && (
        <div className="absolute inset-x-0 bottom-0 bg-white z-50 rounded-t-[36px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] h-[90%] flex flex-col">
          <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">{editingId ? '編輯請假單' : '填寫請假單'}</h2>
            <button onClick={closeForm} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="leaveForm" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">分店名稱</label>
                <select name="branch" value={formData.branch} onChange={handleInputChange} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none">
                  <option value="" disabled>請選擇分店</option>
                  {branchNames.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* ★ 員工姓名下拉選單 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">員工姓名</label>
                {employees.length > 0 ? (
                  <div className="relative">
                    <select name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none">
                      <option value="" disabled>請選擇員工</option>
                      {employees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <div>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none" placeholder="輸入姓名（請先至員工管理新增）" />
                    <p className="text-[11px] text-amber-500 mt-1 ml-1">尚未新增員工名單，請點擊右上角 👥 管理員工</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">請假類別</label>
                <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none">
                  {leaveTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">開始時間</label>
                  <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-gray-50 border-none rounded-xl px-3 py-3.5 text-xs font-medium text-gray-800 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">結束時間</label>
                  <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-gray-50 border-none rounded-xl px-3 py-3.5 text-xs font-medium text-gray-800 outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">請假事由</label>
                <textarea name="reasonType" rows="3" value={formData.reasonType} onChange={handleInputChange} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none resize-none" placeholder="請輸入請假原因..."></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-500 uppercase tracking-wider ml-1">附加照片 (非必填)</label>
                {formData.photoBase64 ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                    <img src={formData.photoBase64} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={removePhoto} className="absolute top-2 right-2 bg-gray-900/60 text-white p-1.5 rounded-full hover:bg-gray-900 transition"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <Camera className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 font-medium">點擊拍照或上傳</p>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {message.text && (<div className={`text-xs font-medium p-3 rounded-lg ${message.type === 'error' ? 'text-red-600 bg-red-50' : message.type === 'info' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'}`}>{message.text}</div>)}
            </form>
          </div>
          <div className="p-6 bg-white border-t border-gray-50 pb-10">
            <button form="leaveForm" type="submit" disabled={isSubmitting} className="w-full bg-[#333333] hover:bg-black text-white py-4 rounded-2xl font-bold tracking-wide transition shadow-lg flex justify-center items-center gap-2">
              {isSubmitting ? '處理中...' : <><Check className="w-5 h-5"/> {editingId ? '儲存修改' : '確認送出'}</>}
            </button>
          </div>
        </div>
        )}

        {/* 備註表單 Modal */}
        {isNoteFormOpen && (
        <div className="absolute inset-x-0 bottom-0 bg-white z-[55] rounded-t-[36px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] h-[60%] flex flex-col">
          <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">{editingNoteId ? '編輯備註' : '新增備註'}</h2>
            <button onClick={closeNoteForm} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-2 mb-4 bg-gray-50 px-4 py-3 rounded-xl">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 font-medium">{getNowDateTimeString()}</span>
              <span className="text-[11px] text-gray-400 ml-auto">自動偵測</span>
            </div>
            {loggedInBranch && loggedInBranch !== '__admin__' && (
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">{loggedInBranch}</span>
              </div>
            )}
            <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} rows="6"
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none resize-none" placeholder="輸入備註內容..." autoFocus></textarea>
          </div>
          <div className="p-6 bg-white border-t border-gray-50 pb-10">
            <button onClick={handleNoteSubmit} disabled={isSubmittingNote || !noteContent.trim()}
              className="w-full bg-[#333333] hover:bg-black disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold tracking-wide transition shadow-lg flex justify-center items-center gap-2">
              {isSubmittingNote ? '處理中...' : <><Check className="w-5 h-5"/> {editingNoteId ? '儲存修改' : '確認新增'}</>}
            </button>
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
