import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { 
  ChevronLeft, Map as MapIcon, Home, List, Clock as ClockIcon, 
  User, Plus, MapPin, AlertCircle, X, Check, Calendar, Trash2,
  Settings, Save, Edit2, Image as ImageIcon, LogOut, Camera
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
  
  // 網站全域設定狀態
  const defaultConfig = {
    title: '員工請假紀錄',
    branches: ['台北信義店', '台中勤美店', '高雄巨蛋店'],
    leaveTypes: ['事假', '病假', '特休', '公假', '喪假', '婚假', '產假', '生理假']
  };
  const [config, setConfig] = useState(defaultConfig);
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [draftConfig, setDraftConfig] = useState(defaultConfig);
  const [newBranch, setNewBranch] = useState('');
  const [newLeaveType, setNewLeaveType] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // UI 狀態
  const [isBackendOpen, setIsBackendOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuStep, setMenuStep] = useState(1);
  const [selectedBranchForMenu, setSelectedBranchForMenu] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // 管理員登入狀態
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 編輯狀態
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // 表單狀態
  const defaultFormData = {
    name: '',
    branch: '',
    leaveType: '事假',
    startDate: '',
    endDate: '',
    reason: '',
    photoBase64: ''
  };
  const [formData, setFormData] = useState(defaultFormData);

  const leaveTypes = config.leaveTypes;
  const branches = config.branches;

  // 取得分店對應的深灰色調
  const getBranchColor = (branch) => {
    const index = branches.indexOf(branch);
    const shades = [
      'bg-gray-900', // 深黑
      'bg-zinc-700', // 淺黑灰
      'bg-neutral-800', // 暖黑
      'bg-stone-600', // 灰
      'bg-slate-800', // 藍黑
    ];
    return shades[index >= 0 ? index % shades.length : 0];
  };

  // ------------------------------------------
  // Firebase 身份驗證 (自動切換匿名與管理員)
  // ------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // 當沒有使用者 (例如剛登出) 時，自動重新匿名登入以確保員工能繼續使用
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
      if (docSnap.exists()) setConfig(docSnap.data());
    }, (error) => console.error("讀取設定失敗:", error));

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
    if (!isMenuOpen) setMenuStep(1);
    setIsMenuOpen(!isMenuOpen);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranchForMenu(branch);
    setMenuStep(2);
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
            // 將最大寬度或高度限制在 800 像素
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

            // 轉成 JPEG 並將畫質壓縮至 60%
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl);
          };
        };
      });

      // 檢查壓縮後的 Base64 大小 (Firestore 文件上限為 1MB)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.branch) { setMessage({ type: 'error', text: '請選擇分店！' }); return; }
    if (!formData.name.trim()) { setMessage({ type: 'error', text: '請輸入員工姓名！' }); return; }
    if (!formData.startDate) { setMessage({ type: 'error', text: '請選擇開始時間！' }); return; }
    if (!formData.endDate) { setMessage({ type: 'error', text: '請選擇結束時間！' }); return; }
    if (!formData.reason.trim()) { setMessage({ type: 'error', text: '請填寫請假事由！' }); return; }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setMessage({ type: 'error', text: '結束時間必須晚於開始時間！' }); return;
    }
    if (!user) { setMessage({ type: 'error', text: '尚未連線，請稍後再試。' }); return; }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (editingId) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'leave_requests', editingId);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        const leaveCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'leave_requests');
        await addDoc(leaveCollectionRef, {
          ...formData,
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
      reason: req.reason,
      photoBase64: req.photoBase64 || ''
    });
    setEditingId(req.id);
    setMessage({ type: '', text: '' });
    setIsMenuOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!user) return;
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
    setDraftConfig(config);
    setIsSettingsMode(true);
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

  const handleAddArrayItem = (field, value, setter) => {
    if (!value.trim()) return;
    setDraftConfig(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    setter('');
  };

  const handleRemoveArrayItem = (field, index) => {
    setDraftConfig(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diffMs = new Date(end) - new Date(start);
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) return '小於 1 小時';
    return `${Math.round(diffHrs * 10) / 10} 小時`;
  };

  return (
    // ★ 這裡將原本的 min-h-screen 改為了 min-h-[100dvh]，動態適應手機瀏覽器高度
    <div className="min-h-[100dvh] bg-gray-100 flex justify-center font-sans">
      {/* ★ 這裡將 h-screen 改為了 h-[100dvh] */}
      <div className="w-full max-w-[400px] bg-[#f8f9fa] relative shadow-2xl flex flex-col h-[100dvh] overflow-hidden text-gray-800">
        
        {/* 頂部導航列 (控制進入後台邏輯) */}
        <header className="flex justify-center items-center px-6 pt-12 pb-4 bg-[#f8f9fa] z-10">
          <h1 
            // ★ 在這裡強制加入 text-gray-900 (深黑色)，防止 iOS 將點擊按鈕變成白色
            className="text-2xl font-bold tracking-wide text-gray-900 cursor-pointer hover:opacity-60 transition-opacity select-none"
            onClick={() => { 
              if (isBackendOpen) {
                setIsBackendOpen(false); 
                setIsSettingsMode(false);
              } else {
                // 如果目前是登入狀態，且擁有 email (代表是我們新增的管理員，不是匿名者)
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

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">系統標題文字</label>
                  <input 
                    type="text" value={draftConfig.title} 
                    onChange={(e) => setDraftConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none transition" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">分店名單管理</label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {draftConfig.branches.map((b, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-3 py-2.5 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{b}</span>
                        <button onClick={() => handleRemoveArrayItem('branches', i)} className="text-gray-300 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <input 
                        type="text" value={newBranch} onChange={e => setNewBranch(e.target.value)} placeholder="輸入新分店..."
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none transition"
                      />
                      <button onClick={() => handleAddArrayItem('branches', newBranch, setNewBranch)} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition">新增</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">假別清單管理</label>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                    {draftConfig.leaveTypes.map((t, i) => (
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
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none transition"
                      />
                      <button onClick={() => handleAddArrayItem('leaveTypes', newLeaveType, setNewLeaveType)} className="bg-[#333333] text-white px-4 rounded-lg hover:bg-black transition">新增</button>
                    </div>
                  </div>
                </div>

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
              {leaveRequests.length === 0 ? (
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
                          <p className="text-[13px] text-gray-600 leading-relaxed break-words">{req.reason}</p>
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

        {/* 彈出選單 */}
        <div className={`absolute bottom-[185px] right-6 flex flex-col items-end gap-2 transition-all duration-300 origin-bottom-right z-30 ${isMenuOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          {menuStep === 1 ? (
            <>
              <div className="text-xs font-bold text-gray-500 mb-1 mr-1 bg-white/80 px-2.5 py-1 rounded-md shadow-sm">請先選擇分店</div>
              {branches.map(branch => (
                <button key={branch} onClick={() => handleBranchSelect(branch)} className="bg-white text-gray-800 text-sm font-medium px-5 py-3 rounded-2xl shadow-xl hover:bg-gray-50 transition border border-gray-100">
                  {branch}
                </button>
              ))}
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
        {!isBackendOpen && (
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
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">請假事由</label>
                <textarea name="reason" rows="3" value={formData.reason} onChange={handleInputChange} 
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 outline-none resize-none" placeholder="簡單說明請假原因..."></textarea>
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
