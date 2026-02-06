import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Instagram,
  Send,
  User,
  MapPin,
  Users,
  Heart,
  AlertCircle,
  Smile,
  Sparkles,
  Diamond,
  MessageCircle,
  Copy,
  Trash2,
  Lock,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- 🆕 1. 服務方案資料庫 (依照您的需求重新定義) ---
// category: 'standard' (一般用), 'registration' (登記用)
const SERVICE_CATALOG = [
  // --- 一般 / 寫真 / 活動 / 其他 ---
  { id: 'gen_single', name: '一般單妝容', price: 1500, type: 'female', category: 'standard' },
  { id: 'gen_full', name: '一般妝髮方案', price: 2000, type: 'female', category: 'standard' },
  { id: 'exq_single', name: '精緻單妝容', price: 2000, type: 'female', category: 'standard' },
  { id: 'exq_full', name: '精緻妝髮方案', price: 2500, type: 'female', category: 'standard' },
  { id: 'men_std', name: '男士妝髮', price: 1500, type: 'male', category: 'standard' },

  // --- 結婚登記專屬 ---
  { id: 'bride_reg', name: '新娘登記妝髮', price: 2800, type: 'female', category: 'registration' },
  { id: 'bride_pro', name: '新娘登記妝髮pro', price: 3200, type: 'female', category: 'registration' },
  { id: 'groom', name: '新郎妝髮', price: 1500, type: 'male', category: 'registration' },
  { id: 'family', name: '親友妝容', price: 2000, type: 'female', category: 'registration' },
];

// --- 🆕 2. 用途分類定義 ---
const USAGE_TYPES = [
  { id: 'date_id', label: '約會 / 證件形象照', mode: 'standard' },
  { id: 'photo', label: '攝影寫真', mode: 'standard' },
  { id: 'concert', label: '演唱會 / 應援', mode: 'standard' },
  { id: 'performance', label: '表演 / 發表會', mode: 'standard' },
  { id: 'registration', label: '結婚登記', mode: 'registration' },
  { id: 'wedding', label: '婚禮 / 新娘秘書', mode: 'quote_only' },
  { id: 'other', label: '其他 (請說明)', mode: 'standard_with_input' },
];

// --- ⚠️⚠️⚠️ Firebase Config (請保持您原本的設定) ---
const firebaseConfig = {
    apiKey: "AIzaSyDUOtmKL_DDuLyefiDwwxVtlTeK1PwDEno",
    authDomain: "harpersmakeup-ee883.firebaseapp.com",
    projectId: "harpersmakeup-ee883",
    storageBucket: "harpersmakeup-ee883.firebasestorage.app",
    messagingSenderId: "550619624604",
    appId: "1:550619624604:web:a9d85309bc09206eac2959",
    measurementId: "G-BDMNM2P3BN"
  };

const isFirebaseReady = Object.keys(firebaseConfig).length > 0;
let app, auth, db;

if (isFirebaseReady) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("⚠️ Firebase Config 未設定，目前為展示模式");
}

const HarpersMakeup = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  // 樣式注入
  // ✨ 自動美化特效：注入樣式與字體 (修正版：防止醜醜畫面閃爍) ✨
  useEffect(() => {
    // 1. 載入 Google Fonts
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const link = document.createElement("link");
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    // 2. 注入韓系質感 CSS
    const styleId = "harper-custom-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        body {
          font-family: 'Noto Sans TC', sans-serif;
          background-color: #fdfbf7;
          background-image: radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), 
                            radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, transparent 50%), 
                            radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, transparent 50%);
          background-attachment: fixed;
          margin: 0; /* 確保沒有預設邊距 */
        }
        .font-serif { font-family: 'Playfair Display', serif; }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
      `;
      document.head.appendChild(style);
    }

    // 3. 載入 Tailwind CSS 並監聽載入完成
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      // 重點：等 Tailwind 載入完，才顯示畫面
      script.onload = () => {
        setTimeout(() => setIsStyleLoaded(true), 100); //稍微延遲讓樣式生效
      };
      document.head.appendChild(script);
    } else {
      // 如果已經載入過（開發環境重整時），直接顯示
      setIsStyleLoaded(true);
    }

    // Firebase 初始化邏輯保持原本的
    if (isFirebaseReady) {
      signInAnonymously(auth)
        .then(() => console.log("Guest Login"))
        .catch(console.error);
      onAuthStateChanged(auth, setUser);
    } else {
      setUser({ uid: "demo-user" });
    }
  }, []);// ⛔️ 防止閃爍：如果樣式還沒好，顯示全白 Loading 畫面
if (!isStyleLoaded) {
  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "#fdfbf7",
      color: "#8c8680",
      fontFamily: "serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>Harper's</h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>Loading...</p>
      </div>
    </div>
  );
}

  if (isAdminMode) return <AdminDashboard onExit={() => setIsAdminMode(false)} isReady={isFirebaseReady} db={db} />;

  return (
    <div className="pb-24 min-h-screen relative font-sans text-stone-600">
      <nav className="sticky top-0 z-40 glass-card px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-serif font-bold tracking-widest text-[#8c8680] cursor-pointer" onClick={() => setActiveTab("home")}>Harper's</h1>
        <button onClick={() => setIsAdminMode(true)}><Lock size={16} className="text-stone-300 hover:text-[#8c8680]" /></button>
      </nav>

      <main className="px-5 pt-6 animate-fade-in max-w-md mx-auto">
        {activeTab === "home" && <HomeSection onChangeTab={setActiveTab} />}
        {activeTab === "services" && <ServiceSection />}
        {activeTab === "pricing" && <PriceSection />}
        {activeTab === "faq" && <FaqSection />}
        {activeTab === "rules" && <RulesSection />}
        {activeTab === "booking" && <BookingForm onSubmit={handleBookingSubmit} isSubmitting={isSubmitting} />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 pb-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-between items-end text-[10px] font-medium text-stone-400 max-w-md mx-auto">
          <NavBtn icon={Star} label="介紹" active={activeTab === "services"} onClick={() => setActiveTab("services")} />
          <NavBtn icon={Info} label="價目" active={activeTab === "pricing"} onClick={() => setActiveTab("pricing")} />
          <div className="relative -top-5">
            <button onClick={() => setActiveTab("booking")} className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transform transition-transform active:scale-95 ${activeTab === "booking" ? "bg-[#756f6a] ring-4 ring-[#e6e2dc]" : "bg-[#8c8680]"}`}>
              <Calendar className="text-white w-6 h-6" />
            </button>
          </div>
          <NavBtn icon={CheckCircle} label="須知" active={activeTab === "rules"} onClick={() => setActiveTab("rules")} />
          <NavBtn icon={MessageCircle} label="QA" active={activeTab === "faq"} onClick={() => setActiveTab("faq")} />
        </div>
      </div>

      {showModal && bookingData && <SuccessModal data={bookingData} onClose={() => { setShowModal(false); setActiveTab("home"); }} />}
    </div>
  );
};

