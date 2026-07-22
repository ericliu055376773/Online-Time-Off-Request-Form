import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { 
  ChevronLeft, Map as MapIcon, Home, List, Clock as ClockIcon, 
  User, Plus, MapPin, AlertCircle, X, Check, Calendar, Trash2,
  Settings, Save, Edit2, Image as ImageIcon, LogOut, Camera, Lock, Eye, EyeOff, ChevronDown
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
  
  // ★ 網站全域設定狀態 — branches 改為物件陣列 { name, password }
  const defaultConfig = {
    title: '員工請假紀錄',
    branches: [],        // ★ 預設空陣列，不再有測試資料；格式：[{ name: '門店名', password: '1234' }]
    leaveTypes: ['事假', '病假', '特休', '公假', '喪假', '婚假', '產假', '生理假'],
    leaveReasons: ['身體不適', '家庭因素', '個人事務', '就醫/回診', '紅白事']  // ★ 新增：請假事由選項（後台可編輯）
  };
  const [config, setConfig] = useState(defaultConfig);
  const [configLoaded, setConfigLoaded] = useState(false);  // ★ 新增：追蹤設定是否已載入
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [draftConfig, setDraftConfig] = useState(defaultConfig);
  const [newBranch, setNewBranch] = useState('');
  const [newBranchPassword, setNewBranchPassword] = useState('');  // ★ 新增
  const [newLeaveType, setNewLeaveType] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');  // ★ 新增
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // UI 狀態
  const [isBackendOpen, setIsBackendOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuStep, setMenuStep] = useState(1);
  const [selectedBranchForMenu, setSelectedBranchForMenu] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ★ 門店密碼驗證狀態
  const [branchPassword, setBranchPassword] = useState('');
  const [branchPasswordError, setBranchPasswordError] = useState('');
  const [showBranchPassword, setShowBranchPassword] = useState(false);

  // 管理員登入狀態
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ★ 後台密碼顯示控制
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // 編輯狀態
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // ★ 表單狀態 — reason 改為 reasonType + reasonDetail
  const defaultFormData = {
    name: '',
    branch: '',
    leaveType: '事假',
    startDate: '',
    endDate: '',
    reasonType: '',       // ★ 下拉選單選擇的事由
    reasonDetail: '',     // ★ 選「其他」時手動輸入的原因
    photoBase64: ''
  };
  const [formData, setFormData] = useState(defaultFormData);

  const leaveTypes = config.leaveTypes;
  // ★ branches 現在是物件陣列，取出名稱列表供 UI 使用
  const branchNames = (config.branches || []).map(b => typeof b === 'string' ? b : b.name);
  const leaveReasons = [...(config.leaveReasons || []), '其他'];  // ★ 自動加上「其他」選項

  // 取得分店對應的深灰色調
  const getBranchColor = (branchName) => {
    const index = branchNames.indexOf(branchName);
    const shades = [
      'bg-gray-900',
      'bg-zinc-700',
      'bg-neutral-800',
      'bg-stone-600',
      'bg-slate-800',
    ];
    return shades[index >= 0 ? index % shades.length : 0];
  };

  // ★ 取得門店密碼
  const getBranchPassword = (branchName) => {
    const branch = (config.branches || []).find(b => (typeof b === 'string' ? b : b.name) === branchName);
    if (!branch || typeof branch === 'string') return '';
    return branch.password || '';
  };

  // ------------------------------------------
  // Firebase 身份驗證 (自動切換匿名與管理員)
  // ------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("登入失敗:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ------------------------------------------
  // Firebase 資料讀取
  // ------------------------------------------
  useEffect(() => {
    if (!user) return;
    
    const leaveCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'leave_requests');
    const unsubscribeLeave = onSnapshot(leaveCollectionRef, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      requestsData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setLeaveRequests(requestsData);
    }, (error) => console.error("讀取請假單失敗:", error));

    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
    const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // ★ 相容性處理：若舊資料 branches 是字串陣列，轉換為物件陣列
        if (data.branches && data.branches.length > 0 && typeof data.branches[0] === 'string') {
          data.branches = data.branches.map(name => ({ name, password: '' }));
        }
        setConfig(data);
      }
      setConfigLoaded(true);  // ★ 標記設定已載入
    }, (error) => {
      console.error("讀取設定失敗:", error);
      setConfigLoaded(true);
    });

    return () => {
      unsubscribeLeave();
      unsubscribeConfig();
    };
  }, [user]);

  // ------------------------------------------
  // 處理表單與選單
  // ------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFabClick = () => {
    if (!isMenuOpen) {
      setMenuStep(1);
      setBranchPassword('');
      setBranchPasswordError('');
      setShowBranchPassword(false);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // ★ 選擇門店後進入密碼驗證步驟
  const handleBranchSelect = (branchName) => {
    setSelectedBranchForMenu(branchName);
    const pwd = getBranchPassword(branchName);
    if (pwd) {
      // 有設定密碼 → 進入密碼驗證步驟
      setMenuStep('password');
      setBranchPassword('');
      setBranchPasswordError('');
      setShowBranchPassword(false);
    } else {
      // 沒有設定密碼 → 直接進入假別選擇
      setMenuStep(2);
    }
  };

  // ★ 驗證門店密碼
  const handleBranchPasswordSubmit = () => {
    const correctPwd = getBranchPassword(selectedBranchForMenu);
    if (branchPassword === correctPwd) {
      setBranchPasswordError('');
      setMenuStep(2);
    } else {
      setBranchPasswordError('密碼錯誤，請重新輸入');
    }
  };

  const openFormWithPreselect = (type) => {
    setFormData({ ...defaultFormData, branch: selectedBranchForMenu, leaveType: type });
    setEditingId(null);
    setMessage({ type: '', text: '' });
    setIsMenuOpen(false);
    setIsFormOpen(true);
    setTimeout(() => setMenuStep(1), 300);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormData(defaultFormData);
    setEditingId(null);
    setMessage({ type: '', text: '' });
  };

  // 處理照片上傳 (加入前端自動壓縮功能)
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
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl);
          };
        };
      });

      const sizeInBytes = compressedBase64.length * 0.75;
      if (sizeInBytes > 950 * 1024) { 
        setMessage({ type: 'error', text: '圖片過於複雜，壓縮後仍過大，請換一張照片' });
      } else {
        setFormData(prev => ({ ...prev, photoBase64: compressedBase64 }));
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error("圖片壓縮失敗:", error);
      setMessage({ type: 'error', text: '圖片處理失敗，請重試' });
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photoBase64: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ★ 組合最終的請假事由文字
  const getReasonText = () => {
    if (formData.reasonType === '其他') {
      return formData.reasonDetail.trim();
    }
    return formData.reasonType;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.branch) { setMessage({ type: 'error', text: '請選擇分店！' }); return; }
    if (!formData.name.trim()) { setMessage({ type: 'error', text: '請輸入員工姓名！' }); return; }
    if (!formData.startDate) { setMessage({ type: 'error', text: '請選擇開始時間！' }); return; }
    if (!formData.endDate) { setMessage({ type: 'error', text: '請選擇結束時間！' }); return; }
    // ★ 驗證請假事由
    if (!formData.reasonType) { setMessage({ type: 'error', text: '請選擇請假事由！' }); return; }
    if (formData.reasonType === '其他' && !formData.reasonDetail.trim()) { 
      setMessage({ type: 'error', text: '請輸入請假事由說明！' }); return; 
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setMessage({ type: 'error', text: '結束時間必須晚於開始時間！' }); return;
    }
    if (!user) { setMessage({ type: 'error', text: '尚未連線，請稍後再試。' }); return; }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // ★ 組合存入的資料（保留 reasonType + reasonDetail 以及合併的 reason）
    const saveData = {
      name: formData.name,
      branch: formData.branch,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reasonType: formData.reasonType,
      reasonDetail: formData.reasonDetail,
      reason: getReasonText(),  // 合併後的完整事由文字
      photoBase64: formData.photoBase64
    };

    try {
      if (editingId) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'leave_requests', editingId);
        await updateDoc(docRef, {
          ...saveData,
          updatedAt: serverTimestamp()
        });
      } else {
        const leaveCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'leave_requests');
        await addDoc(leaveCollectionRef, {
          ...saveData,
          status: '待審核',
          createdAt: serverTimestamp()
        });
      }
      
      closeForm();
    } catch (error) {
      console.error("送出失敗:", error);
      setMessage({ type: 'error', text: '儲存失敗，請重試' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (req) => {
    setFormData({
      name: req.name,
      branch: req.branch,
      leaveType: req.leaveType,
      startDate: req.startDate,
      endDate: req.endDate,
      reasonType: req.reasonType || req.reason || '',  // ★ 相容舊資料
      reasonDetail: req.reasonDetail || '',
      photoBase64: req.photoBase64 || ''
    });
    setEditingId(req.id);
    setMessage({ type: '', text: '' });
    setIsMenuOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!user) return;
    // ★ 新增刪除確認
    if (!window.confirm('確定要刪除這筆請假紀錄嗎？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'leave_requests', id));
    } catch (error) {
      console.error("刪除失敗:", error);
    }
  };

  // ------------------------------------------
  // 管理員登入與後台邏輯
  // ------------------------------------------
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setShowLoginModal(false);
      setIsBackendOpen(true);
      setAdminEmail('');
      setAdminPassword('');
    } catch (error) {
      console.error(error);
      setLoginError('信箱或密碼錯誤，請檢查後重試！');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    setIsBackendOpen(false);
  };

  const handleOpenSettings = () => {
    setDraftConfig(JSON.parse(JSON.stringify(config))); // deep clone
    setIsSettingsMode(true);
    setVisiblePasswords({});
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
      await setDoc(configRef, draftConfig);
      setIsSettingsMode(false);
    } catch (error) {
      console.error("儲存設定失敗:", error);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // ★ 新增門店（含密碼）
  const handleAddBranch = () => {
    if (!newBranch.trim()) return;
    if (!newBranchPassword.trim()) return;
    setDraftConfig(prev => ({
      ...prev,
      branches: [...prev.branches, { name: newBranch.trim(), password: newBranchPassword.trim() }]
    }));
    setNewBranch('');
    setNewBranchPassword('');
  };

  // ★ 修改門店密碼
  const handleUpdateBranchPassword = (index, newPwd) => {
    setDraftConfig(prev => {
      const updated = [...prev.branches];
      updated[index] = { ...updated[index], password: newPwd };
      return { ...prev, branches: updated };
    });
  };

  // ★ 修改門店名稱
  const handleUpdateBranchName = (index, newName) => {
    setDraftConfig(prev => {
      const updated = [...prev.branches];
      updated[index] = { ...updated[index], name: newName };
      return { ...prev, branches: updated };
    });
  };

  const handleRemoveArrayItem = (field, index) => {
    setDraftConfig(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  // ★ 新增請假事由選項
  const handleAddLeaveReason = () => {
    if (!newLeaveReason.trim()) return;
    setDraftConfig(prev => ({
      ...prev,
      leaveReasons: [...(prev.leaveReasons || []), newLeaveReason.trim()]
    }));
    setNewLeaveReason('');
  };

  // ★ 移除請假事由選項
  const handleRemoveLeaveReason = (index) => {
    setDraftConfig(prev => {
      const newArray = [...(prev.leaveReasons || [])];
      newArray.splice(index, 1);
      return { ...prev, leaveReasons: newArray };
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diffMs = new Date(end) - new Date(start);
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) return '小於 1 小時';
    return `${Math.round(diffHrs * 10) / 10} 小時`;
  };

  // ★ 切換密碼顯示
  const togglePasswordVisibility = (index) => {
    setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-[400px] bg-[#f8f9fa] relative shadow-2xl flex flex-col h-[100dvh] overflow-hidden text-gray-800">
        
        {/* 頂部導航列 */}
        <header className="flex justify-center items-center px-6 pt-12 pb-4 bg-[#f8f9fa] z-10">
          <h1 
            className="text-2xl font-bold tracking-wide text-gray-900 cursor-pointer hover:opacity-60 transition-opacity select-none"
            onClick={() => { 
              if (isBackendOpen) {
                setIsBackendOpen(false); 
                setIsSettingsMode(false);
              } else {
                if (user && user.email) {
                  setIsBackendOpen(true);
                } else {
                  setShowLoginModal(true);
                }
              }
            }}
          >
            {config.title}
          </h1>
        </header>

        {/* 內容區域 */}
        {isBackendOpen ? (
          // ==============================
          // 後台介面
          // ==============================
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-white rounded-t-3xl shadow-inner mt-2">
            {isSettingsMode ? (
              <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setIsSettingsMode(false)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-800">系統設定</h2>
                  <div className="w-6"></div>
                </div>

                {/* 系統標題 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">系統標題文字</label>
                  <input 
                    type="text" value={draftConfig.title} 
                    onChange={(e) => setDraftConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none transition" 
                  />
                </div>

                {/* ★ 分店名單管理（含密碼） */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">分店名單管理</label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {(draftConfig.branches || []).map((b, i) => {
                      const branchObj = typeof b === 'string' ? { name: b, password: '' } : b;
                      const isVisible = visiblePasswords[i];
                      return (
                        <div key={i} className="bg-white px-3 py-3 rounded-lg border border-gray-100 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <input 
                              type="text" value={branchObj.name}
                              onChange={(e) => handleUpdateBranchName(i, e.target.value)}
                              className="text-sm font-medium text-gray-700 bg-transparent outline-none flex-1 mr-2"
                            />
                            <button onClick={() => handleRemoveArrayItem('branches', i)} className="text-gray-300 hover:text-red-500 transition shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <input 
                              type={isVisible ? 'text' : 'password'}
                              value={branchObj.password}
                              onChange={(e) => handleUpdateBranchPassword(i, e.target.value)}
                              className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 outline-none"
                              placeholder="設定門店密碼"
                            />
                            <button onClick={() => togglePasswordVisibility(i)} className="text-gray-400 hover:text-gray-600 transition shrink-0">
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {/* 新增門店 */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
                      <input 
                        type="text" value={newBranch} onChange={e => setNewBranch(e.target.value)} placeholder="新門店名稱..."
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none"
                      />
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input 
                            type="text" value={newBranchPassword} onChange={e => setNewBranchPassword(e.target.value)} placeholder="設定密碼..."
                            className="flex-1 text-sm outline-none bg-transparent"
                          />
                        </div>
                        <button onClick={handleAddBranch} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition text-sm shrink-0">新增</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 假別清單管理 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">假別清單管理</label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {(draftConfig.leaveTypes || []).map((t, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{t}</span>
                        <button onClick={() => handleRemoveArrayItem('leaveTypes', i)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <input 
                        type="text" value={newLeaveType} onChange={e => setNewLeaveType(e.target.value)} placeholder="輸入新假別..."
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none"
                      />
                      <button onClick={() => {
                        if (!newLeaveType.trim()) return;
                        setDraftConfig(prev => ({ ...prev, leaveTypes: [...prev.leaveTypes, newLeaveType.trim()] }));
                        setNewLeaveType('');
                      }} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition">新增</button>
                    </div>
                  </div>
                </div>

                {/* ★ 請假事由選項管理 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">請假事由選項管理</label>
                  <p className="text-[11px] text-gray-400 ml-1">系統會自動在最後加上「其他」選項，員工選擇「其他」時須手動輸入原因</p>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {(draftConfig.leaveReasons || []).map((r, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{r}</span>
                        <button onClick={() => handleRemoveLeaveReason(i)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {/* 「其他」預覽 */}
                    <div className="flex justify-between items-center bg-gray-100 px-3 py-2.5 rounded-lg border border-dashed border-gray-200">
                      <span className="text-sm font-medium text-gray-400">其他（系統自動加入）</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <input 
                        type="text" value={newLeaveReason} onChange={e => setNewLeaveReason(e.target.value)} placeholder="輸入新事由選項..."
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none"
                      />
                      <button onClick={handleAddLeaveReason} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition">新增</button>
                    </div>
                  </div>
                </div>

                {/* 儲存按鈕 */}
                <div className="pt-4 pb-10">
                  <button 
                    onClick={handleSaveConfig} disabled={isSavingConfig}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold tracking-wide transition shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2"
                  >
                    {isSavingConfig ? '儲存中...' : <><Save className="w-5 h-5"/> 儲存設定</>}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex justify-between items-center">
                  管理員後台
                  <div className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">已登入</div>
                </h2>
                <div className="space-y-4">
                  <button onClick={handleOpenSettings} className="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-gray-100 hover:shadow-sm transition-all active:scale-[0.98]">
                    <div className="bg-white p-3 rounded-full shadow-sm">
                      <Settings className="w-6 h-6 text-gray-700" />
                    </div>
                    <span className="text-[15px] font-bold text-gray-800 tracking-wide">系統設定</span>
                  </button>

                  <button onClick={handleAdminLogout} className="w-full bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center gap-4 hover:bg-red-100 hover:shadow-sm transition-all active:scale-[0.98]">
                    <div className="bg-white p-3 rounded-full shadow-sm text-red-500">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <span className="text-[15px] font-bold text-red-600 tracking-wide">登出管理員帳號</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // ==============================
          // 前台介面
          // ==============================
          <div className="flex-1 overflow-y-auto px-6 pb-32 pt-4">
            <div className="mb-4">
              {!configLoaded ? (
                <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>
              ) : branchNames.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>尚未設定任何門店</p>
                  <p className="text-xs mt-2">請管理員先至後台新增門店</p>
                </div>
              ) : leaveRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">目前沒有任何請假紀錄</div>
              ) : (
                <div className="relative pt-2">
                  {leaveRequests.map((req) => (
                    <div key={req.id} className="flex relative mb-6 group bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-50">
                      
                      {/* 左側直式分店標籤 */}
                      <div className={`w-10 shrink-0 flex items-center justify-center ${getBranchColor(req.branch)}`}>
                        <span 
                          className="text-white text-[13px] font-bold tracking-[0.2em] py-3 select-none" 
                          style={{ writingMode: 'vertical-rl' }}
                        >
                          {req.branch}
                        </span>
                      </div>

                      {/* 右側卡片 */}
                      <div className="flex-1 p-4 relative bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-900 text-[15px] leading-tight">
                            {req.name}
                          </h4>
                          <div className="flex items-center gap-2.5">
                            <button onClick={() => handleEdit(req)} className="text-gray-300 hover:text-blue-500 transition">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(req.id)} className="text-gray-300 hover:text-red-500 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5 mr-2 shrink-0" />
                            <span className="truncate">{new Date(req.startDate).toLocaleDateString('zh-TW')} - {new Date(req.endDate).toLocaleDateString('zh-TW')}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <ClockIcon className="w-3.5 h-3.5 mr-2 shrink-0" />
                            <span>時長：{calculateDuration(req.startDate, req.endDate)} ({req.leaveType})</span>
                          </div>
                        </div>

                        {req.photoBase64 && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 max-h-32 bg-gray-50 flex justify-center">
                            <img src={req.photoBase64} alt="Attached" className="object-cover h-full w-full" />
                          </div>
                        )}

                        <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-50">
                          <p className="text-[13px] text-gray-600 leading-relaxed break-words">
                            {/* ★ 顯示事由：如果有 reasonType 就顯示標籤 */}
                            {req.reasonType && req.reasonType !== '其他' && (
                              <span className="inline-block bg-gray-200 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full mr-1.5 align-middle">{req.reasonType}</span>
                            )}
                            {req.reasonType === '其他' ? req.reasonDetail || req.reason : (req.reason || req.reasonType || '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 管理員登入 Modal */}
        {showLoginModal && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowLoginModal(false)}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">管理員登入</h3>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">電子郵件</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition" placeholder="admin@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">密碼</label>
                  <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition" placeholder="請輸入密碼" required />
                </div>
                {loginError && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">{loginError}</p>}
                <button type="submit" disabled={isLoggingIn} className="w-full bg-[#333333] hover:bg-black text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 flex justify-center items-center gap-2">
                  {isLoggingIn ? '登入中...' : '確認登入'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 遮罩背景 */}
        {isMenuOpen && (
          <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] z-20" onClick={() => setIsMenuOpen(false)}></div>
        )}

        {/* ★ 彈出選單（新增密碼驗證步驟） */}
        <div className={`absolute bottom-[185px] right-6 flex flex-col items-end gap-2 transition-all duration-300 origin-bottom-right z-30 ${isMenuOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          {menuStep === 1 ? (
            <>
              <div className="text-xs font-bold text-gray-500 mb-1 mr-1 bg-white/80 px-2.5 py-1 rounded-md shadow-sm">請先選擇分店</div>
              {branchNames.map(name => (
                <button key={name} onClick={() => handleBranchSelect(name)} className="bg-white text-gray-800 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl hover:bg-gray-50 transition border border-gray-100">
                  {name}
                </button>
              ))}
            </>
          ) : menuStep === 'password' ? (
            <>
              <div className="text-xs font-bold text-gray-500 mb-1 mr-1 bg-white/80 px-2.5 py-1 rounded-md shadow-sm">
                {selectedBranchForMenu} — 請輸入密碼
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[220px] space-y-3">
                <div className="relative">
                  <input 
                    type={showBranchPassword ? 'text' : 'password'}
                    value={branchPassword}
                    onChange={e => { setBranchPassword(e.target.value); setBranchPasswordError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleBranchPasswordSubmit()}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none pr-10"
                    placeholder="輸入門店密碼"
                    autoFocus
                  />
                  <button 
                    onClick={() => setShowBranchPassword(!showBranchPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showBranchPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {branchPasswordError && (
                  <p className="text-[11px] text-red-500 font-medium">{branchPasswordError}</p>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setMenuStep(1); setBranchPassword(''); setBranchPasswordError(''); }}
                    className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-200 transition"
                  >
                    返回
                  </button>
                  <button 
                    onClick={handleBranchPasswordSubmit}
                    className="flex-1 bg-[#333333] text-white text-sm font-medium py-2 rounded-xl hover:bg-black transition"
                  >
                    確認
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-gray-500 mb-1 mr-1 bg-white/80 px-2.5 py-1 rounded-md shadow-sm">目前分店：{selectedBranchForMenu}</div>
              <button onClick={() => openFormWithPreselect('事假')} className="bg-[#333333] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl hover:bg-black transition">新增事假</button>
              <button onClick={() => openFormWithPreselect('病假')} className="bg-[#333333] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl hover:bg-black transition">新增病假</button>
              <button onClick={() => openFormWithPreselect('其他假別')} className="bg-[#333333] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl hover:bg-black transition">自定義假別</button>
            </>
          )}
        </div>

        {/* 浮動操作按鈕 */}
        {!isBackendOpen && branchNames.length > 0 && (
          <button 
            onClick={handleFabClick}
            className={`absolute bottom-[120px] right-6 w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 z-30 ${isMenuOpen ? 'bg-white text-black rotate-45' : 'bg-[#333333] text-white'}`}
          >
            <Plus className="w-7 h-7" />
          </button>
        )}

        {/* 底部導航列 */}
        <nav className="absolute bottom-0 w-full bg-white px-8 py-5 flex justify-center items-center rounded-t-[36px] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-10 pb-8">
          <div onClick={() => setIsBackendOpen(false)} className={`w-full px-6 py-3 rounded-full flex items-center justify-center gap-3 shadow-md cursor-pointer transition ${!isBackendOpen ? 'bg-[#333333] text-white hover:bg-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <List className="w-5 h-5" />
            <span className="text-base font-medium tracking-wider">假單總覽</span>
          </div>
        </nav>

        {/* =========================================
            填寫表單 Modal (由底部滑出)
            ========================================= */}
        <div className={`absolute inset-x-0 bottom-0 bg-white z-50 rounded-t-[36px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] transition-transform duration-400 ease-out h-[90%] flex flex-col ${isFormOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">{editingId ? '編輯請假單' : '填寫請假單'}</h2>
            <button onClick={closeForm} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="leaveForm" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">分店名稱</label>
                <select name="branch" value={formData.branch} onChange={handleInputChange} 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none">
                  <option value="" disabled>請選擇分店</option>
                  {branchNames.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">員工姓名</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none" placeholder="輸入您的姓名" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">請假類別</label>
                <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none">
                  {leaveTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">開始時間</label>
                  <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} 
                    className="w-full bg-gray-50 border-none rounded-xl px-3 py-3.5 text-xs font-medium text-gray-800 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">結束時間</label>
                  <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} 
                    className="w-full bg-gray-50 border-none rounded-xl px-3 py-3.5 text-xs font-medium text-gray-800 outline-none" />
                </div>
              </div>

              {/* ★ 請假事由 — 改為下拉選單 + 其他手動輸入 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">請假事由</label>
                <div className="relative">
                  <select 
                    name="reasonType" 
                    value={formData.reasonType} 
                    onChange={handleInputChange} 
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none appearance-none"
                  >
                    <option value="" disabled>請選擇請假事由</option>
                    {leaveReasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {formData.reasonType === '其他' && (
                  <textarea 
                    name="reasonDetail" 
                    rows="2" 
                    value={formData.reasonDetail} 
                    onChange={handleInputChange} 
                    className="w-full bg-gray-50 border-2 border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none resize-none mt-2" 
                    placeholder="請輸入具體請假原因..."
                  ></textarea>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">附加照片 (非必填)</label>
                {formData.photoBase64 ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                    <img src={formData.photoBase64} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" onClick={removePhoto}
                      className="absolute top-2 right-2 bg-gray-900/60 text-white p-1.5 rounded-full hover:bg-gray-900 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">點擊拍照或上傳 (系統會自動壓縮)</p>
                    </div>
                    <input 
                      ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </label>
                )}
              </div>

              {message.text && (
                <div className={`text-xs font-medium p-3 rounded-lg ${
                  message.type === 'error' ? 'text-red-600 bg-red-50' : 
                  message.type === 'info' ? 'text-blue-600 bg-blue-50' : 
                  'text-green-600 bg-green-50'
                }`}>
                  {message.text}
                </div>
              )}
            </form>
          </div>

          <div className="p-6 bg-white border-t border-gray-50 pb-10">
            <button 
              form="leaveForm" type="submit" disabled={isSubmitting}
              className="w-full bg-[#333333] hover:bg-black text-white py-4 rounded-2xl font-bold tracking-wide transition shadow-lg flex justify-center items-center gap-2"
            >
              {isSubmitting ? '處理中...' : (
                <><Check className="w-5 h-5"/> {editingId ? '儲存修改' : '確認送出'}</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
