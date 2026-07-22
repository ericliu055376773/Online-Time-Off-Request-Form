import { useState, useRef, useEffect } from 'react';
// ==========================================
// 1. 載入 Firebase 模組
// ==========================================
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
// 【新增】載入 Firebase 驗證模組
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// ==========================================
// 2. 填入您的 Firebase 設定 
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCqtwLlAt4FrOeapIp9TsQXRghpWwfZew8", 
  authDomain: "job-interview-83e53.firebaseapp.com",
  projectId: "job-interview-83e53",
  storageBucket: "job-interview-83e53.firebasestorage.app",
  messagingSenderId: "580948074890",
  appId: "1:580948074890:web:0d3a8c1be976569b9be873"
};

// 初始化 Firebase、Firestore 與 Auth
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
const auth = getAuth(app); 

// ==========================================
// 免安裝升級版：內建原生 SVG 圖示
// ==========================================
const SvgIcon = ({ path, className, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {path}
  </svg>
);

const User = (p: any) => <SvgIcon path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} {...p} />;
const Phone = (p: any) => <SvgIcon path={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>} {...p} />;
const Briefcase = (p: any) => <SvgIcon path={<><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>} {...p} />;
const CheckCircle = (p: any) => <SvgIcon path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></>} {...p} />;
const AlertCircle = (p: any) => <SvgIcon path={<><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>} {...p} />;
const Loader2 = (p: any) => <SvgIcon path={<path d="M21 12a9 9 0 1 1-6.219-8.56"/>} {...p} />;
const Utensils = (p: any) => <SvgIcon path={<><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></>} {...p} />;
const ArrowRight = (p: any) => <SvgIcon path={<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>} {...p} />;
const ChevronRight = (p: any) => <SvgIcon path={<path d="m9 18 6-6-6-6"/>} {...p} />;
const SettingsIcon = (p: any) => <SvgIcon path={<><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/></>} {...p} />;
const Plus = (p: any) => <SvgIcon path={<><path d="M5 12h14"/><path d="M12 5v14"/></>} {...p} />;
const Trash2 = (p: any) => <SvgIcon path={<><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>} {...p} />;
const ShieldCheck = (p: any) => <SvgIcon path={<><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.5 0 4.5 1 6.5 2a1 1 0 0 1 1 1v7z"/><path d="m9 12 2 2 4-4"/></>} {...p} />;
const Lock = (p: any) => <SvgIcon path={<><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} {...p} />;
const LogOut = (p: any) => <SvgIcon path={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>} {...p} />;
const SaveIcon = (p: any) => <SvgIcon path={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>} {...p} />;
const ImageIcon = (p: any) => <SvgIcon path={<><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} {...p} />;
const MapPin = (p: any) => <SvgIcon path={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>} {...p} />;
const Calendar = (p: any) => <SvgIcon path={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>} {...p} />;
const Users = (p: any) => <SvgIcon path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} {...p} />;

const ClipboardCheck = (p: any) => <SvgIcon path={<><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></> } {...p} />;