// --- 子組件 ---
const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-[#8c8680]" : "hover:text-stone-500"}`}>
    <Icon size={20} className={active ? "opacity-50" : ""} />
    <span>{label}</span>
  </button>
);

const HomeSection = ({ onChangeTab }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8">
    <div className="relative">
      <div className="w-40 h-40 rounded-full border border-[#e6e2dc] flex items-center justify-center relative z-10 bg-gradient-to-br from-white to-[#f2f0eb] shadow-inner">
        <span className="font-serif text-6xl text-[#8c8680] italic">H</span>
      </div>
      <div className="absolute inset-0 bg-[#e6e2dc] rounded-full blur-2xl opacity-40 animate-pulse"></div>
    </div>
    <div className="space-y-3">
      <h2 className="text-3xl font-serif tracking-[0.2em] text-[#5e5a56]">Harper's</h2>
      <div className="h-px w-12 bg-[#8c8680] mx-auto opacity-30"></div>
      <p className="text-sm text-[#a8a4a0] tracking-widest font-serif italic">Clean beauty, just for you</p>
    </div>
    <button onClick={() => onChangeTab("booking")} className="px-10 py-4 rounded-full bg-[#8c8680] text-white tracking-[0.2em] text-xs font-bold shadow-lg shadow-[#8c8680]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      立即預約
    </button>
  </div>
);

const ServiceSection = () => (
  <div className="space-y-6 pb-20">
    <SectionHeader title="About Harper" subtitle="服務介紹" />
    <div className="glass-card p-8 rounded-[2rem] text-center space-y-6 shadow-sm">
      <div className="w-24 h-24 mx-auto rounded-full bg-[#fcfbf9] border border-[#e6e2dc] flex items-center justify-center shadow-inner">
        <User size={32} className="text-[#d4cfc9]" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#5e5a56] mb-3 font-serif">彩妝師 Harper</h3>
        <p className="text-[#8c8680] text-sm leading-loose text-justify tracking-wide font-light">
          我是彩妝師 Harper，擅長日韓系乾淨質感妝容，依照個人五官比例、膚況與活動需求，打造適合你的妝容。<br /><br />
          不論是日常、拍攝、活動，或婚禮與結婚登記，我都會用專業與細心，陪你完成每一個重要時刻。
        </p>
      </div>
    </div>
  </div>
);