const GRADE_OPTIONS = [
  { value: 'A', label: 'A 級', desc: '強烈推薦錄用', color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  { value: 'B', label: 'B 級', desc: '建議錄用',     color: 'bg-blue-500',    light: 'bg-blue-50 border-blue-300 text-blue-700' },
  { value: 'C', label: 'C 級', desc: '保留考慮',     color: 'bg-amber-500',   light: 'bg-amber-50 border-amber-300 text-amber-700' },
  { value: 'D', label: 'D 級', desc: '不建議錄用',   color: 'bg-red-500',     light: 'bg-red-50 border-red-300 text-red-700' },
];

// ==========================================
// 原生 Canvas 圖片裁切器
// ==========================================
const ImageCropper = ({ imageUrl, onCrop, onCancel }: any) => {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<any>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<any>({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState<number>(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const size = 240; 

  const handleImageLoad = (e: any) => {
    const { naturalWidth, naturalHeight } = e.target;
    const scale = Math.max(size / naturalWidth, size / naturalHeight);
    setBaseScale(scale);
  };

  const handleMouseDown = (e: any) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: any) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: any) => {
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
  };
  const handleTouchMove = (e: any) => {
    if (!isDragging) return;
    e.preventDefault(); 
    setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    if (!ctx || !img) return;

    const scale = baseScale * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (size - dw) / 2 + position.x;
    const dy = (size - dh) / 2 + position.y;

    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, dx, dy, dw, dh);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-zinc-900 mb-6 tracking-tight">調整 LOGO 大小與位置</h3>
        
        <div 
          className="relative rounded-full overflow-hidden bg-zinc-100 cursor-move border-4 border-zinc-100 shadow-inner"
          style={{ width: size, height: size, touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <img 
            ref={imgRef}
            src={imageUrl}
            onLoad={handleImageLoad}
            alt="Crop preview"
            draggable={false}
            className="absolute max-w-none pointer-events-none origin-center"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${baseScale * zoom})`
            }}
          />
        </div>

        <div className="w-full mt-8 flex items-center space-x-4">
          <span className="text-zinc-400 font-bold text-sm">縮小</span>
          <input 
            type="range" min="1" max="3" step="0.05" 
            value={zoom} onChange={(e: any) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-zinc-900 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-zinc-400 font-bold text-sm">放大</span>
        </div>
        <p className="text-[13px] text-zinc-400 mt-3 mb-8 font-medium">提示：請在圓框內拖曳圖片調整位置</p>

        <div className="flex space-x-3 w-full">
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-full bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 active:scale-95 transition-all">
            取消
          </button>
          <button type="button" onClick={handleCrop} className="flex-1 py-3.5 rounded-full bg-zinc-900 text-white font-bold hover:bg-zinc-800 active:scale-95 transition-all shadow-md">
            確認裁切
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 滑動解鎖按鈕 (Swipe to Submit)
// ==========================================
const SwipeToSubmit = ({ disabled, isLoading, onSubmitTrigger }: any) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: any) => {
    if (disabled || isLoading) return;
    setIsDragging(true);
    setStartX(e.type.includes('mouse') ? e.clientX : e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current || !thumbRef.current) return;
      const currentX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      
      // 計算最大可滑動距離：容器寬度 - 按鈕寬度 - 左右內邊距(px-2 = 16px)
      const maxOffset = containerRef.current.clientWidth - thumbRef.current.clientWidth - 16;
      let newOffset = currentX - startX;
      
      if (newOffset < 0) newOffset = 0;
      if (newOffset > maxOffset) newOffset = maxOffset;
      setDragOffset(newOffset);

      // 當滑動距離超過總長的 95% 視為完成
      if (newOffset >= maxOffset * 0.95) {
        setIsDragging(false);
        setDragOffset(maxOffset);
        onSubmitTrigger(); // 觸發表單送出
        // 稍作延遲後彈回，以防表單驗證未過（例如有漏填必填）時能恢復原狀
        setTimeout(() => setDragOffset(0), 400);
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      setDragOffset(0); // 未拉到底放開時彈回原位
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, startX, disabled, isLoading, onSubmitTrigger]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-16 rounded-full flex items-center px-2 overflow-hidden select-none ${
        disabled || isLoading ? 'bg-zinc-200 opacity-70' : 'bg-[#E5E5EA]'
      }`}
    >
      {/* 進度背景條 */}
      <div
        className={`absolute left-0 top-0 bottom-0 rounded-full z-0 ${disabled || isLoading ? 'bg-zinc-300' : 'bg-[#D1D1D6]'}`}
        style={{
          width: dragOffset + 56, // 48(圓寬) + 8(左padding)
          transition: isDragging ? 'none' : 'width 0.3s ease-out'
        }}
      />

      {/* 滑動圓形按鈕 */}
      <div
        ref={thumbRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        className={`w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center z-20 absolute touch-none ${
          disabled || isLoading ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-105'
        }`}
      >
        {isLoading ? (
          <Loader2 className="animate-spin h-6 w-6 text-zinc-900" />
        ) : (
          <CheckCircle className="h-6 w-6 text-zinc-900" />
        )}
      </div>

      {/* 中間文字 */}
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-zinc-900 tracking-wide z-10 pointer-events-none opacity-90">
        {isLoading ? '傳送中...' : 'Continue'}
      </span>

      {/* 右側箭頭裝飾 */}
      <div className="absolute right-6 flex items-center space-x-[-8px] text-zinc-400 z-10 pointer-events-none">
        <ChevronRight className="w-5 h-5 opacity-40" />
        <ChevronRight className="w-5 h-5 opacity-70" />
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};




// ==========================================
// 紅色面試官審核滑軌
// ==========================================
const SwipeToReview = ({ onTrigger }: { onTrigger: () => void }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: any) => {
    setIsDragging(true);
    setStartX(e.type.includes('mouse') ? e.clientX : e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current || !thumbRef.current) return;
      const currentX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const maxOffset = containerRef.current.clientWidth - thumbRef.current.clientWidth - 16;
      let newOffset = currentX - startX;
      if (newOffset < 0) newOffset = 0;
      if (newOffset > maxOffset) newOffset = maxOffset;
      setDragOffset(newOffset);
      if (newOffset >= maxOffset * 0.95) {
        setIsDragging(false);
        setDragOffset(maxOffset);
        onTrigger();
        setTimeout(() => setDragOffset(0), 300);
      }
    };
    const handleEnd = () => { if (!isDragging) return; setIsDragging(false); setDragOffset(0); };
    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, startX, onTrigger]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-16 rounded-full flex items-center px-2 overflow-hidden select-none bg-red-100 cursor-grab active:cursor-grabbing"
    >
      {/* 進度背景條 */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-full z-0 bg-red-200"
        style={{ width: dragOffset + 56, transition: isDragging ? 'none' : 'width 0.3s ease-out' }}
      />
      {/* 圓形按鈕 */}
      <div
        ref={thumbRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{ transform: `translateX(${dragOffset}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }}
        className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center z-20 absolute touch-none hover:scale-105 transition-transform"
      >
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      {/* 中間文字 */}
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-red-700 tracking-wide z-10 pointer-events-none">
        面試官審核
      </span>
      {/* 右側箭頭 */}
      <div className="absolute right-6 flex items-center space-x-[-8px] text-red-400 z-10 pointer-events-none">
        <ChevronRight className="w-5 h-5 opacity-40" />
        <ChevronRight className="w-5 h-5 opacity-70" />
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};

const RatingPanel = ({ branches, onComplete }: { branches: string[]; onComplete: (d: any) => void }) => {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [grade, setGrade] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!name.trim()) { setErr('請填寫面試官姓名'); return; }
    if (!branch) { setErr('請選擇分店'); return; }
    if (!grade) { setErr('請選擇評分等級'); return; }
    setErr(''); setSaving(true);
    await onComplete({ interviewerName: name.trim(), branch, grade, note });
    setSaving(false);
  };
  return (
    <div className="space-y-5">
      <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">面試官資訊</h3>
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-zinc-400" /></div>
            <input type="text" value={name} onChange={(e:any) => setName(e.target.value)} placeholder="面試官姓名"
              className="block w-full pl-11 py-3.5 text-sm bg-white rounded-2xl border-transparent focus:ring-2 focus:ring-zinc-900 text-zinc-900 font-semibold" />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-zinc-400" /></div>
            <select value={branch} onChange={(e:any) => setBranch(e.target.value)}
              className="block w-full pl-11 py-3.5 text-sm bg-white rounded-2xl border-transparent focus:ring-2 focus:ring-zinc-900 appearance-none text-zinc-900 font-semibold">
              <option value="" disabled>請選擇面試分店...</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">綜合評分</h3>
        <div className="grid grid-cols-2 gap-3">
          {GRADE_OPTIONS.map(g => (
            <button key={g.value} type="button" onClick={() => setGrade(g.value)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${grade === g.value ? `${g.light} border-current` : 'bg-white border-zinc-200'}`}>
              <div className="flex items-center mb-1">
                <span className={`w-8 h-8 rounded-full ${g.color} text-white font-extrabold text-sm flex items-center justify-center mr-2`}>{g.value}</span>
                <span className="font-bold text-sm">{g.label}</span>
              </div>
              <p className="text-xs text-zinc-400">{g.desc}</p>
              {grade === g.value && <CheckCircle className="absolute top-3 right-3 w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">評語備註（選填）</h3>
        <textarea value={note} onChange={(e:any) => setNote(e.target.value)} rows={4} placeholder="填寫整體評語..."
          className="block w-full py-3.5 px-4 text-sm bg-white rounded-2xl border-transparent focus:ring-2 focus:ring-zinc-900 resize-none text-zinc-900 font-semibold" />
      </div>
      {err && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-4"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /><p className="text-sm font-bold text-red-600">{err}</p></div>}
      <button type="button" onClick={submit} disabled={saving}
        className="w-full py-5 rounded-full bg-zinc-900 text-white font-extrabold text-lg hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {saving ? <><Loader2 className="animate-spin w-5 h-5" />儲存中...</> : <><CheckCircle className="w-5 h-5" />確認送出評分</>}
      </button>
    </div>
  );
};

export default function App() {
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  const [currentView, setCurrentView] = useState<string>('candidate');
  
  // 記錄 Firebase 登入狀態
  const [user, setUser] = useState<any>(null);

  // 後台主分類狀態
  const [adminMainTab, setAdminMainTab] = useState<string>('settings'); 
  const [adminEmployeeTab, setAdminEmployeeTab] = useState<string>('all'); 
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null);
  const [editGrade, setEditGrade] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editInterviewerName, setEditInterviewerName] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [submittedDocId, setSubmittedDocId] = useState<string>('');
  const submittedDocIdRef = useRef<string>('');  // 同步儲存，避免 closure 讀到舊值
  const [ratingStatus, setRatingStatus] = useState<string>('idle');
  const [reviewStatus, setReviewStatus] = useState<string>('idle'); // idle | reviewing | done
  
  // 登入 Modal 狀態
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>(''); 
  const [passwordInput, setPasswordInput] = useState<string>('');
  
  // 將登入錯誤訊息改為字串，顯示精準錯誤原因
  const [loginError, setLoginError] = useState<string | false>(false);
  const [tempLogoUrl, setTempLogoUrl] = useState<any>(null);

  const defaultHeader = {
    title: "Thrilled to Join\nOur Team!",
    description: "歡迎來到美味餐飲集團！請填寫以下面試資料，為您的招募旅程踏出第一步。",
    logoUrl: "",
    consentText: "我瞭解並同意貴公司為「人才招募」目的，蒐集、處理我的個人資料，未經同意不外流。",
    reviewNoticeTitle: "面試者已完成填寫",
    reviewNoticeText: "請面試官確認資料後，向右滑動下方紅色滑軌開始進行評分。"
  };
  const [headerContent, setHeaderContent] = useState<any>(defaultHeader);
  const [draftHeaderContent, setDraftHeaderContent] = useState<any>(defaultHeader);

  const [customBranches, setCustomBranches] = useState<string[]>(['虎尾店', '斗六店']);
  const [customPositions, setCustomPositions] = useState<string[]>(['外場服務人員 (正職/兼職)', '內場廚房人員 (正職/兼職)', '店長 / 儲備幹部']);
  const [draftPositions, setDraftPositions] = useState<string[]>(['外場服務人員 (正職/兼職)', '內場廚房人員 (正職/兼職)', '店長 / 儲備幹部']);
  const [newPositionInput, setNewPositionInput] = useState<string>('');
  const [draftBranches, setDraftBranches] = useState<string[]>([]);
  const [newBranchInput, setNewBranchInput] = useState<string>('');

  const [customQuestions, setCustomQuestions] = useState<any[]>([
    { id: 'q1', text: '您過去有餐飲業相關經驗嗎？請簡述您的經歷。', type: 'textarea', required: true },
    { id: 'q2', text: '請簡短自我介紹，並分享您為什麼想加入美味餐飲集團？', type: 'textarea', required: true },
    { id: 'q3', text: '一週內可配合排班的時段為何？(例如: 平日晚班、假日全天)', type: 'text', required: true }
  ]);
  const [draftQuestions, setDraftQuestions] = useState<any[]>([]);
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState<string>('');
  const [editingQuestionType, setEditingQuestionType] = useState<string>('text');
  
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState<boolean>(false);

  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);

  const [newQuestion, setNewQuestion] = useState<any>({ text: '', type: 'text', required: true });
  const [formData, setFormData] = useState<any>({ name: '', phone: '', position: '', branch: '', gender: '', address: '', birthday: '', answers: {}, consent: false });
  const [status, setStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "system_settings", "main"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.headerContent) {
            setHeaderContent(data.headerContent);
            setDraftHeaderContent(data.headerContent);
          }
          if (data.customQuestions) {
            setCustomQuestions(data.customQuestions);
            setDraftQuestions(data.customQuestions);
          }
          if (data.customBranches) {
            setCustomBranches(data.customBranches);
            setDraftBranches(data.customBranches);
          }
          if (data.customPositions) {
            setCustomPositions(data.customPositions);
            setDraftPositions(data.customPositions);
          }
        }
      } catch (error: any) {
        console.warn("無法從 Firebase 載入設定，將使用預設值。原因:", error.message);
      }
    };
    fetchSettings();
  }, []);

  const handleAdminLogin = async (e: any) => {
    e.preventDefault();
    setLoginError(false);
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      setCurrentView('admin');
      setDraftQuestions([...customQuestions]); 
      setDraftBranches([...customBranches]);
      setDraftPositions([...customPositions]);
      setDraftHeaderContent({ ...headerContent });
      setShowLoginModal(false);
      setPasswordInput('');
      setEmailInput('');
    } catch (error: any) {
      console.error("登入失敗完整錯誤:", error);
      // 精準判斷 API 金鑰錯誤與其他錯誤，以中文友善提示
      if (error.message && error.message.includes('api-key-not-valid')) {
        setLoginError('API 金鑰錯誤：您可能複製錯了，或是少複製到字母。請檢查程式碼。');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setLoginError('帳號或密碼錯誤，請重新輸入');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError('目前網址尚未被 Firebase 授權，請至後台加入「已授權網域」');
      } else {
        setLoginError(`登入失敗 (${error.code || error.message})`);
      }
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setPasswordInput('');
    setEmailInput('');
    setLoginError(false);
  };

  const handleLogoutAttempt = () => {
    const isQuestionsDirty = JSON.stringify(draftQuestions) !== JSON.stringify(customQuestions);
    const isHeaderDirty = JSON.stringify(draftHeaderContent) !== JSON.stringify(headerContent);
    const isBranchesDirty = JSON.stringify(draftBranches) !== JSON.stringify(customBranches);
    const isPositionsDirty = JSON.stringify(draftPositions) !== JSON.stringify(customPositions);
    
    if (isQuestionsDirty || isHeaderDirty || isBranchesDirty) {
      setShowUnsavedModal(true);
    } else {
      signOut(auth).then(() => {
        setCurrentView('candidate');
      });
    }
  };

  const handleConfirmLogout = () => {
    signOut(auth).then(() => {
      setShowUnsavedModal(false);
      setCurrentView('candidate');
    });
  };

  const handleLogoUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogoUrl(reader.result); 
        e.target.value = ''; 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setDraftHeaderContent((prev: any) => ({ ...prev, logoUrl: croppedBase64 }));
    setTempLogoUrl(null); 
  };

  const handleBasicInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, answers: { ...prev.answers, [questionId]: value } }));
  };

  const scrollToField = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 嘗試 focus 內部的 input/select/textarea
      const input = el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
        ? el
        : el.querySelector('input, select, textarea');
      if (input) setTimeout(() => (input as HTMLElement).focus(), 400);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // 依序驗證基本資料欄位
    if (!formData.name.trim()) {
      setStatus('error'); setErrorMessage('請填寫真實姓名');
      scrollToField('field-name'); return;
    }
    if (!formData.phone.trim()) {
      setStatus('error'); setErrorMessage('請填寫聯絡電話');
      scrollToField('field-phone'); return;
    }
    if (!formData.position) {
      setStatus('error'); setErrorMessage('請選擇應徵職缺');
      scrollToField('field-position'); return;
    }
    if (!formData.branch) {
      setStatus('error'); setErrorMessage('請選擇應徵分店');
      scrollToField('field-branch'); return;
    }
    if (!formData.gender) {
      setStatus('error'); setErrorMessage('請選擇性別');
      scrollToField('field-gender'); return;
    }
    if (!formData.birthday) {
      setStatus('error'); setErrorMessage('請填寫出生年月日');
      scrollToField('field-birthday'); return;
    }
    if (!formData.address.trim()) {
      setStatus('error'); setErrorMessage('請填寫居住地址');
      scrollToField('field-address'); return;
    }

    // 依序驗證問答題
    for (const q of customQuestions) {
      if (q.required && !formData.answers[q.id]?.trim()) {
        setStatus('error'); setErrorMessage(`請完成必填題目：${q.text}`);
        scrollToField(`field-q-${q.id}`); return;
      }
    }

    // 個資同意
    if (!formData.consent) {
      setStatus('error'); setErrorMessage('請勾選同意個資聲明');
      scrollToField('consent'); return;
    }

    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const payload = {
        candidate_name: formData.name,
        candidate_phone: formData.phone,
        applied_position: formData.position,
        applied_branch: formData.branch,
        candidate_gender: formData.gender,
        candidate_address: formData.address,
        candidate_birthday: formData.birthday,
        has_consented: formData.consent, 
        custom_answers: customQuestions.map(q => ({
          question: q.text,
          answer: formData.answers[q.id] || ''
        })),
        source: 'fnb_interview_portal',
        submitted_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "candidates"), payload);
      setSubmittedDocId(docRef.id);
      submittedDocIdRef.current = docRef.id;
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      console.warn("寫入失敗:", error.message);
      if (error.message && error.message.includes('offline')) {
        setErrorMessage('目前處於離線狀態或被瀏覽器阻擋連線，請檢查網路狀態。');
      } else {
        setErrorMessage('資料庫連線失敗，請檢查 Firebase 設定與存取權限。');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', position: '', branch: '', gender: '', address: '', birthday: '', answers: {}, consent: false });
    setStatus('idle');
    setSubmittedDocId('');
    submittedDocIdRef.current = '';
    setRatingStatus('idle');
    setReviewStatus('idle');
  };

  const handleRatingComplete = async (data: { interviewerName: string; branch: string; grade: string; note: string }) => {
    const docId = submittedDocIdRef.current;
    console.log('[評分] 開始寫入，docId:', docId, '資料:', data);
    if (!docId) {
      console.error('[評分] 錯誤：docId 為空，無法寫入');
      alert('評分儲存失敗：找不到應徵者資料 ID，請聯絡管理員。');
      setRatingStatus('done');
      return;
    }
    try {
      await updateDoc(doc(db, 'candidates', docId), {
        interviewer_name: data.interviewerName,
        interviewer_branch: data.branch,
        interview_grade: data.grade,
        interview_note: data.note,
        rated_at: new Date().toISOString(),
      });
      console.log('[評分] 寫入成功');
    } catch (e: any) {
      console.error('[評分] 寫入失敗:', e?.code, e?.message);
      alert(`評分儲存失敗：${e?.message || '未知錯誤'}\n\n請確認 Firebase 規則是否允許更新（update）操作。`);
    }
    setRatingStatus('done');
  };

  const openEditModal = (candidate: any) => {
    setEditingCandidate(candidate);
    setEditGrade(candidate.interview_grade || '');
    setEditNote(candidate.interview_note || '');
    setEditInterviewerName(candidate.interviewer_name || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCandidate) return;
    setIsSavingEdit(true);
    try {
      const updates = {
        interview_grade: editGrade,
        interview_note: editNote,
        interviewer_name: editInterviewerName,
        rated_at: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'candidates', editingCandidate.id), updates);
      setCandidatesList((prev: any[]) => prev.map(c => c.id === editingCandidate.id ? { ...c, ...updates } : c));
      setEditingCandidate(null);
    } catch (e: any) { alert('儲存失敗: ' + e.message); }
    setIsSavingEdit(false);
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'candidates', id));
      setCandidatesList((prev: any[]) => prev.filter(c => c.id !== id));
      setDeleteConfirmId(null);
      setExpandedCardId(null);
    } catch (e: any) { alert('刪除失敗: ' + e.message); }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) return;
    setDraftQuestions([...draftQuestions, { ...newQuestion, id: `q${Date.now()}` }]);
    setNewQuestion({ text: '', type: 'text', required: true });
  };
  const handleDeleteQuestion = (id: string) => {
    setDraftQuestions(draftQuestions.filter(q => q.id !== id));
  };

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = () => {
    if (dragItemIndex.current === null || dragOverItemIndex.current === null) return;
    if (dragItemIndex.current === dragOverItemIndex.current) return;
    const updated = [...draftQuestions];
    const dragged = updated.splice(dragItemIndex.current, 1)[0];
    updated.splice(dragOverItemIndex.current, 0, dragged);
    setDraftQuestions(updated);
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const handleAddBranch = () => {
    const trimmed = newBranchInput.trim();
    if (trimmed && !draftBranches.includes(trimmed)) {
      setDraftBranches([...draftBranches, trimmed]);
      setNewBranchInput('');
    }
  };
  const handleDeleteBranch = (branch: string) => {
    setDraftBranches(draftBranches.filter(b => b !== branch));
  };

  const handleEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setEditingQuestionText(q.text);
    setEditingQuestionType(q.type);
  };

  const handleSaveQuestionEdit = (id: string) => {
    if (!editingQuestionText.trim()) return;
    setDraftQuestions(draftQuestions.map(q =>
      q.id === id ? { ...q, text: editingQuestionText.trim(), type: editingQuestionType } : q
    ));
    setEditingQuestionId(null);
  };

  const handleAddPosition = () => {
    const trimmed = newPositionInput.trim();
    if (!trimmed || draftPositions.includes(trimmed)) return;
    setDraftPositions([...draftPositions, trimmed]);
    setNewPositionInput('');
  };

  const handleDeletePosition = (pos: string) => {
    setDraftPositions(draftPositions.filter(p => p !== pos));
  };

  const handleSaveSettings = async () => {
    setCustomQuestions([...draftQuestions]);
    setCustomBranches([...draftBranches]);
    setCustomPositions([...draftPositions]);
    setHeaderContent({ ...draftHeaderContent });
    
    const draftIds = draftQuestions.map(q => q.id);
    const newAnswers = { ...formData.answers };
    let hasDeleted = false;
    Object.keys(newAnswers).forEach(key => {
      if (!draftIds.includes(key)) {
        delete newAnswers[key];
        hasDeleted = true;
      }
    });
    if (hasDeleted) {
      setFormData((prev: any) => ({ ...prev, answers: newAnswers }));
    }

    try {
      await setDoc(doc(db, "system_settings", "main"), {
        headerContent: draftHeaderContent,
        customQuestions: draftQuestions,
        customBranches: draftBranches,
        customPositions: draftPositions,
        updated_at: new Date().toISOString()
      });
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (error: any) {
      console.warn("儲存失敗:", error.message);
      if (error.message && error.message.includes('offline')) {
        alert("儲存設定失敗：目前處於離線狀態或被瀏覽器阻擋，請檢查網路連線。");
      } else {
        alert("儲存設定失敗，請確認 Firebase 資料庫的讀寫權限 (Firestore Rules) 是否已開放。");
      }
    }
  };

  useEffect(() => {
    if (currentView === 'admin' && (adminMainTab === 'employees' || adminMainTab === 'ratings')) {
      const fetchCandidates = async () => {
        setIsLoadingCandidates(true);
        try {
          const querySnapshot = await getDocs(collection(db, "candidates"));
          const list: any[] = [];
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
          setCandidatesList(list);
        } catch (error: any) {
          console.warn("載入名單失敗:", error.message);
        } finally {
          setIsLoadingCandidates(false);
        }
      };
      fetchCandidates();
    }
  }, [currentView, adminMainTab]);

  const filteredCandidates = adminEmployeeTab === 'all'
    ? candidatesList
    : candidatesList.filter(c => c.applied_branch === adminEmployeeTab);

  const inputClassName = "focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 block w-full pl-11 sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 transition-all hover:bg-zinc-200 focus:bg-white text-zinc-900 font-medium placeholder:text-zinc-400";

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-12 relative select-text">
      
      {tempLogoUrl && (
        <ImageCropper 
          imageUrl={tempLogoUrl} 
          onCrop={handleCropConfirm} 
          onCancel={() => setTempLogoUrl(null)} 
        />
      )}

      {showSaveToast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-zinc-900 text-white px-6 py-4 rounded-full shadow-xl flex items-center space-x-3 border border-zinc-700">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-bold text-[15px] tracking-wide">所有變更已成功儲存至雲端！</span>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-900">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2 text-center tracking-tight">後台編輯登入</h3>
            <p className="text-sm text-zinc-500 mb-6 text-center font-medium">請輸入管理員專屬帳號密碼</p>
            
            <form onSubmit={handleAdminLogin}>
              <div className="space-y-4 mb-6">
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e: any) => {
                    setEmailInput(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  autoFocus
                  required
                  placeholder="管理員 Email"
                  className={`w-full bg-zinc-100 border-2 rounded-2xl py-3.5 px-4 focus:outline-none transition-all ${
                    loginError ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-transparent focus:border-zinc-900 focus:bg-white'
                  }`}
                />
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e: any) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  required
                  placeholder="請輸入密碼"
                  className={`w-full bg-zinc-100 border-2 rounded-2xl py-3.5 px-4 focus:outline-none transition-all ${
                    loginError ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-transparent focus:border-zinc-900 focus:bg-white'
                  }`}
                />
                {loginError && <p className="text-red-500 text-sm mt-2 font-bold animate-pulse">{loginError}</p>}
              </div>
              
              <div className="flex space-x-3">
                <button type="button" onClick={closeLoginModal} className="flex-1 py-3.5 rounded-full bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 active:scale-95 transition-all">取消</button>
                <button type="submit" className="flex-1 py-3.5 rounded-full bg-zinc-900 text-white font-bold hover:bg-zinc-800 active:scale-95 transition-all shadow-md">確認登入</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2 text-center tracking-tight">尚未儲存變更</h3>
            <p className="text-sm text-zinc-500 mb-6 text-center font-medium leading-relaxed">
              您剛剛有修改或刪除資料，但尚未點擊底部儲存。<br/>確定要放棄修改並登出嗎？
            </p>
            <div className="flex space-x-3">
              <button onClick={() => setShowUnsavedModal(false)} className="flex-1 py-3.5 rounded-full bg-zinc-100 text-zinc-700 font-bold hover:bg-zinc-200 active:scale-95 transition-all">繼續編輯</button>
              <button onClick={handleConfirmLogout} className="flex-1 py-3.5 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 active:scale-95 transition-all shadow-md">放棄並登出</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto pt-16 px-4 sm:px-6">
        {currentView === 'admin' ? (
          /* ========================================================================================= */
          /* 後台管理端畫面 */
          /* ========================================================================================= */
          <div className="animate-in fade-in duration-300">
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center">
                <SettingsIcon className="w-6 h-6 mr-2 text-zinc-900" />
                面試單後台管理
              </h2>
              <button
                onClick={handleLogoutAttempt}
                className="flex items-center px-5 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-4 h-4 mr-2" />登出並返回
              </button>
            </div>

            {/* 後台主分類風琴式 UI */}
            <div className="flex space-x-3 mb-6">
              <button 
                onClick={() => setAdminMainTab('settings')}
                className={`flex-1 py-4 font-bold text-lg rounded-[1.5rem] transition-all flex items-center justify-center ${adminMainTab === 'settings' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50'}`}
              >
                <SettingsIcon className="w-5 h-5 mr-2" /> 面試單設定
              </button>
              <button 
                onClick={() => setAdminMainTab('employees')}
                className={`flex-1 py-4 font-bold text-base rounded-[1.5rem] transition-all flex items-center justify-center ${adminMainTab === 'employees' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50'}`}
              >
                <Users className="w-5 h-5 mr-2" /> 員工管理
              </button>
              <button 
                onClick={() => setAdminMainTab('ratings')}
                className={`flex-1 py-4 font-bold text-base rounded-[1.5rem] transition-all flex items-center justify-center ${adminMainTab === 'ratings' ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50'}`}
              >
                <ClipboardCheck className="w-5 h-5 mr-2" /> 評分總覽
              </button>
            </div>

            {/* ======================================================= */}
            {/* 分頁 1: 面試單設定                                         */}
            {/* ======================================================= */}
            {adminMainTab === 'settings' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in">
                {/* 視覺文案與分店設定 */}
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3">
                      <ImageIcon className="w-4 h-4 text-zinc-900" />
                    </div>
                    首頁視覺與文案設定
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Logo 上傳 */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-3">品牌 LOGO</label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0">
                          {draftHeaderContent.logoUrl ? (
                            <img src={draftHeaderContent.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Utensils className="w-10 h-10 text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer transition-colors"
                          />
                          <p className="text-[13px] text-zinc-400 mt-2 font-medium">建議上傳 240x240px 以上之圖片。上傳後可手動裁切。</p>
                          {draftHeaderContent.logoUrl && (
                            <button 
                              onClick={() => setDraftHeaderContent((prev: any) => ({ ...prev, logoUrl: '' }))}
                              className="text-red-500 text-xs font-bold mt-2 hover:text-red-600 transition-colors"
                            >
                              移除自訂 LOGO
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 標題設定 */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-2">主標題</label>
                      <textarea
                        value={draftHeaderContent.title}
                        onChange={(e: any) => setDraftHeaderContent((prev: any) => ({...prev, title: e.target.value}))}
                        rows={2}
                        className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all focus:bg-white resize-none text-zinc-900 font-medium placeholder:text-zinc-400"
                        placeholder="請輸入前台標題 (可換行)"
                      />
                    </div>

                    {/* 描述設定 */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-2">下方內容 (歡迎文案)</label>
                      <textarea
                        value={draftHeaderContent.description}
                        onChange={(e: any) => setDraftHeaderContent((prev: any) => ({...prev, description: e.target.value}))}
                        rows={3}
                        className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all focus:bg-white resize-none text-zinc-900 font-medium placeholder:text-zinc-400"
                        placeholder="輸入給應徵者的說明文字..."
                      />
                    </div>

                    {/* 個資聲明設定 */}
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-1">個資同意聲明文字</label>
                      <p className="text-xs text-zinc-400 mb-2">顯示於面試表單底部的個資同意勾選欄</p>
                      <textarea
                        value={draftHeaderContent.consentText || ''}
                        onChange={(e: any) => setDraftHeaderContent((prev: any) => ({...prev, consentText: e.target.value}))}
                        rows={3}
                        className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all focus:bg-white resize-none text-zinc-900 font-medium placeholder:text-zinc-400"
                        placeholder="我瞭解並同意貴公司為「人才招募」目的，蒐集、處理我的個人資料..."
                      />
                    </div>

                    {/* 面試官通知卡片設定 */}
                    <div className="pt-5 border-t border-zinc-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <label className="block text-sm font-semibold text-zinc-700">面試官通知卡片</label>
                      </div>
                      <p className="text-xs text-zinc-400 mb-4">面試者滑動 Continue 後，螢幕中央彈出的通知卡片內容</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1.5">卡片標題</label>
                          <input
                            type="text"
                            value={draftHeaderContent.reviewNoticeTitle || ''}
                            onChange={(e: any) => setDraftHeaderContent((prev: any) => ({...prev, reviewNoticeTitle: e.target.value}))}
                            className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3 px-4 transition-all focus:bg-white text-zinc-900 font-medium"
                            placeholder="面試者已完成填寫"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1.5">卡片說明文字</label>
                          <textarea
                            value={draftHeaderContent.reviewNoticeText || ''}
                            onChange={(e: any) => setDraftHeaderContent((prev: any) => ({...prev, reviewNoticeText: e.target.value}))}
                            rows={3}
                            className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all focus:bg-white resize-none text-zinc-900 font-medium placeholder:text-zinc-400"
                            placeholder="請面試官確認資料後，向右滑動下方紅色滑軌開始進行評分。"
                          />
                        </div>
                        {/* 預覽卡片 */}
                        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
                          <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-widest">預覽效果</p>
                          <p className="font-extrabold text-zinc-900 text-base mb-1">{draftHeaderContent.reviewNoticeTitle || '面試者已完成填寫'}</p>
                          <p className="text-sm text-zinc-600 leading-relaxed">{draftHeaderContent.reviewNoticeText || '請面試官確認資料後，向右滑動下方紅色滑軌開始進行評分。'}</p>
                        </div>
                      </div>
                    </div>

                    {/* 應徵分店設定 */}
                    <div className="pt-6 border-t border-zinc-100">
                      <label className="block text-sm font-semibold text-zinc-700 mb-3">應徵分店選項</label>
                      <div className="flex space-x-3 mb-4">
                        <input
                          type="text"
                          value={newBranchInput}
                          onChange={(e: any) => setNewBranchInput(e.target.value)}
                          placeholder="輸入分店名稱 (例如：虎尾店)"
                          className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3 px-4 transition-all focus:bg-white"
                          onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBranch(); } }}
                        />
                        <button
                          onClick={handleAddBranch}
                          disabled={!newBranchInput.trim()}
                          className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                          新增分店
                        </button>
                      </div>
                      
                      {draftBranches.length === 0 ? (
                        <p className="text-sm text-zinc-400 font-medium bg-zinc-50 py-4 text-center rounded-2xl">目前尚無任何分店選項</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {draftBranches.map(branch => (
                            <div key={branch} className="flex items-center bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-full">
                              <span className="text-[13px] font-bold text-zinc-800 mr-2">{branch}</span>
                              <button 
                                onClick={() => handleDeleteBranch(branch)}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 應徵職位設定 */}
                    <div className="pt-6 border-t border-zinc-100">
                      <label className="block text-sm font-semibold text-zinc-700 mb-1">應徵職位選項</label>
                      <p className="text-xs text-zinc-400 mb-3">前台「請選擇欲應徵職缺」的選項清單</p>
                      <div className="flex space-x-3 mb-4">
                        <input
                          type="text"
                          value={newPositionInput}
                          onChange={(e: any) => setNewPositionInput(e.target.value)}
                          placeholder="輸入職位名稱 (例如：外場服務人員)"
                          className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3 px-4 transition-all focus:bg-white text-zinc-900 font-medium"
                          onKeyDown={(e: any) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPosition(); } }}
                        />
                        <button
                          onClick={handleAddPosition}
                          disabled={!newPositionInput.trim()}
                          className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                          新增職位
                        </button>
                      </div>
                      {draftPositions.length === 0 ? (
                        <p className="text-sm text-zinc-400 font-medium bg-zinc-50 py-4 text-center rounded-2xl">目前尚無任何職位選項</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {draftPositions.map(pos => (
                            <div key={pos} className="flex items-center bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-full">
                              <span className="text-[13px] font-bold text-zinc-800 mr-2">{pos}</span>
                              <button
                                onClick={() => handleDeletePosition(pos)}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 題庫管理區塊 */}
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900 mb-5 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3">
                      <ShieldCheck className="w-4 h-4 text-zinc-900" />
                    </div>
                    面試題庫管理
                  </h3>
                  
                  <div className="space-y-5 mb-8 pb-8 border-b border-zinc-100">
                    <h4 className="text-sm font-bold text-zinc-700 mb-3 flex items-center">
                      <Plus className="w-4 h-4 mr-1 text-zinc-400" /> 加入新題目
                    </h4>
                    <div>
                      <input
                        type="text"
                        value={newQuestion.text}
                        onChange={(e: any) => setNewQuestion((prev: any) => ({...prev, text: e.target.value}))}
                        placeholder="例如：您對餐飲服務的熱情是什麼？"
                        className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="flex-1">
                        <select
                          value={newQuestion.type}
                          onChange={(e: any) => setNewQuestion((prev: any) => ({...prev, type: e.target.value}))}
                          className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all focus:bg-white"
                        >
                          <option value="text">單行填寫 (簡短回答)</option>
                          <option value="textarea">多行問答 (詳細論述)</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center text-sm font-semibold text-zinc-700 cursor-pointer bg-zinc-100 px-4 py-3.5 rounded-2xl w-full sm:w-auto hover:bg-zinc-200 transition-colors">
                          <input
                            type="checkbox"
                            checked={newQuestion.required}
                            onChange={(e: any) => setNewQuestion((prev: any) => ({...prev, required: e.target.checked}))}
                            className="mr-3 rounded text-zinc-900 focus:ring-zinc-900 w-5 h-5 border-zinc-300"
                          />
                          必填項目
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={handleAddQuestion}
                      disabled={!newQuestion.text.trim()}
                      className="w-full bg-zinc-900 text-white py-4 rounded-full font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98] mt-2"
                    >
                      暫存並加入清單
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-700 mb-4">草稿列表 ({draftQuestions.length})
                    {draftQuestions.length > 1 && <span className="ml-2 text-xs text-zinc-400 font-normal">拖曳左側 ⠿ 可調整順序</span>}
                  </h4>
                  {draftQuestions.length === 0 ? (
                    <p className="text-zinc-400 text-center py-8 font-medium bg-zinc-50 rounded-3xl">目前沒有任何自訂題目</p>
                  ) : (
                    <ul className="space-y-3">
                      {draftQuestions.map((q, index) => {
                        const isEditing = editingQuestionId === q.id;
                        return (
                        <li
                          key={q.id}
                          draggable={!isEditing}
                          onDragStart={() => !isEditing && handleDragStart(index)}
                          onDragEnter={() => !isEditing && handleDragEnter(index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e: any) => e.preventDefault()}
                          className={`flex items-start justify-between p-5 rounded-3xl transition-all ${isEditing ? 'bg-white border-2 border-zinc-900 shadow-md' : 'bg-zinc-50 hover:bg-zinc-100 cursor-default active:opacity-60 active:scale-[0.99]'}`}
                        >
                          {/* 拖曳把手 */}
                          <div
                            className={`flex-shrink-0 w-8 flex flex-col items-center justify-center gap-1 pt-1 mr-3 transition-colors select-none ${isEditing ? 'text-zinc-200 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500'}`}
                            title={isEditing ? '' : '拖曳排序'}
                          >
                            <span className="text-lg leading-none">⠿</span>
                          </div>

                          <div className="flex-1 pr-3">
                            {/* 標題列 */}
                            <div className="flex items-center mb-2 flex-wrap gap-2">
                              <span className="bg-white shadow-sm text-zinc-900 text-xs px-3 py-1 rounded-full font-bold border border-zinc-100">Q{index + 1}</span>

                              {isEditing ? (
                                /* 編輯模式：類型切換 */
                                <div className="flex rounded-xl overflow-hidden border border-zinc-200 text-xs font-bold">
                                  <button type="button"
                                    onClick={() => setEditingQuestionType('text')}
                                    className={`px-3 py-1.5 transition-colors ${editingQuestionType === 'text' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                                  >單行填寫</button>
                                  <button type="button"
                                    onClick={() => setEditingQuestionType('textarea')}
                                    className={`px-3 py-1.5 transition-colors ${editingQuestionType === 'textarea' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
                                  >多行問答</button>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-zinc-500 bg-zinc-200/50 px-2 py-1 rounded-md">
                                  {q.type === 'text' ? '單行填寫' : '多行問答'}
                                </span>
                              )}
                              {q.required && <span className="text-xs text-red-500 font-bold">• 必填</span>}
                            </div>

                            {/* 內容區 */}
                            {isEditing ? (
                              <div className="space-y-3">
                                <textarea
                                  autoFocus
                                  value={editingQuestionText}
                                  onChange={(e: any) => setEditingQuestionText(e.target.value)}
                                  rows={3}
                                  onKeyDown={(e: any) => { if (e.key === 'Enter' && e.metaKey) handleSaveQuestionEdit(q.id); if (e.key === 'Escape') setEditingQuestionId(null); }}
                                  className="w-full bg-zinc-50 rounded-2xl py-3 px-4 text-sm font-semibold text-zinc-900 border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none outline-none"
                                />
                                <div className="flex gap-2">
                                  <button type="button"
                                    onClick={() => handleSaveQuestionEdit(q.id)}
                                    className="flex-1 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 active:scale-95 transition-all"
                                  >✓ 儲存變更</button>
                                  <button type="button"
                                    onClick={() => setEditingQuestionId(null)}
                                    className="px-4 py-2 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-xl hover:bg-zinc-200 active:scale-95 transition-all"
                                  >取消</button>
                                </div>
                              </div>
                            ) : (
                              <p
                                className="text-sm font-semibold text-zinc-800 leading-relaxed cursor-pointer hover:text-zinc-500 transition-colors"
                                onClick={() => handleEditQuestion(q)}
                                title="點擊編輯"
                              >{q.text}</p>
                            )}
                          </div>

                          {/* 右側按鈕 */}
                          {!isEditing && (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditQuestion(q)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm transition-all"
                                title="編輯"
                              >
                                <SaveIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-zinc-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all"
                                title="刪除"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* 底部儲存按鈕卡片 */}
                <div className="mt-8 bg-zinc-900 p-6 sm:p-8 rounded-[2rem] shadow-xl flex flex-col sm:flex-row justify-between items-center space-y-5 sm:space-y-0 relative overflow-hidden">
                  <div className="relative z-10 text-center sm:text-left">
                    <h4 className="text-xl font-bold text-white mb-1 tracking-wide">儲存所有變更</h4>
                    <p className="text-sm text-zinc-400 font-medium">包含視覺文案與題庫，確認無誤後點擊發布至雲端資料庫。</p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="relative z-10 w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 rounded-full font-extrabold shadow-md hover:bg-zinc-100 transition-all active:scale-95 flex items-center justify-center"
                  >
                    <SaveIcon className="w-5 h-5 mr-2" />
                    確認儲存並發布
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* 分頁 2: 員工管理 (讀取 Firebase 資料)                      */}
            {/* ======================================================= */}
            {adminMainTab === 'employees' && (
              <div className="animate-in slide-in-from-bottom-2 fade-in pt-4">
                {/* 員工 - 風琴式 / 資料夾頁籤 UI */}
                <div className="flex items-end pl-4 -mb-px overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setAdminEmployeeTab('all')}
                    className={`px-8 py-4 font-bold text-[15px] rounded-t-[1.5rem] transition-all relative border border-transparent whitespace-nowrap ${
                      adminEmployeeTab === 'all' 
                        ? 'bg-white text-zinc-900 z-20 border-zinc-100 border-b-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]' 
                        : 'bg-zinc-100 text-zinc-500 z-10 hover:bg-zinc-200'
                    }`}
                  >
                    全部門店
                  </button>
                  
                  {customBranches.map(branch => (
                    <button 
                      key={branch}
                      onClick={() => setAdminEmployeeTab(branch)}
                      className={`px-8 py-4 font-bold text-[15px] rounded-t-[1.5rem] transition-all relative border border-transparent whitespace-nowrap ${
                        adminEmployeeTab === branch 
                          ? 'bg-white text-zinc-900 z-20 border-zinc-100 border-b-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]' 
                          : 'bg-zinc-100 text-zinc-500 z-10 hover:bg-zinc-200 -ml-3'
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>

                {/* 內容區塊 */}
                <div className="bg-white rounded-[2rem] rounded-tl-none shadow-sm border border-zinc-100 p-8 relative z-10 min-h-[400px]">
                  <div className="flex items-center mb-8 pb-4 border-b border-zinc-100">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-zinc-900" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">
                      {adminEmployeeTab === 'all' ? '全部門店' : adminEmployeeTab} 員工列表
                    </h3>
                  </div>

                  {isLoadingCandidates ? (
                    <div className="py-20 text-center text-zinc-400 font-medium bg-zinc-50 rounded-3xl border border-zinc-100 flex flex-col items-center">
                      <Loader2 className="animate-spin w-8 h-8 mb-4 text-zinc-400" />
                      正在從 Firebase 載入資料...
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="py-20 text-center text-zinc-400 font-medium bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                      目前 {adminEmployeeTab === 'all' ? '全部門店' : adminEmployeeTab} 尚未有任何員工資料
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCandidates.map(candidate => {
                        const g = GRADE_OPTIONS.find(x => x.value === (candidate.interview_grade || ''));
                        const isOpen = expandedCardId === candidate.id;
                        const isDeleting = deleteConfirmId === candidate.id;
                        return (
                          <div key={candidate.id} className={`rounded-2xl border overflow-hidden transition-all ${isOpen ? 'border-zinc-300 shadow-sm' : 'border-zinc-100'}`}>
                            {/* 標題列 */}
                            <button type="button" onClick={() => { setExpandedCardId(isOpen ? null : candidate.id); setDeleteConfirmId(null); }}
                              className="w-full bg-zinc-50 hover:bg-zinc-100 px-5 py-4 flex items-center justify-between text-left transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                {g
                                  ? <span className={`w-9 h-9 rounded-full ${g.color} text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0`}>{g.value}</span>
                                  : <span className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-400 text-xs font-bold flex items-center justify-center flex-shrink-0">?</span>
                                }
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-900 text-sm truncate">{candidate.candidate_name}</p>
                                  <p className="text-xs text-zinc-500 truncate">{candidate.applied_branch} · {candidate.applied_position}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                {g ? <span className={`text-xs font-bold px-2.5 py-1 rounded-full border hidden sm:block ${g.light}`}>{g.desc}</span>
                                   : <span className="text-xs font-bold text-zinc-400 border border-zinc-200 px-2.5 py-1 rounded-full hidden sm:block">待評分</span>}
                                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                              </div>
                            </button>
                            {/* 展開內容 */}
                            {isOpen && (
                              <div className="bg-white border-t border-zinc-100 px-5 pb-5 pt-4 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full">{candidate.candidate_phone}</span>
                                  {candidate.candidate_gender && <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full">{candidate.candidate_gender === 'male' ? '男' : candidate.candidate_gender === 'female' ? '女' : '中性'}</span>}
                                  {candidate.candidate_birthday && <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full">生日：{candidate.candidate_birthday}</span>}
                                  {candidate.candidate_address && <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full">📍 {candidate.candidate_address}</span>}
                                  <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-full">提交：{candidate.submitted_at ? new Date(candidate.submitted_at).toLocaleString() : '—'}</span>
                                </div>
                                {/* 評分 */}
                                {g ? (
                                  <div className={`p-4 rounded-2xl border ${g.light}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 opacity-60" /><span className="text-xs font-bold opacity-60">面試官評分</span></div>
                                      <span className="text-xs opacity-60">{candidate.interviewer_name} · {candidate.interviewer_branch}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`w-10 h-10 rounded-full ${g.color} text-white font-extrabold text-lg flex items-center justify-center`}>{g.value}</span>
                                      <div>
                                        <p className="font-bold text-sm">{g.label} — {g.desc}</p>
                                        {candidate.rated_at && <p className="text-xs opacity-60">{new Date(candidate.rated_at).toLocaleString()}</p>}
                                      </div>
                                    </div>
                                    {candidate.interview_note && <p className="mt-3 pt-3 border-t border-current border-opacity-20 text-sm whitespace-pre-wrap">{candidate.interview_note}</p>}
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-sm text-zinc-400">尚未評分</div>
                                )}
                                {/* 問答 */}
                                {(candidate.custom_answers || []).length > 0 && (
                                  <div className="space-y-3 pt-2 border-t border-zinc-100">
                                    {(candidate.custom_answers || []).map((ans: any, idx: number) => (
                                      <div key={idx}>
                                        <p className="text-xs font-bold text-zinc-500 mb-1">Q{idx+1}. {ans.question}</p>
                                        <p className="text-sm font-semibold text-zinc-800 bg-zinc-50 p-3 rounded-xl border border-zinc-200 whitespace-pre-wrap">{ans.answer || <span className="text-zinc-400 font-normal">無回答</span>}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* 編輯 / 刪除 */}
                                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                                  <button type="button" onClick={() => openEditModal(candidate)}
                                    className="flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-full hover:bg-zinc-700 active:scale-95 transition-all">
                                    <SaveIcon className="w-4 h-4 mr-1.5" />編輯評分
                                  </button>
                                  {isDeleting ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-red-600">確定刪除？</span>
                                      <button type="button" onClick={() => handleDeleteCandidate(candidate.id)} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full">確定</button>
                                      <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full">取消</button>
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => setDeleteConfirmId(candidate.id)}
                                      className="flex items-center px-5 py-2.5 bg-red-50 text-red-500 border border-red-200 text-sm font-bold rounded-full hover:bg-red-100 active:scale-95 transition-all">
                                      <Trash2 className="w-4 h-4 mr-1.5" />刪除
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 分頁 3: 評分總覽 */}
            {adminMainTab === 'ratings' && (
              <div className="space-y-5 pt-2">
                {isLoadingCandidates ? (
                  <div className="py-20 text-center text-zinc-400 flex flex-col items-center"><Loader2 className="animate-spin w-8 h-8 mb-3" />載入中...</div>
                ) : candidatesList.filter(c => c.interview_grade).length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
                    <p className="text-zinc-400">目前尚無任何評分紀錄</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      {GRADE_OPTIONS.map(g => {
                        const cnt = candidatesList.filter(c => c.interview_grade === g.value).length;
                        return (
                          <div key={g.value} className={`p-4 rounded-2xl border text-center ${cnt > 0 ? g.light : 'bg-zinc-50 border-zinc-100'}`}>
                            <span className={`w-10 h-10 rounded-full ${cnt > 0 ? g.color : 'bg-zinc-200'} text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-2`}>{g.value}</span>
                            <p className={`text-2xl font-extrabold ${cnt === 0 ? 'text-zinc-300' : ''}`}>{cnt}</p>
                            <p className={`text-xs mt-0.5 ${cnt === 0 ? 'text-zinc-300' : 'opacity-70'}`}>人</p>
                          </div>
                        );
                      })}
                    </div>
                    {GRADE_OPTIONS.map(g => {
                      const group = candidatesList.filter(c => c.interview_grade === g.value);
                      if (!group.length) return null;
                      return (
                        <div key={g.value} className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden">
                          <div className={`px-6 py-4 flex items-center gap-3 border-b border-current border-opacity-20 ${g.light}`}>
                            <span className={`w-10 h-10 rounded-full ${g.color} text-white font-extrabold text-lg flex items-center justify-center`}>{g.value}</span>
                            <div><p className="font-extrabold">{g.label} — {g.desc}</p><p className="text-xs opacity-60">共 {group.length} 人</p></div>
                          </div>
                          <div className="divide-y divide-zinc-50">
                            {group.map(candidate => {
                              const rid = 'r-' + candidate.id;
                              const isOpen = expandedCardId === rid;
                              return (
                                <div key={candidate.id}>
                                  <button type="button" onClick={() => setExpandedCardId(isOpen ? null : rid)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-zinc-500" /></div>
                                      <div><p className="font-bold text-zinc-900 text-sm">{candidate.candidate_name}</p>
                                        <p className="text-xs text-zinc-400">{candidate.interviewer_branch || candidate.applied_branch} · 面試官：{candidate.interviewer_name || '未填'}</p>
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                  </button>
                                  {isOpen && (
                                    <div className={`mx-4 mb-4 p-4 rounded-2xl border ${g.light}`}>
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs font-semibold bg-white bg-opacity-60 px-3 py-1 rounded-full">{candidate.candidate_phone}</span>
                                        <span className="text-xs font-semibold bg-white bg-opacity-60 px-3 py-1 rounded-full">{candidate.applied_branch}</span>
                                        {candidate.rated_at && <span className="text-xs bg-white bg-opacity-60 px-3 py-1 rounded-full">{new Date(candidate.rated_at).toLocaleString()}</span>}
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap">{candidate.interview_note || '（無評語）'}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* 編輯評分 Modal */}
            {editingCandidate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                <div className="bg-white rounded-[2rem] p-7 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mr-3"><ClipboardCheck className="w-6 h-6 text-zinc-900" /></div>
                    <div><h3 className="text-lg font-extrabold text-zinc-900">編輯評分資料</h3><p className="text-xs text-zinc-400">{editingCandidate.candidate_name}</p></div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">面試官姓名</label>
                      <input type="text" value={editInterviewerName} onChange={(e:any) => setEditInterviewerName(e.target.value)}
                        className="w-full bg-zinc-100 rounded-2xl py-3.5 px-4 text-sm font-semibold text-zinc-900 border-transparent focus:ring-2 focus:ring-zinc-900 focus:bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">等級評分</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {GRADE_OPTIONS.map(g => (
                          <button key={g.value} type="button" onClick={() => setEditGrade(g.value)}
                            className={`relative p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${editGrade === g.value ? `${g.light} border-current` : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className="flex items-center mb-1">
                              <span className={`w-7 h-7 rounded-full ${g.color} text-white font-extrabold text-xs flex items-center justify-center mr-2`}>{g.value}</span>
                              <span className="font-bold text-sm">{g.label}</span>
                            </div>
                            <p className="text-xs text-zinc-400">{g.desc}</p>
                            {editGrade === g.value && <CheckCircle className="absolute top-2.5 right-2.5 w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">評語備註</label>
                      <textarea value={editNote} onChange={(e:any) => setEditNote(e.target.value)} rows={4}
                        className="w-full bg-zinc-100 rounded-2xl py-3.5 px-4 text-sm font-semibold text-zinc-900 border-transparent focus:ring-2 focus:ring-zinc-900 focus:bg-white resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setEditingCandidate(null)} className="flex-1 py-3.5 rounded-full bg-zinc-100 text-zinc-700 font-bold">取消</button>
                    <button type="button" onClick={handleSaveEdit} disabled={isSavingEdit}
                      className="flex-1 py-3.5 rounded-full bg-zinc-900 text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                      {isSavingEdit ? <><Loader2 className="animate-spin w-4 h-4" />儲存中...</> : <><SaveIcon className="w-4 h-4" />儲存</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        ) : (
          /* ========================================================================================= */
          /* 面試者填寫端畫面 */
          /* ========================================================================================= */
          <div className="bg-white pb-10 px-6 sm:px-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border border-zinc-100 animate-in fade-in duration-300">
            {/* Header / Hero Section (套用動態資料) */}
            <div className="text-center pt-12 pb-8">
              {/* 隱藏的後台入口 LOGO */}
              <div 
                onClick={() => {
                  if (user) {
                    setCurrentView('admin');
                    setDraftQuestions([...customQuestions]);
                    setDraftBranches([...customBranches]);
      setDraftPositions([...customPositions]);
                    setDraftHeaderContent({ ...headerContent });
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                className="w-20 h-20 bg-zinc-100 rounded-full mx-auto flex items-center justify-center mb-6 cursor-pointer hover:bg-zinc-200 hover:shadow-md transition-all active:scale-95 overflow-hidden"
                title="點擊進入後台"
              >
                {headerContent.logoUrl ? (
                  <img src={headerContent.logoUrl} alt="Brand Logo" className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-10 h-10 text-zinc-900" />
                )}
              </div>
              
              <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-4 whitespace-pre-line">
                {headerContent.title}
              </h2>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto whitespace-pre-line">
                {headerContent.description}
              </p>
            </div>

            {status === 'success' ? (
              ratingStatus === 'done' ? (
                /* ===== 階段3：全部完成 ===== */
                <div className="rounded-[2rem] bg-zinc-50 p-10 text-center border border-zinc-100 animate-in fade-in zoom-in duration-300 mt-4">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-3">面試流程完成！</h3>
                  <p className="text-sm text-zinc-500 mb-8">感謝 <strong>{formData.name}</strong> 參與本次面試，評分已記錄至系統。</p>
                  <button type="button" onClick={resetForm} className="inline-flex items-center px-8 py-4 text-sm font-bold rounded-full text-white bg-zinc-900 hover:bg-zinc-800 transition-all">
                    下一位應徵者 <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              ) : reviewStatus === 'done' ? (
                /* ===== 階段2：面試官評分 ===== */
                <div className="mt-4 space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="text-center pt-8 pb-4">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-4">
                      <ClipboardCheck className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">面試官評分</h2>
                    <p className="text-sm text-zinc-500">應徵者 <strong>{formData.name}</strong> 已完成填寫</p>
                  </div>
                  <RatingPanel branches={customBranches} onComplete={handleRatingComplete} />
                </div>
              ) : (
                /* ===== 階段1：表單唯讀 + 通知卡片 + 紅色滑軌 ===== */
                <div className="relative">

                  {/* 通知卡片 — 固定在螢幕中央 */}
                  <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300" style={{maxHeight: '90vh', display: 'flex', flexDirection: 'column'}}>
                      {/* 紅色頂部條 */}
                      <div className="bg-red-500 px-6 py-5 flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-extrabold text-white text-lg leading-tight">
                          {headerContent.reviewNoticeTitle || '面試者已完成填寫'}
                        </p>
                      </div>
                      {/* 可捲動內容區 */}
                      <div className="px-6 py-5 overflow-y-auto flex-1">
                        <p className="text-sm text-zinc-600 leading-relaxed font-medium mb-4">
                          {headerContent.reviewNoticeText || '請面試官確認資料後，向右滑動下方紅色滑軌開始進行評分。'}
                        </p>
                        {/* 應徵者完整資訊 */}
                        <div className="bg-zinc-50 rounded-2xl p-4 mb-4">
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">應徵者資訊</p>
                          <div className="space-y-2">
                            {formData.name && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0">姓名</span>
                                <span className="text-sm font-bold text-zinc-800">{formData.name}</span>
                              </div>
                            )}
                            {formData.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0">電話</span>
                                <span className="text-sm font-semibold text-zinc-700">{formData.phone}</span>
                              </div>
                            )}
                            {formData.position && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0">職缺</span>
                                <span className="text-sm font-semibold text-zinc-700">{formData.position}</span>
                              </div>
                            )}
                            {formData.branch && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0">分店</span>
                                <span className="text-sm font-semibold text-zinc-700">{formData.branch}</span>
                              </div>
                            )}
                            {formData.gender && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0">性別</span>
                                <span className="text-sm font-semibold text-zinc-700">{formData.gender === 'male' ? '男' : formData.gender === 'female' ? '女' : '中性'}</span>
                              </div>
                            )}
                            {formData.birthday && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0">生日</span>
                                <span className="text-sm font-semibold text-zinc-700">{formData.birthday}</span>
                              </div>
                            )}
                            {formData.address && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-bold text-zinc-400 w-10 flex-shrink-0 pt-0.5">地址</span>
                                <span className="text-sm font-semibold text-zinc-700 leading-relaxed">{formData.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 面試問答 */}
                        {customQuestions.length > 0 && (
                          <div className="bg-zinc-50 rounded-2xl p-4 mb-4">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">面試問答</p>
                            <div className="space-y-4">
                              {customQuestions.map((q, idx) => (
                                <div key={q.id}>
                                  <p className="text-xs font-bold text-zinc-500 mb-1.5">Q{idx + 1}. {q.text}</p>
                                  <div className="bg-white rounded-xl px-4 py-3 border border-zinc-100">
                                    <p className="text-sm font-semibold text-zinc-800 leading-relaxed whitespace-pre-wrap">
                                      {formData.answers[q.id] || <span className="text-zinc-300 font-normal">未填寫</span>}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* 紅色滑軌 */}
                        <SwipeToReview onTrigger={() => setReviewStatus('done')} />
                        <p className="text-center text-xs text-zinc-400 font-medium mt-2 mb-3">← 面試官請向右滑動以開始評分</p>
                        {/* 返回修改按鈕 */}
                        <button
                          type="button"
                          onClick={() => { setStatus('idle'); setSubmittedDocId(''); submittedDocIdRef.current = ''; setReviewStatus('idle'); }}
                          className="w-full py-3 rounded-2xl border-2 border-zinc-200 text-zinc-500 text-sm font-bold hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          面試者返回修改資料
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 背景：唯讀表單（模糊顯示） */}
                  <div className="pointer-events-none opacity-40 select-none">
                    <div className="space-y-10">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center">
                          <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3 text-sm">1</span>
                          基本資料
                        </h3>
                        <div className="space-y-3">
                          {[
                            { label: '姓名', value: formData.name },
                            { label: '電話', value: formData.phone },
                            { label: '職缺', value: formData.position },
                            { label: '分店', value: formData.branch },
                            { label: '性別', value: formData.gender === 'male' ? '男' : formData.gender === 'female' ? '女' : formData.gender === 'neutral' ? '中性' : '' },
                            { label: '生日', value: formData.birthday },
                            { label: '地址', value: formData.address },
                          ].filter(f => f.value).map(f => (
                            <div key={f.label} className="bg-zinc-100 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                              <span className="text-xs font-bold text-zinc-400 w-8 flex-shrink-0">{f.label}</span>
                              <span className="text-sm font-semibold text-zinc-700">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {customQuestions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3 text-sm">2</span>
                            面試問答
                          </h3>
                          <div className="space-y-4">
                            {customQuestions.map((q, i) => (
                              <div key={q.id}>
                                <p className="text-xs font-bold text-zinc-500 mb-1">Q{i+1}. {q.text}</p>
                                <div className="bg-zinc-100 rounded-2xl px-5 py-3.5">
                                  <p className="text-sm font-semibold text-zinc-700">{formData.answers[q.id] || '—'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <form className="space-y-10" onSubmit={handleSubmit}>
                
                {status === 'error' && (
                  <div className="rounded-2xl bg-red-50 p-5 border border-red-100">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div className="ml-3">
                        <h3 className="text-sm font-bold text-red-800">發生錯誤</h3>
                        <p className="mt-1 text-sm font-medium text-red-600">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 區塊 1: 基本資料 --- */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3 text-sm">1</span>
                    基本資料
                  </h3>
                  <div className="space-y-5">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input
                        type="text"
                        id="field-name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleBasicInputChange}
                        className={inputClassName}
                        placeholder="真實姓名 (例如：王大明)"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input
                        type="tel"
                        id="field-phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleBasicInputChange}
                        className={inputClassName}
                        placeholder="聯絡電話 (0912-345-678)"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-zinc-400" />
                      </div>
                      <select
                        id="field-position"
                        name="position"
                        required
                        value={formData.position}
                        onChange={handleBasicInputChange}
                        className={`${inputClassName} appearance-none`}
                      >
                        <option value="" disabled>請選擇欲應徵職缺...</option>
                        {customPositions.length === 0 && <option value="none" disabled>目前無可用職位</option>}
                        {customPositions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    {/* 應徵分店選單 */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-zinc-400" />
                      </div>
                      <select
                        id="field-branch"
                        name="branch"
                        required
                        value={formData.branch}
                        onChange={handleBasicInputChange}
                        className={`${inputClassName} appearance-none`}
                      >
                        <option value="" disabled>請選擇應徵分店...</option>
                        {customBranches.length === 0 && <option value="none" disabled>目前無可用分店</option>}
                        {customBranches.map(branch => (
                          <option key={branch} value={branch}>{branch}</option>
                        ))}
                      </select>
                    </div>

                    {/* 性別 */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-zinc-400" />
                      </div>
                      <select
                        id="field-gender"
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleBasicInputChange}
                        className={`${inputClassName} appearance-none`}
                      >
                        <option value="" disabled>請選擇性別...</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                        <option value="neutral">中性</option>
                      </select>
                    </div>

                    {/* 出生年月日 */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5 pl-1 uppercase tracking-widest">出生年月日</label>
                      <input
                        type="date"
                        id="field-birthday"
                        name="birthday"
                        required
                        value={formData.birthday}
                        onChange={handleBasicInputChange}
                        className="focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-4 transition-all hover:bg-zinc-200 focus:bg-white text-zinc-900 font-medium"
                      />
                    </div>

                    {/* 居住地址 */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input
                        type="text"
                        id="field-address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleBasicInputChange}
                        className={inputClassName}
                        placeholder="居住地址 (例如：台北市信義區...)"
                      />
                    </div>
                  </div>
                </div>

                {/* --- 區塊 2: 專業問答題 --- */}
                {customQuestions.length > 0 && (
                  <div className="pt-2 border-t border-zinc-100">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6 mt-8 flex items-center">
                      <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mr-3 text-sm">2</span>
                      面試問答
                    </h3>
                    <div className="space-y-8">
                      {customQuestions.map((q, index) => (
                        <div key={q.id} id={`field-q-${q.id}`}>
                          <label className="block text-sm font-bold text-zinc-900 mb-3 leading-relaxed">
                            {q.text} {q.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {q.type === 'textarea' ? (
                            <textarea
                              required={q.required}
                              rows={4}
                              value={formData.answers[q.id] || ''}
                              onChange={(e: any) => handleAnswerChange(q.id, e.target.value)}
                              className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-3xl py-4 px-5 transition-all focus:bg-white resize-none text-zinc-900 font-medium placeholder:text-zinc-400"
                              placeholder="請在此輸入您的回答..."
                            />
                          ) : (
                            <input
                              type="text"
                              required={q.required}
                              value={formData.answers[q.id] || ''}
                              onChange={(e: any) => handleAnswerChange(q.id, e.target.value)}
                              className="focus:ring-2 focus:ring-zinc-900 block w-full sm:text-sm border-transparent bg-zinc-100 rounded-2xl py-3.5 px-5 transition-all focus:bg-white text-zinc-900 font-medium placeholder:text-zinc-400"
                              placeholder="請輸入簡短回答..."
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 區塊 3: 個資同意書 --- */}
                <div className="bg-zinc-50 p-6 rounded-3xl mt-8">
                  <div className="flex items-start">
                    <div className="flex items-center h-6">
                      <input
                        id="consent"
                        name="consent"
                        type="checkbox"
                        required
                        checked={formData.consent}
                        onChange={handleBasicInputChange}
                        className="h-5 w-5 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer bg-white"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="consent" className="text-sm font-bold text-zinc-900 cursor-pointer block mb-1">
                        同意隱私權與個資聲明 <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs font-medium text-zinc-500 leading-relaxed">
                        {headerContent.consentText || "我瞭解並同意貴公司為「人才招募」目的，蒐集、處理我的個人資料，未經同意不外流。"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 完美復刻的專屬 Continue 膠囊按鈕 */}
                {/* ========================================================= */}
                <div className="pt-4 space-y-3">
                  <SwipeToSubmit
                    disabled={status === 'submitting' || !formData.consent}
                    isLoading={status === 'submitting'}
                    onSubmitTrigger={() => document.getElementById('hidden-submit-btn')?.click()}
                  />
                  <button type="submit" id="hidden-submit-btn" className="hidden">Submit</button>
                </div>

              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