const PriceSection = () => (
  <div className="space-y-8 pb-20">
    <SectionHeader title="Price List" subtitle="服務價目表" />
    <div className="space-y-4">
      <CategoryHeader title="DAILY & EVENTS" />
      <PriceCard title="一般妝髮方案" price="2,000" desc="以自然乾淨的妝感為主。適用於日常聚會、證件照、面試等場合。" warning="不包含假睫毛與飾品" />
      <PriceCard title="精緻妝髮方案" price="2,500" desc="加強整體妝容細緻度，妝感更完整。適用於寫真拍攝、活動表演等。" highlight />
      <PriceCard title="男士妝髮" price="1,500" desc="基礎底妝、眉型修整、髮型吹整" />
    </div>
    <div className="space-y-4 pt-4">
      <CategoryHeader title="WEDDING SERIES" />
      <div className="relative p-6 rounded-2xl bg-white border border-[#e6e2dc] shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-20"><Diamond size={48} className="text-[#8c8680]" /></div>
        <h3 className="text-lg font-medium text-[#5e5a56] mb-4 font-serif">登記方案Marriage Registration</h3>
        <div className="space-y-4">
          
          {/* 新娘登記妝髮 - 含備註 */}
          <PriceRow 
            label="新娘登記妝髮" 
            price="2,800" 
            desc={`＊穩定、自然、符合登記需求的專業妝髮服務\n＊髮型以基礎髮型為主（不含複雜編髮與妝面飾品）`}
          />
          
          {/* 新娘登記妝髮 Pro - 含備註 */}
          <PriceRow 
            label="新娘登記妝髮 Pro" 
            price="3,200" 
            desc={`＊針對拍攝、上鏡與重要紀錄需求所設計的進階方案\n＊髮型可依造型需求設計複雜編髮，整體完成度更高\n＊可搭配造型飾品`}
          />

          <PriceRow label="新郎妝髮" price="1,500" />
          <PriceRow label="親友妝容" price="2,000" />
        </div>
      </div>
      <div className="p-5 rounded-2xl border border-dashed border-[#d4cfc9] text-center bg-[#fcfbf9]">
        <h3 className="text-sm font-medium text-[#5e5a56] flex items-center justify-center gap-2 mb-1"><Sparkles size={16} /> 婚禮 / 新秘服務</h3>
        <p className="text-xs text-[#a8a4a0]">請填寫預約單，將依需求另行報價</p>
      </div>
    </div>
  </div>
);
const FaqSection = () => {
  const [idx, setIdx] = useState(null);
  const faqs = [
    { q: "一般妝髮和精緻妝髮差在哪？", a: "主要差在細節與完整度。一般適合日常/證件照；精緻適合拍攝/重要活動，且包含假睫毛與飾品貼鑽服務。" },
    { q: "婚禮／登記可以選一般方案嗎？", a: "不建議。重要場合對持妝度與精緻度要求較高，請選擇專屬的登記或新秘方案。" },
    { q: "訂金是多少？", a: "每位 NT$500。付款確認後才會保留時段。" },
    { q: "到府梳化費用？", a: "依地點與時段另行報價車馬費。" },
  ];
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Q & A" subtitle="常見問題" />
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#e6e2dc] overflow-hidden">
            <button onClick={() => setIdx(idx === i ? null : i)} className="w-full px-6 py-4 text-left flex justify-between items-center group">
              <span className="text-sm font-medium text-[#5e5a56] pr-4">{f.q}</span>
              {idx === i ? <ChevronUp size={16} className="text-[#8c8680]" /> : <ChevronDown size={16} className="text-[#d4cfc9]" />}
            </button>
            {idx === i && <div className="px-6 pb-6 pt-0 text-xs text-[#8c8680] leading-relaxed whitespace-pre-wrap"><div className="h-px w-full bg-[#fcfbf9] mb-3"></div>{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const RulesSection = () => (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Notice" subtitle="預約須知" />
      <div className="bg-white p-6 rounded-2xl border border-[#e6e2dc] shadow-sm space-y-4">
          <p className="text-xs text-[#8c8680] leading-loose">
              1. 預約需經 Harper 確認檔期並支付訂金後才算成立。<br/>
              2. 訂金為每位 NT$500，取消或未到恕不退還。<br/>
              3. 請準時抵達，遲到將影響妝髮完整度。<br/>
              4. 合作工作室依當日空檔安排，實際地點以確認回覆為準。
          </p>
      </div>
    </div>
);

// --- 核心組件：BookingForm (大幅更新) ---
const BookingForm = ({ onSubmit, isSubmitting }) => {
  const [data, setData] = useState({
    name: "", phone: "", instagram: "",
    usageType: "", // 存放 id (例如 'registration', 'concert')
    customUsage: "", // 若選其他，手動輸入的內容
    quantities: {}, // { 'bride_reg': 1, 'groom': 1 }
    dates: ["", "", ""], timeSlots: [], finishTimeH: "09", finishTimeM: "00",
    city: "", locationType: "", followUp: "", notes: "",
    agreement1: false, agreement2: false, agreement3: false,
  });

  // 取得目前選擇的用途模式
  const currentMode = useMemo(() => {
    const type = USAGE_TYPES.find(u => u.id === data.usageType);
    return type ? type.mode : null;
  }, [data.usageType]);

  // 根據用途模式篩選要顯示的方案
  const displayedServices = useMemo(() => {
    if (!currentMode) return [];
    if (currentMode === 'registration') {
        return SERVICE_CATALOG.filter(s => s.category === 'registration');
    }
    if (currentMode === 'standard' || currentMode === 'standard_with_input') {
        return SERVICE_CATALOG.filter(s => s.category === 'standard');
    }
    // quote_only (wedding) 不顯示方案選擇
    return [];
  }, [currentMode]);

  // 計算人數與金額
  const stats = useMemo(() => {
    let female = 0, male = 0, basePrice = 0;
    let quoteItems = []; // 需另行報價的項目

    // 1. 計算方案基礎價
    Object.entries(data.quantities).forEach(([sid, count]) => {
        const svc = SERVICE_CATALOG.find(s => s.id === sid);
        if (svc) {
            if (svc.type === 'female') female += count;
            if (svc.type === 'male') male += count;
            basePrice += svc.price * count;
        }
    });

    // 2. 判斷是否需要報價 (Quote Trigger)
    let isQuoteNeeded = false;
    
    // (A) 用途是婚禮
    if (data.usageType === 'wedding') {
        isQuoteNeeded = true;
        quoteItems.push("婚禮/新秘服務");
    }
    // (B) 用途是其他
    if (data.usageType === 'other') {
        isQuoteNeeded = true;
        quoteItems.push("特殊需求");
    }
    // (C) 地點費用
    if (data.city === '高雄' && data.locationType.includes('工作室')) basePrice += 300;
    if (data.city === '台南' && data.locationType.includes('工作室')) basePrice += 300;
    
    if (data.locationType.includes('報價') || data.locationType.includes('到府')) {
        isQuoteNeeded = true;
        quoteItems.push("車馬費/場地費");
    }
    // (D) 跟妝
    if (data.followUp.includes('需要') || data.followUp.includes('評估')) {
        // 跟妝通常也需要確認時數後報價，或加收固定費，這裡先標示為需確認
        // 如果是固定費可以直接加，但提示文案說 "依時數...另行報價"
        // 這裡假設若選了跟妝，就顯示 "起"
        if (data.followUp.includes('需要')) basePrice += 0; // 暫不加固定費，改由 "起" 涵蓋
        isQuoteNeeded = true;
        quoteItems.push("跟妝服務");
    }
    // (E) 早妝
    if (data.timeSlots.includes("凌晨 (07:00前)")) {
        quoteItems.push("早妝鐘點費");
        isQuoteNeeded = true; 
    }

    return { 
        female, male, total: female + male, 
        basePrice, isQuoteNeeded, quoteItems 
    };
  }, [data]);

  // Handler: 變更用途
  const handleUsageChange = (e) => {
    const newType = e.target.value;
    setData(p => ({ 
        ...p, 
        usageType: newType, 
        quantities: {}, // 清空已選方案
        customUsage: newType === 'other' ? '' : '' 
    }));
  };

  // Handler: 變更數量
  const handleQtyChange = (id, delta) => {
    setData(prev => {
        const curr = prev.quantities[id] || 0;
        const next = Math.max(0, curr + delta);
        const newQtys = { ...prev.quantities };
        if (next === 0) delete newQtys[id];
        else newQtys[id] = next;
        return { ...prev, quantities: newQtys };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.name || !data.phone || !data.instagram || !data.dates[0] || !data.usageType) return alert("請填寫完整資訊");
    
    // 檢查是否有選方案 (除了純報價的婚禮外)
    if (data.usageType !== 'wedding' && stats.total === 0) return alert("請至少選擇一位梳化人數");
    if (data.usageType === 'other' && !data.customUsage) return alert("請填寫您的需求說明");
    if (!data.agreement1) return alert("請確認並勾選同意事項");

    // 準備資料
    const serviceListStr = Object.entries(data.quantities).map(([id, n]) => {
        const s = SERVICE_CATALOG.find(x => x.id === id);
        return `${s.name} x${n}`;
    }).join(", ");

    const usageLabel = USAGE_TYPES.find(u => u.id === data.usageType)?.label;
    const finalPurpose = data.usageType === 'other' ? `其他: ${data.customUsage}` : usageLabel;

    onSubmit({
        ...data,
        purpose: finalPurpose,
        peopleCountFemale: stats.female,
        peopleCountMale: stats.male,
        serviceType: serviceListStr || "待報價項目",
        estimatedPrice: stats.basePrice,
        isQuoteRequired: stats.isQuoteNeeded
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Reservation" subtitle="立即預約" />
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#e6e2dc] space-y-6">
        
        {/* 1. 基本資料 */}
        <div className="grid grid-cols-2 gap-3">
          <InputBox icon={User} label="姓名" required value={data.name} onChange={v => setData({...data, name: v})} ph="姓名" />
          <InputBox icon={Send} label="電話" required value={data.phone} onChange={v => setData({...data, phone: v})} ph="手機" />
        </div>
        <InputBox icon={Instagram} label="Instagram" required value={data.instagram} onChange={v => setData({...data, instagram: v})} ph="@您的ID" />

        {/* 2. 用途選擇 (下拉選單) */}
        <div className="space-y-3 animate-fade-in">
             <Label icon={Heart} text="本次梳化活動用途" />
             <div className="relative">
                 <select 
                    value={data.usageType} 
                    onChange={handleUsageChange}
                    className="w-full p-4 rounded-xl border border-[#e6e2dc] bg-[#faf9f6] text-sm text-[#5e5a56] outline-none appearance-none font-medium"
                 >
                     <option value="" disabled>請選擇用途</option>
                     {USAGE_TYPES.map(t => (
                         <option key={t.id} value={t.id}>{t.label}</option>
                     ))}
                 </select>
                 <ChevronDown size={16} className="absolute right-4 top-4 text-[#a8a4a0] pointer-events-none" />
             </div>

             {/* 若選擇「其他」，跳出輸入框 */}
             {data.usageType === 'other' && (
                 <input 
                    type="text" 
                    placeholder="請說明您的活動需求..." 
                    value={data.customUsage}
                    onChange={e => setData({...data, customUsage: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#d4cfc9] bg-white text-sm outline-none focus:border-[#8c8680] animate-fade-in"
                 />
             )}
        </div>

        {/* 3. 方案列表與計數器 */}
        {displayedServices.length > 0 && (
            <div className="space-y-2 animate-fade-in">
                <Label icon={Sparkles} text="選擇方案與人數" />
                {displayedServices.map(svc => {
                    const count = data.quantities[svc.id] || 0;
                    return (
                        <div key={svc.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${count > 0 ? "bg-[#fcfbf9] border-[#8c8680]" : "border-[#f2f0eb]"}`}>
                            <div>
                                <div className="text-sm font-medium text-[#5e5a56]">{svc.name}</div>
                                <div className="text-xs text-[#a8a4a0]">NT$ {svc.price.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => handleQtyChange(svc.id, -1)} disabled={count===0} className="w-8 h-8 rounded-lg bg-white border border-[#e6e2dc] text-[#8c8680] disabled:opacity-30 flex items-center justify-center">-</button>
                                <span className="w-4 text-center font-bold text-[#5e5a56]">{count}</span>
                                <button type="button" onClick={() => handleQtyChange(svc.id, 1)} className="w-8 h-8 rounded-lg bg-white border border-[#e6e2dc] text-[#8c8680] flex items-center justify-center">+</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* 4. 特殊狀態顯示：婚禮報價卡 */}
        {data.usageType === 'wedding' && (
            <div className="bg-[#fcfbf9] border border-dashed border-[#d4cfc9] p-6 rounded-xl text-center space-y-2 animate-fade-in">
                <Diamond className="w-8 h-8 text-[#8c8680] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#5e5a56]">婚禮 / 新秘服務</h3>
                <p className="text-xs text-[#a8a4a0]">將依需求與細節另行報價</p>
            </div>
        )}

        {/* 5. 人數統計與多人提醒 */}
        {(stats.total > 0 || data.usageType === 'wedding') && (
             <div className="space-y-3 animate-fade-in">
                 <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#e6e2dc] flex justify-between items-center text-sm text-[#5e5a56]">
                    <span className="font-bold text-[#8c8680]">總梳化人數</span>
                    <div className="font-medium">
                        女 {stats.female} 位｜男 {stats.male} 位 <span className="text-[#a8a4a0] text-xs">(共 {stats.total} 位)</span>
                    </div>
                 </div>

                 {stats.total >= 3 && (
                     <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
                         <AlertCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                         <div className="text-xs text-orange-800 leading-relaxed">
                             <span className="font-bold">提醒 🤍</span><br/>
                             已偵測到您本次梳化人數較多，請確認每位的方案人數是否填寫正確。<br/>
                             送出後 Harper 會再依日期、地點與工作室空檔協助確認安排與最終費用。
                         </div>
                     </div>
                 )}
             </div>
        )}

{/* 6. 日期與時段 */}
<div className="space-y-4 pt-2">
          <Label icon={Calendar} text="日期與時段" />
          
          {/* 日期選擇 */}
          <input 
            type="date" 
            required 
            value={data.dates[0]} 
            onChange={e => { const d=[...data.dates]; d[0]=e.target.value; setData({...data, dates: d})}} 
            className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none" 
          />

          {/* 時段選擇區塊 */}
          <div className="space-y-2">
              <Label icon={Clock} text="可梳化時段（可複選）" />
              <div className="flex flex-wrap gap-2">
                {["凌晨 (07:00前)", "早上 (07:00-12:00)", "下午 (12:00-17:00)", "傍晚 (17:00-19:00)"].map(t => (
                  <SelectBadge key={t} active={data.timeSlots.includes(t)} onClick={() => {
                      const curr = data.timeSlots;
                      setData({...data, timeSlots: curr.includes(t) ? curr.filter(x=>x!==t) : [...curr, t]});
                  }}>{t}</SelectBadge>
                ))}
              </div>

              {/* 🆕 新增：凌晨加價提醒 (有選才會出現) */}
              {data.timeSlots.includes("凌晨 (07:00前)") && (
                  <div className="mt-1 text-[11px] text-orange-800 bg-orange-50 border border-orange-100 p-3 rounded-xl animate-fade-in flex items-start gap-2">
                      <span className="text-base mt-[-2px]">💡</span>
                      <span>已選擇凌晨開妝時段，將另收 每小時 NT$700 鐘點費。</span>
                  </div>
              )}
          </div>

          {/* 最晚完妝時間 */}
          <div className="bg-[#faf9f6] p-3 rounded-xl flex items-center justify-between border border-[#e6e2dc]">
            <span className="text-xs text-[#8c8680] font-bold pl-1">最晚完妝時間</span>
            <div className="flex items-center gap-1">
              <select value={data.finishTimeH} onChange={e=>setData({...data, finishTimeH:e.target.value})} className="bg-transparent font-serif text-lg outline-none">{[...Array(24).keys()].map(i=><option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}</select>
              <span>:</span>
              <select value={data.finishTimeM} onChange={e=>setData({...data, finishTimeM:e.target.value})} className="bg-transparent font-serif text-lg outline-none"><option value="00">00</option><option value="30">30</option></select>
            </div>
          </div>
        </div>
        {/* 7. 地點與跟妝 */}
        <div className="space-y-3 pt-2">
           <Label icon={MapPin} text="地點與場地" />
           <div className="grid grid-cols-3 gap-2">
               <SelectBadge active={data.city==='高雄'} onClick={()=>setData({...data, city:'高雄', locationType:''})}>高雄</SelectBadge>
               <SelectBadge active={data.city==='台南'} onClick={()=>setData({...data, city:'台南', locationType:''})}>台南</SelectBadge>
               <SelectBadge active={data.city==='其他'} onClick={()=>setData({...data, city:'其他', locationType:''})}>其他縣市</SelectBadge>
           </div>
           {data.city && (
               <div className="space-y-2 animate-fade-in pt-1">
                   {data.city === '高雄' && <RadioBox checked={data.locationType.includes('工作室')} onClick={()=>setData({...data, locationType:'合作工作室｜巨蛋站 (場地費$300)'})} title="合作工作室｜巨蛋站" subtitle="場地費 $300" />}
                   {data.city === '台南' && <RadioBox checked={data.locationType.includes('工作室')} onClick={()=>setData({...data, locationType:'合作工作室｜大同路 (場地費$300)'})} title="合作工作室｜大同路" subtitle="場地費 $300" />}
                   <RadioBox checked={data.locationType.includes('到府')} onClick={()=>setData({...data, locationType:'到府服務 (報價)'})} title="到府服務" subtitle="車馬費另計" />
                   <RadioBox checked={data.locationType.includes('協助找')} onClick={()=>setData({...data, locationType:'協助找開妝點 (報價)'})} title="協助找開妝點" subtitle="場地/車馬費另計" />
               </div>
           )}
        </div>

        <div className="space-y-3">
             <Label icon={Users} text="跟妝需求" />
             {["不需要", "需要-另行報價($700/hr)", "不確定，請Harper協助評估"].map(o => (
                 <RadioBox key={o} checked={data.followUp === o} onClick={()=>setData({...data, followUp: o})} title={o} />
             ))}
        </div>
        
        <textarea value={data.notes} onChange={e=>setData({...data, notes:e.target.value})} className="w-full p-3 rounded-xl border border-[#e6e2dc] bg-[#faf9f6] text-sm outline-none resize-none" rows="2" placeholder="備註（非必填）..." />

{/* 8. 價格估算卡 (Dynamic Price Card) - 已更換為品牌色 */}
<div className="bg-[#8c8680] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={60} /></div>
             
             <div className="relative z-10">
                 <div className="text-[10px] font-bold tracking-widest text-[#e6e2dc] uppercase mb-1">Estimated Price 價格估算</div>
                 <div className="flex items-baseline gap-2 mb-2">
                     <span className="text-3xl font-serif font-medium text-white">
                         NT$ {stats.basePrice.toLocaleString()} 
                         {stats.isQuoteNeeded && <span className="text-sm font-sans ml-1 opacity-80">起</span>}
                     </span>
                 </div>
                 
                 {/* 顯示已選項目摘要 */}
                 <div className="text-xs space-y-1 mb-2 text-[#f2f0eb] opacity-90">
                     {Object.entries(data.quantities).map(([id, n]) => {
                         const s = SERVICE_CATALOG.find(x => x.id === id);
                         return s ? <div key={id}>• {s.name} x{n}</div> : null;
                     })}
                     {data.locationType.includes('工作室') && <div>• 工作室場地費</div>}
                 </div>

                 {/* 另行報價提示 */}
                 {stats.isQuoteNeeded && (
                     <div className="border-t border-white/20 pt-2 mt-2">
                         <div className="text-[10px] text-[#e6e2dc] mb-1">其他需求將於確認後另行報價：</div>
                         <div className="flex flex-wrap gap-2">
                             {stats.quoteItems.map(item => (
                                 <span key={item} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded border border-white/10">{item}</span>
                             ))}
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* 這裡保留您想要的：緊貼上方的說明文字 */}
        <div className="mt-2 text-[10px] text-[#a8a4a0] text-center leading-relaxed px-2">
            *以上為基本報價，實際費用將依人數、性質、地點與車馬費等調整，以 Harper 回覆為準。
        </div>

              {/* 9. 底部聲明與按鈕 */}
        <div className="space-y-3 pt-2">
        
            <div className="bg-stone-100 p-4 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-[#5e5a56]">預約流程說明</h4>
          <div className="text-xs text-[#78716c] leading-relaxed space-y-2">
            <p className="font-bold text-[#57534e]">
              本表單為「預約需求填寫」，非最終報價與預約成立。
            </p>
            <p>
              Harper
              將依您填寫的服務內容、日期、地點及合作工作室空檔狀況，回覆是否可約與最終費用。
            </p>
            <p>
              預約需以 Harper 回覆確認並完成訂金後，才算正式成立並保留時段。
            </p>
            <p>送出前也請再次確認填寫資料正確，以避免影響排程與報價。</p>
          </div>{" "}
          <Label icon={Smile} text="同意條款勾選" />
          <CheckBox
            checked={data.agreement1}
            onClick={(e) => handleChange("agreement1", e.target.checked)}
            text="送出表單不代表預約成立，需回覆確認。"
          />
          <CheckBox
            checked={data.agreement2}
            onClick={(e) => handleChange("agreement2", e.target.checked)}
            text="我已詳細閱讀「預約須知」並同意。"
          />
          <CheckBox
            checked={data.agreement3}
            onClick={(e) => handleChange("agreement3", e.target.checked)}
            text="確認資料無誤。"
          />
        </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-full bg-[#8c8680] text-white font-medium tracking-[0.1em] shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? "傳送中..." : <>送出預約申請 <Send size={16} /></>}
            </button>
        </div>
      </form>
    </div>
  );
};

// --- Modal, Admin, Helper Components (保持原本風格) ---
const SuccessModal = ({ data, onClose }) => {
  const copyText = `📋 Harper’s makeup｜預約申請\n\n姓名：${data.name}\n電話：${data.phone}\nIG：${data.instagram}\n\n用途：${data.purpose}\n內容：${data.serviceType}\n人數：女${data.peopleCountFemale} / 男${data.peopleCountMale}\n\n日期：${data.dates[0]}\n地點：${data.city} ${data.locationType}\n時間：${data.timeSlots.join('/')}\n完妝：${data.finishTimeH}:${data.finishTimeM}\n跟妝：${data.followUp}\n備註：${data.notes||'無'}\n\n估價：$${data.estimatedPrice}${data.isQuoteRequired ? ' 起 (含另行報價項目)' : ''}\n\n—\n麻煩幫我確認檔期與費用，謝謝！`;
  
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-5 glass-card">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#f2f0eb] rounded-full flex items-center justify-center mx-auto mb-3"><MessageCircle className="text-[#8c8680] w-6 h-6" /></div>
          <h3 className="text-lg font-bold text-[#5e5a56]">預約申請已建立</h3>
          <p className="text-xs text-[#a8a4a0] leading-relaxed">請複製下方資料並 <span className="text-[#8c8680] font-bold underline">私訊傳送給 Harper</span><br/>確認檔期後才算完成喔！</p>
        </div>
        <div className="bg-[#faf9f6] p-4 rounded-xl text-[10px] text-[#5e5a56] leading-relaxed whitespace-pre-wrap font-mono border border-[#e6e2dc] max-h-40 overflow-y-auto">{copyText}</div>
        <button onClick={()=>{navigator.clipboard.writeText(copyText); alert("已複製！");}} className="w-full py-3 rounded-xl bg-[#8c8680] text-white text-sm font-medium shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"><Copy className="w-4 h-4" /> 一鍵複製</button>
        <button onClick={onClose} className="w-full text-xs text-[#a8a4a0] py-2">關閉視窗</button>
      </div>
    </div>
  );
};

// Admin Dashboard (簡化版，邏輯不變)
// Admin Dashboard (完整詳細版)
const AdminDashboard = ({ onExit, isReady, db }) => {
  const [data, setData] = useState([]);
  const [pass, setPass] = useState("");
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    if (!auth || !isReady) return;
    const q = query(
      collection(db, "public_appointments"),
      orderBy("createdAt", "desc")
    );
    onSnapshot(q, (ss) =>
      setData(ss.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [auth, isReady]);

  const deleteItem = async (id) => {
    if (window.confirm("確定要刪除這筆預約嗎？刪除後無法復原喔！"))
      await deleteDoc(doc(db, "public_appointments", id));
  };

  if (!isReady)
    return (
      <div className="h-screen flex items-center justify-center text-xs text-red-400">
        尚未設定資料庫
      </div>
    );

  // 登入畫面
  if (!auth)
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="w-16 h-16 bg-[#faf9f6] rounded-full flex items-center justify-center border border-[#e6e2dc]">
          <Lock className="w-6 h-6 text-[#8c8680]" />
        </div>
        <h3 className="text-lg font-bold text-[#5e5a56]">Harper's Backend</h3>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="p-3 text-center border border-[#e6e2dc] rounded-xl outline-none focus:border-[#8c8680] bg-[#faf9f6] w-64"
          placeholder="請輸入管理密碼"
        />
        <button
          onClick={() =>
            pass === "harper1132001" ? setAuth(true) : alert("密碼錯誤")
          }
          className="bg-[#8c8680] text-white px-8 py-3 rounded-xl font-bold shadow-md active:scale-95 transition-all"
        >
          登入系統
        </button>
        <button
          onClick={onExit}
          className="text-xs text-[#a8a4a0] hover:text-[#5e5a56]"
        >
          回前台首頁
        </button>
      </div>
    );

  // 登入後的詳細清單
  return (
    <div className="max-w-xl mx-auto pb-24 pt-10 px-5 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#5e5a56]">預約管理</h2>
          <p className="text-xs text-[#a8a4a0] mt-1">
            目前共有 <span className="font-bold text-[#8c8680]">{data.length}</span> 筆資料
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-xs bg-white border border-[#e6e2dc] text-[#5e5a56] px-4 py-2 rounded-full shadow-sm hover:bg-[#faf9f6]"
        >
          登出
        </button>
      </div>

      <div className="space-y-6">
        {data.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-[2rem] border border-[#e6e2dc] shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            {/* 刪除按鈕 */}
            <button
              onClick={() => deleteItem(item.id)}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-400 p-2 z-10"
            >
              <Trash2 size={18} />
            </button>

            {/* 1. 客戶基本資料區 */}
            <div className="border-b border-[#f2f0eb] pb-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-[#8c8680] text-white px-2 py-0.5 rounded">
                  {item.purpose || "未分類"}
                </span>
                <span className="text-[10px] text-[#a8a4a0]">
                  填單時間：
                  {item.createdAt?.toDate
                    ? new Date(item.createdAt.toDate()).toLocaleString()
                    : "剛剛"}
                </span>
              </div>
              <div className="text-xl font-bold text-[#5e5a56] flex items-center gap-2">
                {item.name}
                <span className="text-sm font-normal text-[#a8a4a0]">
                  {item.phone}
                </span>
              </div>
              {/* IG 連結 */}
              <a
                href={`https://instagram.com/${item.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
              >
                <Instagram size={12} /> {item.instagram}
              </a>
            </div>

            {/* 2. 關鍵資訊 Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 日期與時間 */}
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#f2f0eb]">
                <div className="text-[10px] font-bold text-[#a8a4a0] mb-1 flex items-center gap-1">
                  <Calendar size={10} /> DATES
                </div>
                <div className="text-sm font-bold text-[#5e5a56]">
                  {item.dates[0]} <span className="text-[10px] font-normal text-red-400">(首選)</span>
                </div>
                {(item.dates[1] || item.dates[2]) && (
                  <div className="text-[10px] text-[#8c8680] mt-1 border-t border-[#e6e2dc] pt-1">
                    候: {item.dates[1]} {item.dates[2] ? `、${item.dates[2]}` : ""}
                  </div>
                )}
              </div>

              {/* 人數與價格 */}
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#f2f0eb]">
                <div className="text-[10px] font-bold text-[#a8a4a0] mb-1 flex items-center gap-1">
                  <Users size={10} /> STATS
                </div>
                <div className="text-sm font-bold text-[#5e5a56]">
                  女{item.peopleCountFemale} / 男{item.peopleCountMale}
                </div>
                <div className="text-[10px] text-[#8c8680] mt-1 border-t border-[#e6e2dc] pt-1 font-bold">
                  估: ${item.estimatedPrice?.toLocaleString()}
                  {item.isQuoteRequired && " 起"}
                </div>
              </div>
            </div>

            {/* 3. 詳細服務內容清單 */}
            <div className="space-y-3 text-xs text-[#5e5a56]">
              {/* 服務項目 */}
              <div className="flex gap-2">
                <span className="font-bold text-[#8c8680] min-w-[3em]">方案：</span>
                <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 leading-relaxed">
                  {item.serviceType}
                </span>
              </div>

              {/* 地點詳情 */}
              <div className="flex gap-2">
                <span className="font-bold text-[#8c8680] min-w-[3em]">地點：</span>
                <span>
                  {item.city} - {item.locationType}
                </span>
              </div>

              {/* 時間詳情 */}
              <div className="flex gap-2">
                <span className="font-bold text-[#8c8680] min-w-[3em]">時段：</span>
                <div className="flex flex-col gap-1">
                    <span>{item.timeSlots?.join("、")}</span>
                    {item.timeSlots?.includes("凌晨 (07:00前)") && (
                        <span className="text-orange-600 font-bold bg-orange-50 px-1 rounded inline-block w-fit">⚠️ 包含凌晨時段</span>
                    )}
                </div>
              </div>

              {/* 完妝與跟妝 */}
              <div className="flex gap-2">
                <span className="font-bold text-[#8c8680] min-w-[3em]">細節：</span>
                <span>
                  最晚 <span className="font-bold">{item.finishTimeH}:{item.finishTimeM}</span> 完妝
                  ｜ 跟妝：<span className={item.followUp?.includes("不需要") ? "" : "text-pink-600 font-bold"}>{item.followUp}</span>
                </span>
              </div>
            </div>

            {/* 4. 備註區塊 (有寫才顯示) */}
            {item.notes && (
              <div className="mt-4 bg-orange-50 p-3 rounded-xl border border-orange-100 text-xs text-[#8c6b5d] leading-relaxed">
                <span className="font-bold mb-1 block">📝 客人備註：</span>
                {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
const SectionHeader = ({ title, subtitle }) => <div className="text-center mb-6"><h4 className="text-[10px] font-bold tracking-[0.2em] text-[#d4cfc9] uppercase mb-1">{title}</h4><h2 className="text-xl font-serif font-medium text-[#5e5a56] tracking-wide">{subtitle}</h2></div>;
const CategoryHeader = ({ title }) => <div className="flex items-center gap-4 px-2"><span className="h-px flex-1 bg-[#e6e2dc]"></span><span className="text-[10px] font-bold text-[#a8a4a0] tracking-[0.2em]">{title}</span><span className="h-px flex-1 bg-[#e6e2dc]"></span></div>;
const PriceCard = ({ title, price, desc, highlight, warning }) => <div className={`relative p-5 rounded-2xl border transition-all ${highlight ? "bg-white border-[#d4cfc9] shadow-sm" : "bg-white/50 border-transparent hover:bg-white"}`}>{highlight && <span className="absolute top-0 right-0 bg-[#8c8680] text-white text-[10px] px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</span>}<div className="flex justify-between items-baseline mb-2"><h3 className="text-base font-medium text-[#5e5a56]">{title}</h3><span className="text-lg font-serif text-[#8c8680]">NT$ {price}</span></div><p className="text-xs text-[#a8a4a0] leading-relaxed">{desc}</p>{warning && <div className="mt-2 text-[10px] text-orange-800 bg-orange-50 p-2 rounded">{warning}</div>}</div>;
const PriceRow = ({ label, price, desc }) => (
  <div className="border-b border-[#f2f0eb] last:border-0 pb-3 last:pb-0">
    <div className="flex justify-between items-baseline mb-1">
      <span className="text-sm font-bold text-[#5e5a56]">{label}</span>
      <span className="font-serif text-[#8c8680]">NT$ {price}</span>
    </div>
    {desc && (
      <p className="text-[10px] text-[#a8a4a0] leading-relaxed whitespace-pre-wrap pl-1">
        {desc}
      </p>
    )}
  </div>
);const InputBox = ({ icon: Icon, label, required, value, onChange, ph }) => <div className="space-y-1"><label className="text-xs font-bold text-[#8c8680] pl-1 flex items-center gap-2"><Icon size={12} /> {label} {required && "*"}</label><div className="bg-[#faf9f6] p-3 rounded-xl border border-transparent focus-within:border-[#d4cfc9] focus-within:bg-white transition-all"><input type="text" required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full outline-none text-[#5e5a56] text-sm bg-transparent placeholder:text-[#d4cfc9]" placeholder={ph} /></div></div>;
const Label = ({ icon: Icon, text }) => <label className="text-xs font-bold text-[#8c8680] pl-1 flex items-center gap-2 mb-1"><Icon size={12} /> {text}</label>;
const SelectBadge = ({ active, onClick, children }) => <button type="button" onClick={onClick} className={`p-3 rounded-xl border text-center text-xs cursor-pointer transition-all w-full ${active ? "bg-[#8c8680] text-white border-[#8c8680]" : "bg-[#faf9f6] text-[#5e5a56] border-[#e6e2dc]"}`}>{children}</button>;
const RadioBox = ({ checked, onClick, title, subtitle }) => <div onClick={onClick} className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${checked ? "bg-[#f2f0eb] border-[#8c8680]" : "border-[#e6e2dc] bg-[#faf9f6]"}`}><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${checked ? "border-[#8c8680]" : "border-gray-300"}`}>{checked && <div className="w-2 h-2 rounded-full bg-[#8c8680]"></div>}</div><div><div className="text-sm text-[#5e5a56]">{title}</div>{subtitle && <div className="text-[10px] text-[#a8a4a0]">{subtitle}</div>}</div></div>;
const CheckBox = ({ checked, onClick, text }) => <label className="flex gap-3 items-start cursor-pointer group"><input type="checkbox" required checked={checked} onChange={onClick} className="mt-0.5 accent-[#8c8680] w-4 h-4 cursor-pointer flex-shrink-0" /><span className={`text-xs leading-relaxed transition-colors ${checked ? "text-[#57534e]" : "text-[#a8a4a0] group-hover:text-[#8c8680]"}`}>{text}</span></label>;

export default HarpersMakeup;
