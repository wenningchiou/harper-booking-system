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
  updateDoc, // ✅ 新增這個！
  serverTimestamp,
} from "firebase/firestore";

// --- 1. 服務方案資料庫 ---
const SERVICE_CATALOG = [
  { id: 'gen_single', name: '一般單妝容', price: 1500, type: 'female', category: 'standard', desc: '自然乾淨的氣色妝容。不含假睫毛、妝面飾品與髮型設計。' },
  { id: 'gen_full', name: '一般妝髮方案', price: 2000, type: 'female', category: 'standard', desc: '自然乾淨的氣色妝容＋簡約髮型整理，適合日常聚會、證件照與面試。' },
  { id: 'exq_single', name: '精緻單妝容', price: 2000, type: 'female', category: 'standard', desc: '加強妝面細緻度與眼妝層次，妝感更完整。不含髮型設計。' },
  { id: 'exq_full', name: '精緻妝髮方案', price: 2500, type: 'female', category: 'standard', desc: '提升底妝細緻度、眼妝層次與整體持妝表現，妝感更上鏡、更精緻。' },
  { id: 'men_std', name: '男士妝髮', price: 1500, type: 'male', category: 'standard', desc: '基礎底妝、眉型修整、髮型吹整。' },
  { id: 'bride_reg', name: '新娘登記妝髮', price: 2800, type: 'female', category: 'registration', desc: '穩定、自然，符合登記需求的專業妝髮服務。不含複雜編髮與妝面飾品。' },
  { id: 'bride_pro', name: '新娘登記妝髮 PRO', price: 3200, type: 'female', category: 'registration', desc: '為拍攝／上鏡與重要紀錄設計的進階方案；髮型可依需求設計複雜編髮並可搭配造型飾品。' },
  { id: 'groom', name: '新郎妝髮', price: 1500, type: 'male', category: 'registration', desc: '男士基礎底妝、眉型修整與髮型吹整。' },
  { id: 'family', name: '親友妝容', price: 2000, type: 'female', category: 'registration', desc: '親友觀禮適用之自然氣色妝容（不含髮型）。' },
];

// --- 2. 用途分類 ---
const USAGE_TYPES = [
  { id: 'date_id', label: '約會 / 證件形象照', mode: 'standard' },
  { id: 'photo', label: '攝影寫真', mode: 'standard' },
  { id: 'concert', label: '演唱會 / 應援', mode: 'standard' },
  { id: 'performance', label: '表演 / 發表會', mode: 'standard' },
  { id: 'registration', label: '結婚登記', mode: 'registration' },
  { id: 'wedding', label: '婚禮 / 新秘服務', mode: 'quote_only' },
  { id: 'other', label: '其他 (請說明)', mode: 'standard_with_input' },
];

// --- 3. Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDUOtmKL_DDuLyefiDwwxVtlTeK1PwDEno",
  authDomain: "harpersmakeup-ee883.firebaseapp.com",
  projectId: "harpersmakeup-ee883",
  storageBucket: "harpersmakeup-ee883.firebasestorage.app",
  messagingSenderId: "550619624604",
  appId: "1:550619624604:web:a9d85309bc09206eac2959",
  measurementId: "G-BDMNM2P3BN",
};

const isFirebaseReady = Object.keys(firebaseConfig).length > 0;
let app, auth, db;

if (isFirebaseReady) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("⚠️ Firebase Config 未設定");
}

// --- 4. 主程式 HarpersMakeup ---
const HarpersMakeup = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  useEffect(() => {
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const link = document.createElement("link");
      link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const styleId = "harper-custom-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        body { font-family: 'Noto Sans TC', sans-serif; background-color: #fdfbf7; background-image: radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, transparent 50%); background-attachment: fixed; margin: 0; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `;
      document.head.appendChild(style);
    }
    const showApp = () => setIsStyleLoaded(true);
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      script.onload = showApp;
      script.onerror = showApp;
      document.head.appendChild(script);
    } else {
      showApp();
    }
    const safetyTimer = setTimeout(showApp, 1000);

    if (isFirebaseReady) {
      signInAnonymously(auth).catch(console.error);
      onAuthStateChanged(auth, setUser);
    } else {
      setUser({ uid: "demo-user" });
    }
    return () => clearTimeout(safetyTimer);
  }, []);

  const handleBookingSubmit = async (data) => {
    setIsSubmitting(true);
    if (isFirebaseReady && user) {
      try {
        await addDoc(collection(db, "public_appointments"), {
          ...data,
          status: "pending",
          createdAt: serverTimestamp(),
          deviceUser: user.uid,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      await new Promise((r) => setTimeout(r, 800));
    }
    setBookingData(data);
    setShowModal(true);
    setIsSubmitting(false);
  };

  if (!isStyleLoaded) {
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fdfbf7", color: "#8c8680", fontFamily: "serif" }}><div style={{ textAlign: "center" }}><h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>Harper's</h2><p style={{ fontSize: "0.8rem", opacity: 0.6 }}>Loading...</p></div></div>;
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
            <button onClick={() => setActiveTab("booking")} className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transform transition-transform active:scale-95 ${activeTab === "booking" ? "bg-[#756f6a] ring-4 ring-[#e6e2dc]" : "bg-[#8c8680]"}`}><Calendar className="text-white w-6 h-6" /></button>
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
      <h2 className="text-3xl font-serif tracking-[0.2em] text-[#5e5a56]">
        Harper's
      </h2>
      <div className="h-px w-12 bg-[#8c8680] mx-auto opacity-30"></div>
      <p className="text-sm text-[#a8a4a0] tracking-widest font-serif italic">
        Clean beauty, just for you
      </p>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => onChangeTab("booking")}
        className="px-8 py-3 rounded-full bg-[#8c8680] text-white tracking-[0.15em] text-xs font-bold shadow-lg shadow-[#8c8680]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        立即預約
      </button>
      <button
        onClick={() => onChangeTab("pricing")}
        className="px-8 py-3 rounded-full border border-[#8c8680] text-[#8c8680] bg-transparent tracking-[0.15em] text-xs font-bold hover:bg-[#8c8680] hover:text-white hover:shadow-lg transition-all duration-300"
      >
        價目表
      </button>
    </div>
  </div>
);

const ServiceSection = () => (
  <div className="space-y-6 pb-20">
    <SectionHeader title="About Harper" subtitle="服務介紹" />
    <div className="glass-card p-8 rounded-[2rem] text-center space-y-6 shadow-sm">
      <div className="w-24 h-24 mx-auto rounded-full bg-[#fcfbf9] border border-[#e6e2dc] flex items-center justify-center shadow-inner"><User size={32} className="text-[#d4cfc9]" /></div>
      <div><h3 className="text-lg font-bold text-[#5e5a56] mb-3 font-serif">彩妝師 Harper</h3><p className="text-[#8c8680] text-sm leading-loose text-justify tracking-wide font-light">我是彩妝師 Harper，擅長日韓系乾淨質感妝容，依照個人五官比例、膚況與活動需求，打造適合你的妝容。<br /><br />不論是日常、拍攝、活動，或婚禮與結婚登記，我都會用專業與細心，陪你完成每一個重要時刻。</p></div>
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
        <h3 className="text-lg font-medium text-[#5e5a56] mb-4 font-serif">Marriage Registration</h3>
        <div className="space-y-4">
          <PriceRow label="新娘登記妝髮" price="2,800" desc={`穩定、自然、符合登記需求的專業妝髮服務\n髮型以基礎髮型為主（不含複雜編髮與妝面飾品）`} />
          <PriceRow label="新娘登記妝髮Pro" price="3,200" desc={`針對拍攝、上鏡與重要紀錄需求所設計的進階方案\n髮型可依造型需求設計複雜編髮，整體完成度更高\n可搭配造型飾品`} />
          <PriceRow label="新郎妝髮" price="1,500" />
          <PriceRow label="親友妝容" price="2,000" />
        </div>
      </div>
      <div className="p-5 rounded-2xl border border-dashed border-[#d4cfc9] text-center bg-[#fcfbf9]"><h3 className="text-sm font-medium text-[#5e5a56] flex items-center justify-center gap-2 mb-1"><Sparkles size={16} /> 婚禮 / 新秘服務</h3><p className="text-xs text-[#a8a4a0]">請填寫預約單，將依需求另行報價</p></div>
    </div>
  </div>
);

const FaqSection = () => {
  const [idx, setIdx] = useState(null);
  const faqs = [
    { q: "一般妝髮和精緻妝髮差在哪？", a: (<>兩者主要差別在於妝面的細節處理與完整度。<br/>一般妝髮以自然、乾淨為主，適合聚會或不需強烈上鏡的場合；<br/>精緻妝髮則會加強底妝細緻度、眼妝層次與整體持妝表現，更適合拍攝、重要活動或希望妝感更完整的需求。<br/><br/><span className="font-bold text-[#9f5f5f]">另外，一般妝髮方案不包含假睫毛及貼鑽、緞帶等妝面飾品。<br/>若有假睫毛或妝面飾品的需求，請選擇精緻妝髮方案唷 🤍</span></>) },
    { q: "婚禮／結婚登記可以選一般妝髮方案嗎？", a: (<><span className="font-bold text-[#9f5f5f]">不建議，也無法適用。</span><br/>婚禮／結婚登記屬於時間不可延誤、會被大量拍攝紀錄的重要場合，對妝容的細緻度、持妝穩定度與流程安排要求更高，才能確保當天呈現與服務品質。</>) },
    { q: "送出預約表單就算預約成功了嗎？", a: (<>還不算。<br/><span className="font-bold text-[#5e5a56]">送出表單僅代表「提出預約申請」</span>，需經 Harper 確認檔期、回覆報價並完成訂金付款後，預約才算正式成立。</>) },
    { q: "訂金是多少？什麼時候要付？", a: (<>訂金為每位 NT$500，<br/>例如梳化人數為 2 位，訂金即為 NT$1000，以此類推。<br/>完成訂金付款並收到 Harper 回覆確認後，才會為您保留時段。</>) },
    { q: "可以改期或取消嗎？", a: (<>可以。<br/>因事改期請於至少 3 天前告知，並以一次為限。<br/>若場地租借空間無法退款，將由訂金中扣除相關費用後退回餘款。<br/><span className="font-bold text-[#9f5f5f]">請勿於當天臨時取消或未到，訂金恕不退回，敬請理解。</span></>) },
    { q: "到府梳化會加收費用嗎？", a: (<>會。<br/>到府梳化之車馬費將依距離、時段與地點另行報價，實際費用將以 Harper 回覆確認為準。</>) },
    { q: "跟妝一定要加購嗎？", a: (<>不一定。<br/>是否需要跟妝會依活動性質、時數與現場狀況評估。<br/>若不確定是否有跟妝需求，也可以請 Harper 協助評估是否需要加購。</>) },
    { q: "如果我臨時無法抵達或晚到？", a: (<>當然希望大家都能準時抵達開妝，但路況或突發狀況難免發生。<br/>若確定會晚到，請提前告知，讓我可以協助調整流程。<br/>若因遲到影響可服務時間，妝髮完整度將以不影響下一位客人為前提進行調整，敬請見諒。</>) },
    { q: "有皮膚敏感、針眼或近期醫美可以化妝嗎？", a: (<>請務必事先告知。<br/>如有針眼、皮膚病、過敏或近期醫美療程，Harper 會評估是否適合上妝，必要時也會建議改期，以保障您與其他客人的健康與安全。</>) },
    { q: "可以指定妝感或提供參考圖嗎？", a: (<>可以。<br/>建議於梳化前提供 1–3 張妝感或造型參考圖。<br/>若沒有明確想法，也非常歡迎提供當天服裝或整體風格，讓我一起和你討論並給予建議 ❤️<br/>Harper 會依您的五官比例、膚況與活動需求，調整出最適合您的妝容風格。</>) },
  ];
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Q & A" subtitle="常見問題" />
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#e6e2dc] overflow-hidden">
            <button onClick={() => setIdx(idx === i ? null : i)} className="w-full px-6 py-4 text-left flex justify-between items-center group"><span className="text-sm font-medium text-[#5e5a56] pr-4">{f.q}</span>{idx === i ? <ChevronUp size={16} className="text-[#8c8680]" /> : <ChevronDown size={16} className="text-[#d4cfc9]" />}</button>
            {idx === i && <div className="px-6 pb-6 pt-0 text-xs text-[#8c8680] leading-relaxed pl-9"><div className="h-px w-full bg-[#fcfbf9] mb-3"></div>{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const RulesSection = () => {
  const rules = [
    { t: "預約成立說明", c: (<><span className="font-bold text-[#9f5f5f]">送出預約表單僅代表提出預約申請，不代表預約成功。</span><br />預約需經 Harper 確認檔期、回覆報價，並完成訂金後，才算正式成立並保留時段。</>),},
    { t: "訂金與付款", c: (<>訂金為每位 NT$500（依梳化人數計算）。<br />完成訂金付款並收到確認回覆後，才會保留您的預約時段。<br />尾款請於梳化結束當下結清。</>),},
    { t: "改期與取消", c: (<>如需改期，請於至少 3 天前告知，並以一次為限。<br />若場地租借空間無法退款，將從訂金中扣除相關費用後退回餘款。<br /><span className="font-bold text-[#9f5f5f]">當天臨時取消或未到，訂金恕不退回，敬請理解。</span></>),},
    { t: "梳化地點與額外費用", c: (<>合作工作室需視當日空檔狀況，實際使用將以 Harper 與場地方確認回覆為準。<br />到府梳化之車馬費，將依距離、時段與地點另行報價。<br />若選擇「依活動地點附近協助找開妝點」，場地費需另行報價；若距離較遠將加收車馬費。</>),},
    { t: "跟妝與妝面飾品", c: (<>跟妝屬加購服務，是否需要將依活動性質、時數與現場狀況評估。<br />如有跟妝需求請務必事先告知，因檔期與行程安排不一定可臨時加購。<br />方案內容不包含妝面飾品。如需飾品，可加購租借方案（依實際品項報價）。<br />若有特殊指定飾品需求，請自行準備。<br />若需協助採購花材等造型素材，請務必事先告知，且需另行報價。</>),},
    { t: "時間與遲到", c: (<>請準時抵達開妝時間，並確保可立即開始服務。<br />若因遲到影響可服務時間，妝髮完整度將以不影響下一位客人為前提進行調整，敬請見諒。</>),},
    { t: "健康與安全告知", c: (<>如有針眼、皮膚病、過敏或近期醫美療程，請務必事先告知。<br />Harper 將評估是否適合上妝，必要時可能建議改期，以保障雙方。</>),},
    { t: "其他說明", c: (<>請自行保管個人物品與貴重物品。<br />若有其他未列事項，將依實際溝通內容與 Harper 回覆為準。</>),},
  ];
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Notice" subtitle="預約須知" />
      <div className="space-y-4">
        {rules.map((r, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-[#e6e2dc]">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#f2f0eb] text-[#8c8680] text-xs font-serif font-bold">{i + 1}</span>
              <h4 className="text-sm font-bold text-[#5e5a56]">{r.t}</h4>
            </div>
            <div className="text-xs text-[#8c8680] leading-relaxed pl-9">{r.c}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 6. 預約表單元件 (修正 CheckIcon 錯誤版) ---
const BookingForm = ({ onSubmit, isSubmitting }) => {
  // 表單狀態
  const [data, setData] = useState({
    name: "", phone: "", instagram: "", lineId: "",
    usageType: "", customUsage: "", 
    quantities: {}, // 一般方案用
    dates: ["", "", ""], 
    timeSlots: [], finishTimeH: "12", finishTimeM: "00",
    city: "", locationType: "", address: "",
    followUp: "不需要", notes: "",
    agreement1: false, agreement2: false, agreement3: false,
    
    // 🔥 婚禮專用欄位
    ceremonies: [], // 儀式 (Array)
    banquetType: "", // 宴客
    stylingCount: "", // 造型數
    weddingPkg: "", // 梳化方案 (bride_only, bride_groom)
    familyCount: 0, // 親友數
  });

  const handleChange = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  // 日期限制 (半年內)
  const dateLimits = useMemo(() => {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    return { min: formatDate(today), max: formatDate(sixMonthsLater) };
  }, []);

  // 一般方案篩選
  const currentMode = useMemo(() => {
    const type = USAGE_TYPES.find(u => u.id === data.usageType);
    return type ? type.mode : null;
  }, [data.usageType]);

  const displayedServices = useMemo(() => {
    if (!currentMode || data.usageType === 'wedding') return []; // 婚禮不顯示一般列表
    if (currentMode === 'registration') return SERVICE_CATALOG.filter(s => s.category === 'registration');
    if (currentMode === 'standard' || currentMode === 'standard_with_input') return SERVICE_CATALOG.filter(s => s.category === 'standard');
    return [];
  }, [currentMode, data.usageType]);

  // 🔥 統計數據與價格計算
  const stats = useMemo(() => {
    let female = 0, male = 0, basePrice = 0;
    let quoteItems = [];
    let hasGeneral = false;
    let isQuoteNeeded = false;

    // A. 婚禮模式計算
    if (data.usageType === 'wedding') {
        isQuoteNeeded = true;
        // 1. 方案人數
        if (data.weddingPkg === 'bride_only') { female += 1; }
        else if (data.weddingPkg === 'bride_groom') { female += 1; male += 1; }
        
        // 2. 親友 (假設親友多為女，或不分性別先算女，系統備註即可)
        female += data.familyCount;

        // 3. 判斷儀式類型文字 (用於顯示)
        const cLen = data.ceremonies.length;
        let ceremonyText = "未選儀式";
        if (data.ceremonies.includes("無儀式（純宴客）")) ceremonyText = "純宴客";
        else if (cLen === 1) ceremonyText = "單儀式";
        else if (cLen >= 2) ceremonyText = "雙儀式";

        quoteItems.push(`${ceremonyText} + ${data.banquetType || "無宴客"}`);
        quoteItems.push(`造型: ${data.stylingCount || "未定"}`);
    } 
    // B. 一般模式計算
    else {
        Object.entries(data.quantities).forEach(([sid, count]) => {
            const svc = SERVICE_CATALOG.find(s => s.id === sid);
            if (svc) {
                if (svc.type === 'female') female += count;
                if (svc.type === 'male') male += count;
                basePrice += svc.price * count;
                if (sid === 'gen_single' || sid === 'gen_full') hasGeneral = true;
            }
        });
        if (data.usageType === 'other') { isQuoteNeeded = true; quoteItems.push("特殊需求"); }
        if (data.city === '高雄' && data.locationType.includes('工作室')) basePrice += 300;
        if (data.city === '台南' && data.locationType.includes('工作室')) basePrice += 300;
        if (data.locationType.includes('報價') || data.locationType.includes('到府')) { isQuoteNeeded = true; quoteItems.push("車馬費/場地費"); }
    }

    // 通用加購
    if (data.followUp && data.followUp !== '不需要') { isQuoteNeeded = true; quoteItems.push("跟妝服務"); }
    if (data.timeSlots.includes("凌晨 (07:00前)")) { quoteItems.push("早妝鐘點費"); isQuoteNeeded = true; }

    return { female, male, total: female + male, basePrice, isQuoteNeeded, quoteItems, hasGeneral };
  }, [data]);

  // 處理婚禮儀式勾選
  const handleCeremonyCheck = (item) => {
      let newC = [...(data.ceremonies || [])]; // 確保是陣列
      if (item === "無儀式（純宴客）") {
          // 若選無儀式，清空其他
          newC = ["無儀式（純宴客）"];
      } else {
          // 若選其他，先移除無儀式
          newC = newC.filter(c => c !== "無儀式（純宴客）");
          if (newC.includes(item)) newC = newC.filter(c => c !== item);
          else newC.push(item);
      }
      setData({ ...data, ceremonies: newC });
  };

  const handleUsageChange = (e) => {
    const newType = e.target.value;
    setData(p => ({ 
        ...p, 
        usageType: newType, 
        quantities: {}, 
        customUsage: newType === 'other' ? '' : '',
        // 切換時重置婚禮欄位
        ceremonies: [], banquetType: "", stylingCount: "", weddingPkg: "", familyCount: 0
    }));
  };

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
    
    // 婚禮驗證
    if (data.usageType === 'wedding') {
        if (!data.banquetType) return alert("請選擇宴客類型");
        if (!data.stylingCount) return alert("請選擇造型套數");
        if (!data.weddingPkg) return alert("請選擇梳化方案");
        if (!data.city) return alert("請選擇所在縣市");
    } else {
        if (stats.total === 0) return alert("請至少選擇一位梳化人數");
    }

    if (!data.agreement1) return alert("請確認並勾選同意事項");

    // 產生 Service Type 字串
    let serviceListStr = "";
    if (data.usageType === 'wedding') {
        // 組合婚禮字串
        const cText = data.ceremonies.includes("無儀式（純宴客）") ? "純宴客" : (data.ceremonies.length > 1 ? "雙儀式" : "單儀式");
        const pkgText = data.weddingPkg === 'bride_only' ? "新娘梳化" : "新娘+新郎";
        serviceListStr = `[婚禮] ${cText} + ${data.banquetType}｜${data.stylingCount}｜${pkgText}｜親友${data.familyCount}位`;
        
        // 將儀式細節放入 customUsage 以便後台查看
        data.customUsage = `儀式: ${data.ceremonies.join(", ")}`;
    } else {
        serviceListStr = Object.entries(data.quantities).map(([id, n]) => {
            const s = SERVICE_CATALOG.find(x => x.id === id);
            return `${s.name} x${n}`;
        }).join(", ");
    }

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
        <div className="grid grid-cols-2 gap-3">
            <InputBox icon={Instagram} label="Instagram" required value={data.instagram} onChange={v => setData({...data, instagram: v})} ph="@ID" />
            <InputBox icon={MessageCircle} label="LINE ID (選填)" value={data.lineId} onChange={v => setData({...data, lineId: v})} ph="LINE ID" />
        </div>

        {/* 2. 用途選擇 */}
        <div className="space-y-3 animate-fade-in">
             <Label icon={Heart} text="本次梳化活動用途" />
             <div className="relative">
                 <select value={data.usageType} onChange={handleUsageChange} className="w-full p-4 rounded-xl border border-[#e6e2dc] bg-[#faf9f6] text-sm text-[#5e5a56] outline-none appearance-none font-medium">
                     <option value="" disabled>請選擇用途</option>
                     {USAGE_TYPES.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}
                 </select>
                 <ChevronDown size={16} className="absolute right-4 top-4 text-[#a8a4a0] pointer-events-none" />
             </div>
             {data.usageType === 'other' && (<input type="text" placeholder="請說明您的活動需求..." value={data.customUsage} onChange={e => setData({...data, customUsage: e.target.value})} className="w-full p-3 rounded-xl border border-[#d4cfc9] bg-white text-sm outline-none focus:border-[#8c8680] animate-fade-in" />)}
        </div>

        {/* ================= 婚禮專用介面 ================= */}
        {data.usageType === 'wedding' ? (
            <div className="space-y-6 animate-fade-in">
                
                {/* 婚禮 - 日期與地點 */}
                <div className="space-y-3 pt-2 border-t border-[#f2f0eb]">
                    <Label icon={Calendar} text="日期與地點" />
                    <div className="space-y-1">
                        <span className="text-xs text-[#8c8680] font-bold">預約日期</span>
                        <input type="date" required min={dateLimits.min} max={dateLimits.max} value={data.dates[0]} onChange={(e) => { const d = [...data.dates]; d[0] = e.target.value; handleChange("dates", d); }} className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none" />
                    </div>
                    <div className="space-y-1">
                         <span className="text-xs text-[#8c8680] font-bold">所在縣市</span>
                         <select value={data.city} onChange={e => setData({...data, city: e.target.value})} className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none">
                            <option value="">請選擇縣市</option>
                            {["基隆","台北","新北","桃園","新竹","苗栗","台中","彰化","南投","雲林","嘉義","台南","高雄","屏東","宜蘭","花蓮","台東"].map(c=><option key={c} value={c}>{c}</option>)}
                         </select>
                         <div className="text-[10px] text-orange-800 bg-orange-50 p-2 rounded-lg leading-relaxed">
                            <span className="font-bold">提醒：跨區服務 (交通、住宿費)</span><br/>
                            跨區服務或早妝時間較早，會需提前安排交通費或住宿費。<br/>車馬費用將另外計費。
                         </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-[#8c8680] font-bold">跟妝需求</span>
                        <div className="flex flex-col gap-2">
                             {["不需要", "需要-另行報價($700/hr)", "不確定，請Harper協助評估"].map(o => (
                                 <RadioBox key={o} checked={data.followUp === o} onClick={()=>setData({...data, followUp: o})} title={o} />
                             ))}
                        </div>
                    </div>
                </div>

                {/* 婚禮 - 儀式選擇 (🔥 修正版) */}
                <div className="space-y-3 pt-2 border-t border-[#f2f0eb]">
                    <Label icon={Diamond} text="請問當天有哪些儀式？(可複選)" />
                    <div className="grid grid-cols-2 gap-2">
                        {["訂婚儀式", "結婚儀式", "迎娶", "證婚 (教堂/戶外)", "家宴", "無儀式（純宴客）"].map(c => (
                            <label key={c} className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs transition-all ${data.ceremonies.includes(c) ? "bg-[#f2f0eb] border-[#8c8680] text-[#5e5a56]" : "border-[#e6e2dc] text-[#a8a4a0]"}`}>
                                <input type="checkbox" checked={data.ceremonies.includes(c)} onChange={() => handleCeremonyCheck(c)} className="accent-[#8c8680] hidden" />
                                <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${data.ceremonies.includes(c) ? "border-[#8c8680] bg-[#8c8680]" : "border-gray-300"}`}>
                                    {/* 直接使用 SVG，避免 CheckIcon 報錯 */}
                                    {data.ceremonies.includes(c) && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>
                                <span>{c}</span>
                            </label>
                        ))}
                    </div>
                    <div className="text-[10px] text-[#a8a4a0] pl-1">
                        * 勾選 1 個為單儀式，2 個以上視為雙儀式流程。
                    </div>
                </div>

                {/* 婚禮 - 宴客與造型 */}
                <div className="space-y-3 pt-2 border-t border-[#f2f0eb]">
                    <Label icon={Users} text="宴客與造型" />
                    <div className="space-y-2">
                        <span className="text-xs text-[#8c8680] font-bold">是否有宴客？</span>
                        <div className="flex gap-2">
                            {["無宴客", "有宴客｜午宴", "有宴客｜晚宴"].map(o => <SelectBadge key={o} active={data.banquetType === o} onClick={() => setData({...data, banquetType: o})}>{o}</SelectBadge>)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs text-[#8c8680] font-bold">預計新娘造型套數</span>
                        <div className="flex gap-2 flex-wrap">
                            {["1 套", "2 套", "3 套", "4 套", "尚未確定"].map(o => <SelectBadge key={o} active={data.stylingCount === o} onClick={() => setData({...data, stylingCount: o})}>{o}</SelectBadge>)}
                        </div>
                        <div className="text-[10px] text-[#a8a4a0] pl-1">* 實際造型套數將依流程與時程由新秘協助確認</div>
                    </div>
                </div>

                {/* 婚禮 - 梳化方案 */}
                <div className="space-y-3 pt-2 border-t border-[#f2f0eb]">
                     <Label icon={Sparkles} text="梳化方案 (必填)" />
                     <div className="space-y-2">
                         <RadioBox checked={data.weddingPkg === 'bride_only'} onClick={()=>setData({...data, weddingPkg: 'bride_only'})} title="新娘梳化" subtitle="女 1 位" />
                         <RadioBox checked={data.weddingPkg === 'bride_groom'} onClick={()=>setData({...data, weddingPkg: 'bride_groom'})} title="新娘＋新郎" subtitle="女 1 位｜男 1 位" />
                     </div>
                     
                     <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#e6e2dc] flex justify-between items-center mt-2">
                        <span className="text-xs font-bold text-[#8c8680]">是否需要親友妝髮？</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setData({...data, familyCount: Math.max(0, data.familyCount - 1)})} className="w-8 h-8 rounded-lg bg-white border border-[#e6e2dc] text-[#8c8680] flex items-center justify-center shadow-sm">-</button>
                            <span className="text-sm font-bold text-[#5e5a56] w-4 text-center">{data.familyCount}</span>
                            <button type="button" onClick={() => setData({...data, familyCount: data.familyCount + 1})} className="w-8 h-8 rounded-lg bg-white border border-[#e6e2dc] text-[#8c8680] flex items-center justify-center shadow-sm">+</button>
                            <span className="text-xs text-[#5e5a56]">位</span>
                        </div>
                     </div>
                     <div className="text-[10px] text-[#a8a4a0] pl-1">* 親友妝髮將依人數與時程另行評估</div>
                </div>

                {/* 婚禮 - 總人數顯示 */}
                <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#e6e2dc] flex justify-between items-center text-sm text-[#5e5a56]">
                   <span className="font-bold text-[#8c8680]">總梳化人數</span>
                   <div className="font-medium">
                       女 {stats.female} 位｜男 {stats.male} 位 <span className="text-[#a8a4a0] text-xs">(共 {stats.total} 位)</span>
                   </div>
                </div>

            </div>
        ) : (
        /* ================= 一般方案介面 ================= */
            <>
                {/* 方案選擇列表 */}
                {displayedServices.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                        <Label icon={Sparkles} text="選擇方案與人數" />
                        {displayedServices.map(svc => {
                            const count = data.quantities[svc.id] || 0;
                            // 判斷熱門邏輯
                            let isPopular = false;
                            if (data.usageType === 'registration' && svc.id === 'bride_pro') isPopular = true;
                            if (data.usageType === 'date_id' && svc.id === 'gen_full') isPopular = true;
                            if (!['registration','date_id'].includes(data.usageType) && svc.id === 'exq_full') isPopular = true;

                            return (
                                <div key={svc.id} className={`relative flex justify-between items-start p-4 rounded-xl border transition-all ${count > 0 ? "bg-[#fcfbf9] border-[#8c8680]" : "border-[#f2f0eb]"} ${isPopular ? "shadow-sm border-[#d4cfc9]" : ""}`}>
                                    {isPopular && <span className="absolute top-0 right-0 bg-[#8c8680] text-white text-[10px] px-3 py-1 rounded-bl-xl rounded-tr-xl font-medium tracking-wider shadow-sm">POPULAR</span>}
                                    <div className="pr-2 flex-1">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <div className="text-sm font-bold text-[#5e5a56]">{svc.name}</div>
                                            <div className="text-xs font-serif text-[#8c8680]">NT$ {svc.price.toLocaleString()}</div>
                                        </div>
                                        <div className="text-[10px] text-[#a8a4a0] leading-relaxed">{svc.desc}</div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 pl-2">
                                        <button type="button" onClick={() => handleQtyChange(svc.id, -1)} disabled={count===0} className="w-8 h-8 rounded-lg bg-white border border-[#e6e2dc] text-[#8c8680] disabled:opacity-30 flex items-center justify-center shadow-sm active:scale-95 transition-all">-</button>
                                        <span className="w-4 text-center font-bold text-[#5e5a56]">{count}</span>
                                        <button type="button" onClick={() => handleQtyChange(svc.id, 1)} className="w-8 h-8 rounded-lg bg-white border border-[#e6e2dc] text-[#8c8680] flex items-center justify-center shadow-sm active:scale-95 transition-all">+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 統計人數顯示 */}
                {stats.total > 0 && (
                     <div className="space-y-3 animate-fade-in">
                         <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#e6e2dc] flex justify-between items-center text-sm text-[#5e5a56]">
                            <span className="font-bold text-[#8c8680]">總梳化人數</span>
                            <div className="font-medium">女 {stats.female} 位｜男 {stats.male} 位 <span className="text-[#a8a4a0] text-xs">(共 {stats.total} 位)</span></div>
                         </div>
                         {stats.total >= 3 && (<div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3"><AlertCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" /><div className="text-xs text-orange-800 leading-relaxed"><span className="font-bold">提醒 🤍</span><br/>已偵測到您本次梳化人數較多，請確認每位的方案人數是否填寫正確。<br/>送出後 Harper 會再依日期、地點與工作室空檔協助確認安排與最終費用。</div></div>)}
                     </div>
                )}

                {/* 日期與時段 */}
                <div className="space-y-4 pt-2">
                  <Label icon={Calendar} text="日期與時段" />
                  <span className="text-xs text-[#8c8680] w-12 flex-shrink-0 font-bold">首選日期</span>
                  <input type="date" required min={dateLimits.min} max={dateLimits.max} value={data.dates[0]} onChange={(e) => { const d = [...data.dates]; d[0] = e.target.value; handleChange("dates", d); }} className="w-full p-2.5 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none" />
                  <div className="flex gap-2">
                    <span className="text-xs text-[#8c8680] w-8 flex-shrink-0 font-bold">候補日期</span>
                    <input type="date" min={dateLimits.min} max={dateLimits.max} value={data.dates[1]} onChange={(e) => { const d = [...data.dates]; d[1] = e.target.value; handleChange("dates", d); }} className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none" />
                    <input type="date" min={dateLimits.min} max={dateLimits.max} value={data.dates[2]} onChange={(e) => { const d = [...data.dates]; d[2] = e.target.value; handleChange("dates", d); }} className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none" />
                  </div>
                  <div className="space-y-2">
                      <Label icon={Clock} text="可梳化時段（可複選）" />
                      <div className="flex flex-wrap gap-2">{["凌晨 (07:00前)", "早上 (07:00-12:00)", "下午 (12:00-17:00)", "傍晚 (17:00-19:00)"].map(t => (<SelectBadge key={t} active={data.timeSlots.includes(t)} onClick={() => { const curr = data.timeSlots; setData({...data, timeSlots: curr.includes(t) ? curr.filter(x=>x!==t) : [...curr, t]}); }}>{t}</SelectBadge>))}</div>
                      {data.timeSlots.includes("凌晨 (07:00前)") && (<div className="mt-1 text-[11px] text-orange-800 bg-orange-50 border border-orange-100 p-3 rounded-xl animate-fade-in flex items-start gap-2"><span className="text-base mt-[-2px]">💡</span><span>已選擇凌晨開妝時段，將另收 每小時 NT$700 鐘點費。</span></div>)}
                  </div>
                  <div className="bg-[#faf9f6] p-3 rounded-xl flex items-center justify-between border border-[#e6e2dc]"><span className="text-xs text-[#8c8680] font-bold pl-1">最晚完妝時間</span><div className="flex items-center gap-1"><select value={data.finishTimeH} onChange={e=>setData({...data, finishTimeH:e.target.value})} className="bg-transparent font-serif text-lg outline-none">{[...Array(24).keys()].map(i=><option key={i} value={String(i).padStart(2,"0")}>{String(i).padStart(2,"0")}</option>)}</select><span>:</span><select value={data.finishTimeM} onChange={e=>setData({...data, finishTimeM:e.target.value})} className="bg-transparent font-serif text-lg outline-none"><option value="00">00</option><option value="30">30</option></select></div></div>
                </div>

                {/* 地點與跟妝 (一般方案) */}
                <div className="space-y-3 pt-2">
                   <Label icon={MapPin} text="地點與場地" />
                   <div className="grid grid-cols-3 gap-2"><SelectBadge active={data.city==='高雄'} onClick={()=>setData({...data, city:'高雄', locationType:''})}>高雄</SelectBadge><SelectBadge active={data.city==='台南'} onClick={()=>setData({...data, city:'台南', locationType:''})}>台南</SelectBadge><SelectBadge active={data.city==='其他'} onClick={()=>setData({...data, city:'其他', locationType:''})}>其他縣市</SelectBadge></div>
                   {data.city && (<div className="space-y-2 animate-fade-in pt-1">{data.city === '高雄' && <RadioBox checked={data.locationType.includes('工作室')} onClick={()=>setData({...data, locationType:'合作工作室｜巨蛋站 (場地費$300)'})} title="合作工作室｜巨蛋站" subtitle="場地費 $300" />}{data.city === '台南' && <RadioBox checked={data.locationType.includes('工作室')} onClick={()=>setData({...data, locationType:'合作工作室｜大同路 (場地費$300)'})} title="合作工作室｜大同路" subtitle="場地費 $300" />}<RadioBox checked={data.locationType.includes('到府')} onClick={()=>setData({...data, locationType:'到府服務 (報價)'})} title="到府服務" subtitle="車馬費另計" /><RadioBox checked={data.locationType.includes('協助找')} onClick={()=>setData({...data, locationType:'協助找開妝點 (報價)'})} title="協助找開妝點" subtitle="場地/車馬費另計" /></div>)}
                </div>
                <div className="space-y-3"><Label icon={Users} text="跟妝需求" />{["不需要", "需要-另行報價($700/hr)", "不確定，請Harper協助評估"].map(o => (<RadioBox key={o} checked={data.followUp === o} onClick={()=>setData({...data, followUp: o})} title={o} />))}</div>
            </>
        )}

        <textarea value={data.notes} onChange={e=>setData({...data, notes:e.target.value})} className="w-full p-3 rounded-xl border border-[#e6e2dc] bg-[#faf9f6] text-sm outline-none resize-none" rows="2" placeholder="備註（非必填）..." />

        {/* 價格估算卡 */}
        <div className="bg-[#8c8680] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={60} /></div>
             <div className="relative z-10">
                 <div className="text-[10px] font-bold tracking-widest text-[#e6e2dc] uppercase mb-1">Estimated Price 價格估算</div>
                 <div className="flex items-baseline gap-2 mb-2">
                     <span className="text-3xl font-serif font-medium text-white">
                         {data.usageType === 'wedding' ? "另行報價" : `NT$ ${stats.basePrice.toLocaleString()}`}
                         {!data.usageType === 'wedding' && stats.isQuoteNeeded && <span className="text-sm font-sans ml-1 opacity-80">起</span>}
                     </span>
                 </div>
                 
                 {data.usageType === 'wedding' ? (
                     <div className="text-xs text-[#f2f0eb] opacity-90 leading-relaxed">
                         婚禮新秘服務將依實際流程、造型套數、時程與地點評估，非固定價格。<br/>
                         送出後 Harper 會盡快與您聯繫討論細節 ❤️
                     </div>
                 ) : (
                     <div className="text-xs space-y-1 mb-2 text-[#f2f0eb] opacity-90">
                         {Object.entries(data.quantities).map(([id, n]) => {
                             const s = SERVICE_CATALOG.find(x => x.id === id);
                             return s ? <div key={id}>• {s.name} x{n}</div> : null;
                         })}
                         {data.locationType.includes('工作室') && <div>• 工作室場地費</div>}
                     </div>
                 )}

                 {stats.hasGeneral && (
                     <div className="mt-3 mb-2 text-[10px] text-[#ffddd6] bg-white/10 px-3 py-2 rounded-lg border border-white/10 flex items-start gap-2"><span className="text-sm mt-[-1px]">⚠️</span><span>提醒：一般妝髮不含假睫毛與飾品。</span></div>
                 )}

                 {stats.isQuoteNeeded && data.usageType !== 'wedding' && (
                     <div className="border-t border-white/20 pt-2 mt-2">
                         <div className="text-[10px] text-[#e6e2dc] mb-1">其他需求將於確認後另行報價：</div>
                         <div className="flex flex-wrap gap-2">{stats.quoteItems.map(item => (<span key={item} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded border border-white/10">{item}</span>))}</div>
                     </div>
                 )}
             </div>
        </div>

        <div className="mt-2 text-[10px] text-[#a8a4a0] text-center leading-relaxed px-2">
            *以上為基本報價，實際費用將依人數、性質、地點與車馬費等調整，以 Harper 回覆為準。
        </div>

        {/* 同意條款與送出 */}
        <div className="space-y-3 pt-2">
            <div className="bg-stone-100 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-[#5e5a56]">預約流程說明</h4>
                <div className="text-xs text-[#78716c] leading-relaxed space-y-2">
                    <p className="font-bold text-[#57534e]">本表單為「預約需求填寫」，非最終報價與預約成立。</p>
                    <p>Harper 將依您填寫的服務內容、日期、地點及合作工作室空檔狀況，回覆是否可約與最終費用。</p>
                    <p className="font-bold text-[#57534e]">預約需以 Harper 回覆確認並完成訂金後，才算正式成立並保留時段。</p>
                </div>
                <Label icon={Smile} text="同意條款勾選" />
                <CheckBox checked={data.agreement1} onClick={(e) => setData({...data, agreement1: e.target.checked})} text="送出表單不代表預約成立，需回覆確認。" />
                <CheckBox checked={data.agreement2} onClick={(e) => setData({...data, agreement2: e.target.checked})} text="我已詳細閱讀「預約須知」並同意。" />
                <CheckBox checked={data.agreement3} onClick={(e) => setData({...data, agreement3: e.target.checked})} text="確認資料無誤。" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-full bg-[#8c8680] text-white font-medium tracking-[0.1em] shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? "傳送中..." : <>送出預約申請 <Send size={16} /></>}
            </button>
        </div>
      </form>
    </div>
  );
};

// --- 7. 成功送出 Modal (含婚禮專用複製文案) ---
const SuccessModal = ({ data, onClose }) => {
  // 判斷是否為婚禮單
  const isWedding = data.usageType === 'wedding';

  let copyText = "";

  if (isWedding) {
    // 👰 婚禮專用複製文案
    // 提取儀式文字 (因為在 BookingForm 裡我們把儀式存進 customUsage: "儀式: A, B")
    const ceremoniesText = data.customUsage ? data.customUsage.replace("儀式: ", "") : "無";
    const pkgText = data.weddingPkg === 'bride_only' ? "新娘梳化 (女1)" : "新娘+新郎 (女1男1)";

    copyText = `📋 Harper’s makeup｜婚禮詢問單\n\n` +
               `姓名：${data.name}\n` +
               `電話：${data.phone}\n\n` +
               `婚期：${data.dates[0]}\n` +
               `地區：${data.city}\n\n` +
               `【 服務需求 】\n` +
               `儀式：${ceremoniesText}\n` +
               `宴客：${data.banquetType}\n` +
               `造型：${data.stylingCount}\n` +
               `方案：${pkgText}\n` +
               `親友：${data.familyCount} 位\n\n` +
               `跟妝：${data.followUp}\n` +
               `備註：${data.notes || "無"}\n\n` +
               `—\n想詢問這天的檔期與報價，謝謝！`;
  } else {
    // 💄 一般預約專用複製文案
    copyText = `📋 Harper’s makeup｜預約申請資料\n\n` +
               `姓名：${data.name}\n` +
               `電話：${data.phone}\n\n` +
               `活動類型：${data.purpose}\n` +
               `方案：${data.serviceType}\n\n` +
               `梳化地點：${data.city} ${data.locationType}\n` +
               `是否跟妝：${data.followUp}\n\n` +
               `日期：${data.dates.filter((d) => d).join(",")}\n` +
               `時段：${data.timeSlots.join(",")}\n` +
               `最晚完妝：${data.finishTimeH}:${data.finishTimeM}\n\n` +
               `人數：女${data.peopleCountFemale} 男${data.peopleCountMale}\n` +
               `備註：${data.notes || "無"}\n\n` +
               `—\n麻煩幫我確認檔期與費用，謝謝！`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    alert("已複製！請貼上至 Instagram 私訊。");
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-5 glass-card">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#f2f0eb] rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="text-[#8c8680] w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#5e5a56]">
            {isWedding ? "婚禮詢問單已建立 💍" : "預約申請只剩下最後一步"}
          </h3>
          <p className="text-xs text-[#a8a4a0] leading-relaxed">
            請將資料{" "}
            <span className="text-[#8c8680] font-bold underline">
              完整複製並傳送給 Harper
            </span>
            <br />
            {isWedding ? "以便為您確認檔期與詳細報價" : "方便確認檔期與費用後回覆 🤍"}
          </p>
        </div>
        
        {/* 預覽文字框 */}
        <div className="bg-[#faf9f6] p-4 rounded-xl text-[10px] text-[#5e5a56] leading-relaxed whitespace-pre-wrap font-mono border border-[#e6e2dc] max-h-40 overflow-y-auto">
          {copyText}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-xl bg-[#8c8680] text-white text-sm font-medium shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Copy className="w-4 h-4" /> 一鍵複製文字
          </button>
          <a
            href="https://www.instagram.com/haharper_makeup?igsh=NG9wbnNrd2dtdDU2&utm_source=qr"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 rounded-xl border border-[#e6e2dc] text-[#5e5a56] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#faf9f6] transition-colors"
          >
            <Instagram className="w-4 h-4" /> 前往 Instagram 私訊
          </a>
        </div>
        <button
          onClick={onClose}
          className="w-full text-xs text-[#a8a4a0] py-2"
        >
          關閉視窗
        </button>
      </div>
    </div>
  );
};

// --- 5. 後台管理系統 (Admin Dashboard) ---

// 服務工時對照表 [最小分鐘, 最大分鐘]
const DURATION_RANGES = {
  gen_single: [60, 60],     // 一般單妝 1hr
  gen_full: [90, 90],       // 一般妝髮 1.5hr
  exq_single: [60, 60],     // 精緻單妝 1hr
  exq_full: [90, 120],      // 精緻妝髮 1.5~2hr
  men_std: [30, 40],        // 男士 30~40min
  bride_reg: [90, 90],      // 新娘登記 1.5hr
  bride_pro: [90, 120],     // 新娘登記PRO 1.5~2hr
  groom: [30, 40],          // 新郎 30~40min
  family: [90, 90],         // 親友 1.5hr
};

const AdminDashboard = ({ onExit, isReady, db }) => {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [rawOrders, setRawOrders] = useState([]); // 原始資料
  
  // 篩選器狀態
  const [filterType, setFilterType] = useState("pending"); // pending, processing, completed, cancelled
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 詳情頁狀態
  const [selectedOrder, setSelectedOrder] = useState(null); // 當前選中的訂單 (物件)
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 初始化資料監聽
  useEffect(() => {
    if (!auth || !isReady) return;
    // 監聽所有訂單，依照建立時間排序
    const q = query(collection(db, "public_appointments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRawOrders(docs);
    });
    return () => unsubscribe();
  }, [auth, isReady, db]);

  // --- 邏輯處理 ---

  // 1. 訂單過濾邏輯
  const filteredOrders = useMemo(() => {
    return rawOrders.filter(order => {
      // 狀態篩選 (若無 status 欄位，預設為 pending)
      const currentStatus = order.status || "pending";
      if (filterType !== "all" && currentStatus !== filterType) return false;

      // 月份篩選 (YYYY-MM) - 比對 dates[0]
      if (filterMonth && order.dates && order.dates[0] && !order.dates[0].startsWith(filterMonth)) return false;

      // 縣市篩選
      if (filterCity && order.city !== filterCity) return false;

      // 關鍵字搜尋
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const text = `${order.name} ${order.phone} ${order.instagram} ${order.lineId || ''}`.toLowerCase();
        if (!text.includes(term)) return false;
      }

      return true;
    });
  }, [rawOrders, filterType, filterMonth, filterCity, searchTerm]);

  // 2. 刪除訂單
  const deleteItem = async (id) => {
    if (window.confirm("確定要刪除這筆預約嗎？刪除後無法復原喔！"))
      await deleteDoc(doc(db, "public_appointments", id));
  };
  
  // 登入介面
  if (!auth) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 bg-[#fdfbf7]">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center border border-[#e6e2dc]">
          <Lock className="w-6 h-6 text-[#8c8680]" />
        </div>
        <h3 className="text-xl font-serif text-[#5e5a56] tracking-wide">Harper's Backend</h3>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} 
          className="p-3 text-center border border-[#e6e2dc] rounded-xl outline-none focus:border-[#8c8680] bg-white w-64 shadow-inner" placeholder="Enter Password" />
        <button onClick={() => pass === "harper1132001" ? setAuth(true) : alert("密碼錯誤")} 
          className="bg-[#8c8680] text-white px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all">登入系統</button>
        <button onClick={onExit} className="text-xs text-[#a8a4a0] hover:text-[#5e5a56]">回前台</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f2] font-sans text-[#5e5a56] pb-20">
      {/* 上方導航與篩選區 */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e6e2dc] px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-serif text-[#5e5a56]">Order Management</h2>
          <div className="flex gap-2">
             <button onClick={() => setAuth(false)} className="px-4 py-2 text-xs border border-[#e6e2dc] rounded-full hover:bg-stone-50">登出</button>
             <button onClick={onExit} className="px-4 py-2 text-xs bg-[#8c8680] text-white rounded-full shadow hover:bg-[#7a746e]">回前台</button>
          </div>
        </div>
        
        {/* 篩選器列 */}
        <div className="flex flex-wrap items-center gap-3">
            {/* 狀態頁籤 */}
            <div className="flex bg-[#f2f0eb] p-1 rounded-lg">
                {['pending', 'processing', 'completed', 'cancelled', 'all'].map(type => (
                    <button key={type} onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === type ? 'bg-white text-[#8c8680] shadow-sm' : 'text-[#a8a4a0] hover:text-[#5e5a56]'}`}>
                        {type === 'pending' && '待審核'}
                        {type === 'processing' && '處理中'}
                        {type === 'completed' && '已結案'}
                        {type === 'cancelled' && '取消'}
                        {type === 'all' && '全部'}
                    </button>
                ))}
            </div>
            
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-3 py-1.5 text-xs border border-[#e6e2dc] rounded-lg outline-none bg-white" />
            
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="px-3 py-1.5 text-xs border border-[#e6e2dc] rounded-lg outline-none bg-white">
                <option value="">所有縣市</option>
                <option value="高雄">高雄</option>
                <option value="台南">台南</option>
                <option value="其他">其他</option>
            </select>

            <div className="relative flex-1 min-w-[150px]">
                <SearchIcon size={14} className="absolute left-3 top-2 text-[#a8a4a0]" />
                <input type="text" placeholder="搜尋姓名、電話..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#e6e2dc] rounded-lg outline-none focus:border-[#8c8680] bg-white" />
            </div>
        </div>
      </div>

      {/* 訂單列表區 */}
      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
         {filteredOrders.length === 0 ? (
             <div className="col-span-full text-center py-20 text-[#a8a4a0]">沒有符合條件的訂單</div>
         ) : (
             filteredOrders.map(order => (
                 <OrderCard key={order.id} order={order} 
                    onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }} 
                    onDelete={() => deleteItem(order.id)}
                 />
             ))
         )}
      </div>

      {/* 訂單詳情 Modal */}
      {isDetailOpen && selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => { setIsDetailOpen(false); setSelectedOrder(null); }} 
            db={db}
          />
      )}
    </div>
  );
};

// --- 子元件：訂單卡片 (列表用 - 含最晚完妝時間版) ---
const OrderCard = ({ order, onClick, onDelete }) => {
  // 狀態標籤顏色設定
  const statusColors = {
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-gray-100 text-gray-400 border-gray-200 grayscale"
  };
  const statusLabel = { pending: "待審核", processing: "處理中", completed: "已結案", cancelled: "已取消" };
  const curStatus = order.status || "pending";

  return (
      <div onClick={onClick} className={`bg-white rounded-[1.5rem] border border-[#e6e2dc] p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-3 ${curStatus === 'cancelled' ? 'opacity-60' : ''}`}>
          
          {/* 1. 頂部狀態與刪除 */}
          <div className="flex justify-between items-start">
              <div className={`px-3 py-1 text-[10px] font-bold rounded-full border ${statusColors[curStatus]}`}>
                  {statusLabel[curStatus]}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={16} />
              </button>
          </div>

          {/* 2. 核心大標題：姓名與日期 */}
          <div>
              <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#5e5a56]">{order.name}</h3>
                  <span className="text-xs text-[#a8a4a0]">({order.peopleCountFemale}女{order.peopleCountMale}男)</span>
              </div>
              
              {/* 🔥 時間資訊列 */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#8c8680]">
                  {/* 日期 */}
                  <span className="flex items-center gap-1 bg-[#faf9f6] px-2 py-1 rounded border border-[#f2f0eb]">
                      <Calendar size={12} /> {order.dates?.[0] || "未定"}
                  </span>
                  
                  {/* 開始時間 (若已排定) */}
                  <span className="flex items-center gap-1 bg-[#faf9f6] px-2 py-1 rounded border border-[#f2f0eb]">
                      <Clock size={12} /> {order.confirmedTime || order.timeSlots?.[0] || "未定"}
                  </span>

                  {/* 🔥 最晚完妝時間 (醒目顯示) */}
                  {(order.finishTimeH && order.finishTimeM) && (
                      <span className="flex items-center gap-1 bg-[#fff7ed] text-[#c2410c] px-2 py-1 rounded border border-[#ffedd5]">
                          <span className="text-[10px] opacity-70">最晚</span>
                          {order.finishTimeH}:{order.finishTimeM}
                      </span>
                  )}
              </div>
          </div>

          {/* 分隔線 */}
          <div className="h-px bg-[#f2f0eb] w-full"></div>

          {/* 3. 詳細資訊 Grid */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-[#5e5a56]">
              
              {/* 聯絡方式 */}
              <div className="col-span-2 flex gap-3">
                  <a href={`tel:${order.phone}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-1 hover:text-[#8c8680]">
                      <span className="bg-[#f2f0eb] p-1 rounded-full"><Briefcase size={10} /></span> 
                      {order.phone}
                  </a>
                  <a href={`https://instagram.com/${order.instagram.replace('@','')}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="flex items-center gap-1 hover:text-[#8c8680]">
                      <span className="bg-[#f2f0eb] p-1 rounded-full"><Instagram size={10} /></span> 
                      {order.instagram}
                  </a>
              </div>

              {/* 地點 */}
              <div className="col-span-2 flex items-start gap-2">
                  <MapPin size={14} className="text-[#d4cfc9] mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                      <span className="font-bold text-[#8c8680]">{order.city}</span> {order.locationType}
                  </span>
              </div>

              {/* 方案內容 (灰色底塊) */}
              <div className="col-span-2 bg-[#faf9f6] p-3 rounded-xl border border-[#f2f0eb] space-y-1">
                   <div className="text-[10px] font-bold text-[#a8a4a0] uppercase tracking-wider mb-1">Services</div>
                   <div className="font-medium leading-relaxed">
                      {order.serviceType}
                   </div>
                   {/* 如果有加購 */}
                   {order.addOns?.length > 0 && (
                      <div className="pt-1 mt-1 border-t border-[#e6e2dc] text-[10px] text-[#8c8680]">
                          + 加購: {order.addOns.map(a => a.name).join(", ")}
                      </div>
                   )}
                   {/* 如果有跟妝 */}
                   {order.followUp && order.followUp !== '不需要' && (
                       <div className="text-[10px] text-pink-500 font-bold">
                           * {order.followUp}
                       </div>
                   )}
              </div>

              {/* 備註 (如果有才顯示) */}
              {order.notes && (
                  <div className="col-span-2 bg-orange-50 p-2 rounded-lg border border-orange-100 text-[10px] text-[#8c6b5d] leading-relaxed">
                      <span className="font-bold">備註：</span>{order.notes}
                  </div>
              )}
          </div>

          {/* 4. 底部價格大字 */}
          <div className="mt-auto pt-2 flex justify-between items-end border-t border-[#f2f0eb]">
              <div className="text-[10px] text-[#a8a4a0]">
                  {order.isQuoteRequired ? "需另行報價項目" : "系統預估總額"}
              </div>
              <div className="text-xl font-serif font-bold text-[#8c8680]">
                  ${order.estimatedPrice?.toLocaleString()}
                  {order.isQuoteRequired && <span className="text-xs font-sans font-normal ml-1">起</span>}
              </div>
          </div>
      </div>
  );
};
// --- 子元件：訂單詳情 Modal (新增顯示最晚完妝時間) ---
const OrderDetailModal = ({ order, onClose, db }) => {
  const [data, setData] = useState({ ...order });
  const [activeTab, setActiveTab] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // 取消訂單專用狀態
  const [showCancelUI, setShowCancelUI] = useState(false);
  const [cancelOptions, setCancelOptions] = useState({ isRefund: false, otherReason: "" });

  // 地址常數
  const STUDIO_ADDR_KH = "813高雄市左營區富民路387巷25號2樓";
  const STUDIO_ADDR_TN = "702臺南市南區大同路二段100巷21弄10號";

  // 初始化資料
  useEffect(() => {
      let initData = { ...order };
      initData.status = initData.status || "pending";
      initData.confirmedDate = initData.confirmedDate || initData.dates?.[0] || "";
      initData.confirmedTime = initData.confirmedTime || "09:00";
      initData.quantities = initData.quantities || {};
      initData.addOns = initData.addOns || [];
      initData.locationType = initData.locationType || "";
      initData.customUsage = initData.customUsage || "";
      if (initData.followUpHours === undefined) initData.followUpHours = 0;
      
      // 確保最晚完妝時間有值 (舊資料防呆)
      initData.finishTimeH = initData.finishTimeH || "--";
      initData.finishTimeM = initData.finishTimeM || "--";

      // 自動帶入地點邏輯
      const isStudioKH = initData.locationType.includes("巨蛋");
      const isStudioTN = initData.locationType.includes("大同");
      if ((isStudioKH || isStudioTN) && !initData.venueFee) initData.venueFee = 300;
      if (!initData.address) {
          if (isStudioKH) initData.address = STUDIO_ADDR_KH;
          if (isStudioTN) initData.address = STUDIO_ADDR_TN;
      }
      setData(initData);
  }, [order]);

  // 計算邏輯
  const calcStats = useMemo(() => {
      let base = 0, baseMinMins = 0, baseMaxMins = 0;
      Object.entries(data.quantities || {}).forEach(([id, qty]) => {
          const svc = SERVICE_CATALOG.find(s => s.id === id);
          if (svc) base += svc.price * qty;
          const range = DURATION_RANGES[id] || [0, 0];
          baseMinMins += range[0] * qty;
          baseMaxMins += range[1] * qty;
      });

      const followUpHours = Number(data.followUpHours || 0);
      const followUpFee = followUpHours * 700;
      const followUpMins = followUpHours * 60;
      const totalMinMins = baseMinMins + followUpMins;
      const totalMaxMins = baseMaxMins + followUpMins;

      const addOnTotal = (data.addOns || []).reduce((sum, item) => sum + Number(item.price), 0);
      const locationFees = Number(data.venueFee || 0) + Number(data.travelFee || 0);
      const total = base + followUpFee + addOnTotal + locationFees - Number(data.discount || 0);

      let deposit = 0;
      if (data.usageType === 'wedding') deposit = Math.round(total * 0.3);
      else deposit = ((data.peopleCountFemale || 0) + (data.peopleCountMale || 0)) * 500;
      
      const tail = total - (data.depositPaid ? deposit : 0);
      const venueHours = Math.ceil(baseMaxMins / 60);

      let finishTimeStr = "--:--";
      if (data.confirmedTime) {
          const [h, m] = data.confirmedTime.split(':').map(Number);
          const endDate = new Date();
          endDate.setHours(h, m + totalMaxMins);
          finishTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      }

      return { 
          base, followUpFee, addOnTotal, total, deposit, tail, locationFees, 
          baseMinMins, baseMaxMins, totalMinMins, totalMaxMins, 
          venueHours, finishTimeStr 
      };
  }, [data]);

  // 儲存邏輯
  const handleSave = async (newData = {}, showMsg = true) => {
      setIsSaving(true);
      const finalData = { ...data, ...newData };
      const usageLabel = USAGE_TYPES.find(u => u.id === finalData.usageType)?.label || "未分類";
      finalData.purpose = finalData.usageType === 'other' ? `其他: ${finalData.customUsage}` : usageLabel;

      if (newData.tailPaid === true && finalData.status !== 'cancelled') finalData.status = 'completed';
      if (newData.tailPaid === false && finalData.status === 'completed') finalData.status = 'processing';

      try {
          await updateDoc(doc(db, "public_appointments", order.id), finalData);
          setData(finalData);
          if(showMsg) alert("儲存成功！");
      } catch (e) {
          console.error(e);
          alert("儲存失敗");
      }
      setIsSaving(false);
  };

  // 手動狀態變更
  const handleManualStatusChange = (newStatus) => {
      if (newStatus === 'cancelled') setShowCancelUI(true);
      else {
          const updateData = { status: newStatus };
          if (data.status === 'cancelled') updateData.cancelReason = "";
          handleSave(updateData);
      }
  };

  const confirmCancel = () => {
      const reasons = [];
      if (cancelOptions.isRefund) reasons.push("取消退訂金");
      if (cancelOptions.otherReason) reasons.push(cancelOptions.otherReason);
      handleSave({ status: 'cancelled', cancelReason: reasons.join(" / ") || "無填寫原因" });
      setShowCancelUI(false);
  };

  const copyConfirmText = () => {
      let detailLines = [];
      Object.entries(data.quantities || {}).forEach(([id, qty]) => {
          const svc = SERVICE_CATALOG.find(s => s.id === id);
          if (svc) detailLines.push(`• ${svc.name} x${qty} ($${(svc.price * qty).toLocaleString()})`);
      });
      if (data.followUpHours > 0) detailLines.push(`• 跟妝服務 (${data.followUpHours}hr) ($${calcStats.followUpFee.toLocaleString()})`);
      (data.addOns || []).forEach(item => detailLines.push(`• 加購: ${item.name} ($${Number(item.price).toLocaleString()})`));
      if (data.venueFee > 0) detailLines.push(`• 場地費 ($${Number(data.venueFee).toLocaleString()})`);
      if (data.travelFee > 0) detailLines.push(`• 車馬費 ($${Number(data.travelFee).toLocaleString()})`);
      if (data.discount > 0) detailLines.push(`• 折扣 (-$${Number(data.discount).toLocaleString()})`);

      const text = `那我這邊跟你確認一下方案唷❤️\n\n預約日期：${data.confirmedDate}\n\n地點：${data.city}\n${data.locationType}\n地址：${data.address || '待確認'}\n\n開妝時間：${data.confirmedTime}\n\n人數：女${data.peopleCountFemale} 男${data.peopleCountMale}\n\n方案：\n${data.serviceType}\n-\n\n訂單報價明細\n${detailLines.join('\n')}\n------------------\n總計：$${calcStats.total.toLocaleString()}\n-\n訂金：$${calcStats.deposit.toLocaleString()}\n-\n\n➡️匯款資料：\n（822）中國信託\n026890039663\n\n訂金匯款完成後再麻煩告知我一聲唷！`;
      navigator.clipboard.writeText(text);
      alert("已複製方案確認文！");
  };

  const getStatusStyle = (s) => {
      switch(s) {
          case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'completed': return 'bg-green-100 text-green-700 border-green-200';
          case 'cancelled': return 'bg-gray-100 text-gray-500 border-gray-200';
          default: return 'bg-gray-100 text-gray-500';
      }
  };
  const formatTimeRange = (min, max) => {
      const toStr = (m) => { const h = Math.floor(m/60); const min = m%60; return h > 0 ? (min > 0 ? `${h}h${min}m` : `${h}h`) : `${min}m`; }
      if (min === max) return toStr(min);
      return `${toStr(min)}~${toStr(max)}`;
  };

  return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#fdfbf7] h-full shadow-2xl overflow-y-auto animate-fade-in-right relative">
              
              {/* Header */}
              <div className="sticky top-0 z-20 bg-white border-b border-[#e6e2dc] px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                       <h2 className="text-lg font-bold text-[#5e5a56]">{data.name}</h2>
                       <div className="relative">
                           <select value={data.status} onChange={(e) => handleManualStatusChange(e.target.value)}
                              className={`text-[11px] py-1 pl-2 pr-6 rounded-lg border font-bold appearance-none cursor-pointer outline-none transition-colors ${getStatusStyle(data.status)}`}>
                               <option value="pending">待審核</option>
                               <option value="processing">處理中</option>
                               <option value="completed">已結案</option>
                               <option value="cancelled">取消</option>
                           </select>
                           <div className="absolute right-2 top-1.5 pointer-events-none opacity-50"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
                       </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-[#8c8680]"><XIcon size={20} /></button>
              </div>

              {/* Cancel UI */}
              {showCancelUI && (
                  <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in">
                      <div className="bg-white border border-[#e6e2dc] shadow-xl rounded-2xl p-6 w-full max-w-sm space-y-4">
                          <h3 className="text-lg font-bold text-[#5e5a56] text-center">確認取消訂單？</h3>
                          <div className="space-y-3">
                              <label className="flex items-center gap-3 p-3 border border-[#f2f0eb] rounded-xl cursor-pointer hover:bg-[#faf9f6]">
                                  <input type="checkbox" checked={cancelOptions.isRefund} onChange={e => setCancelOptions({...cancelOptions, isRefund: e.target.checked})} className="w-5 h-5 accent-[#8c8680]" />
                                  <span className="text-sm font-bold text-[#5e5a56]">取消退訂金</span>
                              </label>
                              <textarea placeholder="其他取消原因 (選填)..." value={cancelOptions.otherReason} onChange={e => setCancelOptions({...cancelOptions, otherReason: e.target.value})} className="w-full p-3 border border-[#f2f0eb] rounded-xl text-sm outline-none focus:border-[#8c8680] resize-none h-24"/>
                          </div>
                          <div className="flex gap-2 pt-2">
                              <button onClick={() => setShowCancelUI(false)} className="flex-1 py-3 rounded-xl border border-[#e6e2dc] text-[#a8a4a0] font-bold text-xs hover:bg-[#faf9f6]">暫不取消</button>
                              <button onClick={confirmCancel} className="flex-1 py-3 rounded-xl bg-[#8c8680] text-white font-bold text-xs shadow-lg hover:bg-[#7a746e]">確認取消</button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Status Bar */}
              <div className="px-6 py-4 bg-[#faf9f6] border-b border-[#e6e2dc]">
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#5e5a56] mb-3">
                       <label className="flex items-center gap-2 cursor-pointer select-none">
                           <input type="checkbox" checked={data.depositPaid} onChange={e => handleSave({ depositPaid: e.target.checked }, false)} className="accent-[#8c8680] w-4 h-4" />
                           <span className={data.depositPaid ? "text-[#5e5a56]" : "text-[#a8a4a0]"}>訂金已收 (${calcStats.deposit})</span>
                       </label>
                       {data.locationType?.includes('工作室') && (
                           <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" checked={data.venueBooked} onChange={e => handleSave({ venueBooked: e.target.checked }, false)} className="accent-[#8c8680] w-4 h-4" />
                              <span className={data.venueBooked ? "text-[#5e5a56]" : "text-[#a8a4a0]"}>場地已預約</span>
                           </label>
                       )}
                       <label className="flex items-center gap-2 cursor-pointer select-none">
                           <input type="checkbox" checked={data.makeupDone} onChange={e => handleSave({ makeupDone: e.target.checked }, false)} className="accent-[#8c8680] w-4 h-4" />
                           <span className={data.makeupDone ? "text-[#5e5a56]" : "text-[#a8a4a0]"}>梳化完成</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer select-none">
                           <input type="checkbox" checked={data.tailPaid} onChange={e => handleSave({ tailPaid: e.target.checked })} className="accent-[#8c8680] w-4 h-4" />
                           <span className={data.tailPaid ? "text-[#5e5a56]" : "text-[#a8a4a0]"}>結案 (尾款已結清)</span>
                       </label>
                  </div>

                  <div className="flex gap-2 mt-2">
                      {data.status === 'pending' && (
                          <>
                              <button onClick={() => {
                                  if(!data.confirmedDate || !data.confirmedTime) { alert("請先填寫「確定日期」與「開妝時間」後再接案！"); setActiveTab(3); return; }
                                  handleSave({ status: 'processing' });
                              }} className="flex-1 py-3 bg-[#8c8680] text-white rounded-xl shadow-md font-bold text-xs hover:bg-[#7a746e] transition-all">確定接案</button>
                              <button onClick={() => setShowCancelUI(true)} className="flex-1 py-3 bg-white border border-[#e6e2dc] text-[#5e5a56] rounded-xl font-bold text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">取消</button>
                          </>
                      )}
                      {data.status === 'completed' && <div className="w-full py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><CheckCircle size={14} /> 訂單已完美結案</div>}
                      {data.status === 'cancelled' && <div className="w-full py-2 px-3 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-xs"><span className="font-bold">已取消：</span> {data.cancelReason || "無填寫原因"}</div>}
                  </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#e6e2dc] sticky top-[70px] bg-[#fdfbf7] z-10 overflow-x-auto no-scrollbar">
                  {['1. 客戶資料', '2. 需求方案', '3. 檔期地點', '4. 報價加購', '5. 備註紀錄'].map((t, i) => (
                      <button key={i} onClick={() => setActiveTab(i+1)} className={`flex-shrink-0 px-5 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === i+1 ? 'border-[#8c8680] text-[#5e5a56]' : 'border-transparent text-[#a8a4a0] hover:text-[#8c8680]'}`}>{t}</button>
                  ))}
              </div>

              {/* Content */}
              <div className="p-6 pb-24 space-y-6">
                  {activeTab === 1 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-white p-5 rounded-xl border border-[#e6e2dc] space-y-4">
                              <FieldRead label="姓名" value={data.name} />
                              <FieldRead label="電話" value={data.phone} copy />
                              <FieldRead label="IG" value={data.instagram} link={`https://instagram.com/${data.instagram?.replace('@', '')}`} />
                              <InputGroup label="備用聯絡 LINE" value={data.lineId || ''} onChange={e => setData({...data, lineId: e.target.value})} />
                          </div>
                          <div className="flex justify-end"><SaveButton onClick={() => handleSave()} isSaving={isSaving} /></div>
                      </div>
                  )}
                  
                  {activeTab === 2 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-[#faf9f6] p-3 rounded-lg border border-[#e6e2dc] text-xs text-[#a8a4a0]"><span className="font-bold">原始需求：</span> {order.purpose || "無資料"}</div>
                          <div className="bg-white p-5 rounded-xl border border-[#e6e2dc] space-y-4">
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-[#a8a4a0]">梳化用途 (Type)</label>
                                  <select value={data.usageType} onChange={e => setData({...data, usageType: e.target.value})} className="w-full p-2 bg-[#faf9f6] rounded border border-[#e6e2dc] text-sm">{USAGE_TYPES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
                              </div>
                              {data.usageType === 'other' && (<div className="space-y-1 animate-fade-in"><label className="text-xs font-bold text-[#a8a4a0]">其他需求說明 (Custom Detail)</label><input type="text" value={data.customUsage} onChange={e => setData({...data, customUsage: e.target.value})} className="w-full p-2 border border-[#e6e2dc] rounded text-sm bg-[#faf9f6] focus:border-[#8c8680] outline-none" placeholder="請輸入具體需求..." /></div>)}
                              <div className="h-px bg-[#f2f0eb]"></div>
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-[#a8a4a0]">方案內容調整</label>
                                  {SERVICE_CATALOG.map(svc => (
                                      <div key={svc.id} className="flex justify-between items-center py-2 border-b border-dashed border-[#f2f0eb] last:border-0">
                                          <span className="text-sm text-[#5e5a56]">{svc.name} (${svc.price})</span>
                                          <div className="flex items-center gap-3"><button onClick={() => { const newQ = { ...data.quantities }; if ((newQ[svc.id] || 0) > 0) newQ[svc.id] = (newQ[svc.id] || 0) - 1; if (newQ[svc.id] === 0) delete newQ[svc.id]; setData({ ...data, quantities: newQ }); }} className="w-6 h-6 rounded bg-[#f2f0eb] text-[#8c8680]">-</button><span className="text-sm font-bold w-4 text-center">{data.quantities?.[svc.id] || 0}</span><button onClick={() => { const newQ = { ...data.quantities, [svc.id]: (data.quantities?.[svc.id] || 0) + 1 }; setData({ ...data, quantities: newQ }); }} className="w-6 h-6 rounded bg-[#f2f0eb] text-[#8c8680]">+</button></div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="flex justify-end"><SaveButton onClick={() => handleSave()} isSaving={isSaving} /></div>
                      </div>
                  )}

                  {/* Tab 3: 檔期地點 (🔥 新增最晚完妝時間顯示) */}
                  {activeTab === 3 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-xs text-[#8c6b5d] space-y-2">
                              <div><span className="font-bold">📅 客人首選：</span>{data.dates?.[0]}</div>
                              <div><span className="font-bold">⏰ 希望時段：</span>{data.timeSlots?.join("、")}</div>
                              {/* 新增這行：最晚完妝時間 */}
                              <div><span className="font-bold text-[#c2410c]">🎯 最晚完妝時間：{data.finishTimeH}:{data.finishTimeM}</span></div>
                              <div><span className="font-bold">💄 跟妝需求：</span>{order.followUp || "無"}</div>
                          </div>
                          
                          <h3 className="text-sm font-bold text-[#8c8680] mt-2 uppercase tracking-wider">Schedule</h3>
                          <div className="bg-white p-5 rounded-xl border border-[#e6e2dc] space-y-4">
                              <InputGroup label="確定日期 (Date)" type="date" value={data.confirmedDate} onChange={e => setData({...data, confirmedDate: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4">
                                  <InputGroup label="開妝時間 (Start)" type="time" value={data.confirmedTime} onChange={e => setData({...data, confirmedTime: e.target.value})} />
                                  <div className="space-y-1"><label className="text-xs font-bold text-[#a8a4a0]">跟妝加購時數 (hr)</label><input type="number" min="0" step="0.5" value={data.followUpHours} onChange={e => setData({...data, followUpHours: Number(e.target.value)})} className="w-full p-2 border border-[#e6e2dc] rounded text-sm bg-[#faf9f6] text-[#5e5a56] outline-none focus:border-[#8c8680]" /></div>
                              </div>
                              <div className="space-y-1"><label className="text-xs font-bold text-[#a8a4a0]">預計結束 (Finish)</label><div className="w-full p-2 border border-[#e6e2dc] rounded text-sm bg-[#faf9f6] text-[#5e5a56] font-bold">{calcStats.finishTimeStr}</div></div>
                              <div className="space-y-1"><label className="text-xs font-bold text-[#a8a4a0]">預估梳化時長</label><div className="w-full p-2 border border-[#e6e2dc] rounded text-sm bg-[#faf9f6] text-[#5e5a56] flex flex-col gap-1"><div className="flex justify-between"><span>基礎: {formatTimeRange(calcStats.baseMinMins, calcStats.baseMaxMins)}</span><span>+ 跟妝: {data.followUpHours}h</span></div><div className="text-[10px] text-[#a8a4a0] border-t border-[#e6e2dc] pt-1 mt-1 text-right">總計約: {formatTimeRange(calcStats.totalMinMins, calcStats.totalMaxMins)}</div></div></div>
                              <div className="space-y-1"><label className="text-xs font-bold text-[#a8a4a0]">場地預約時數</label><div className="w-full p-2 border border-[#e6e2dc] rounded text-sm bg-[#faf9f6] text-[#5e5a56]">建議：{calcStats.venueHours} 小時 <span className="text-[10px] text-[#a8a4a0] ml-1">(僅含梳化)</span></div></div>
                          </div>
                          <h3 className="text-sm font-bold text-[#8c8680] mt-2 uppercase tracking-wider">Location</h3>
                          <div className="bg-white p-5 rounded-xl border border-[#e6e2dc] space-y-4">
                              <div className="space-y-1">
                                  <label className="text-xs font-bold text-[#a8a4a0]">地點類型</label>
                                  <select value={data.locationType} onChange={(e) => { let newAddr = data.address; let newFee = data.venueFee; if(e.target.value.includes('巨蛋')){ newAddr = STUDIO_ADDR_KH; newFee = 300; } else if(e.target.value.includes('大同')){ newAddr = STUDIO_ADDR_TN; newFee = 300; } setData({...data, locationType: e.target.value, address: newAddr, venueFee: newFee}); }} className="w-full p-2 bg-[#faf9f6] rounded border border-[#e6e2dc] text-sm"><option value="合作工作室｜巨蛋站 (場地費$300)">合作工作室｜巨蛋站</option><option value="合作工作室｜大同路 (場地費$300)">合作工作室｜大同路</option><option value="到府服務 (報價)">到府服務</option><option value="協助找開妝點 (報價)">協助找開妝點</option></select>
                              </div>
                              <InputGroup label="詳細地址" value={data.address || ''} onChange={e => setData({...data, address: e.target.value})} />
                              <div className="grid grid-cols-2 gap-4"><InputGroup label="場地費" type="number" value={data.venueFee} onChange={e => setData({...data, venueFee: Number(e.target.value)})} /><InputGroup label="交通車馬費" type="number" value={data.travelFee} onChange={e => setData({...data, travelFee: Number(e.target.value)})} /></div>
                          </div>
                          <div className="flex justify-end"><SaveButton onClick={() => handleSave()} isSaving={isSaving} /></div>
                      </div>
                  )}

                  {activeTab === 4 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-[#5e5a56] text-white p-6 rounded-xl shadow-lg space-y-3">
                              <div className="flex justify-between text-xs opacity-80"><span>方案小計</span><span>${calcStats.base}</span></div>
                              {data.followUpHours > 0 && (<div className="flex justify-between text-xs opacity-80"><span>跟妝費 ({data.followUpHours}hr)</span><span>+ ${calcStats.followUpFee}</span></div>)}
                              <div className="flex justify-between text-xs opacity-80"><span>加購/場地/車馬</span><span>+ ${calcStats.addOnTotal + calcStats.locationFees}</span></div>
                              <div className="flex justify-between text-xs opacity-80"><span>折扣</span><span>- ${data.discount}</span></div>
                              <div className="h-px bg-white/20 my-2"></div>
                              <div className="flex justify-between items-end"><span className="font-bold">總報價</span><span className="text-2xl font-bold">${calcStats.total}</span></div>
                              <div className="bg-white/10 p-3 rounded-lg mt-2 space-y-1">
                                  <div className="flex justify-between text-xs"><span>訂金應收</span><span className="font-bold">${calcStats.deposit}</span></div>
                                  <div className="flex justify-between text-xs text-[#ffddd6]"><span>尾款應收</span><span className="font-bold">${calcStats.tail}</span></div>
                              </div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-[#e6e2dc] space-y-3">
                              <div className="flex justify-between items-center mb-2"><h4 className="text-xs font-bold text-[#8c8680]">加購項目</h4><button onClick={() => { const name = prompt("項目名稱"); const price = Number(prompt("金額", "0")); if(name) setData({...data, addOns: [...(data.addOns || []), { name, price }]}); }} className="text-xs bg-[#f2f0eb] px-2 py-1 rounded text-[#5e5a56]">+ 新增</button></div>
                              {data.addOns?.map((item, idx) => (<div key={idx} className="flex justify-between items-center text-sm border-b border-[#fcfbf9] pb-2 last:border-0"><span>{item.name}</span><div className="flex items-center gap-3"><span>${item.price}</span><button onClick={() => setData({...data, addOns: data.addOns.filter((_, i) => i !== idx)})} className="text-[#d4cfc9] hover:text-red-400"><Trash2 size={14} /></button></div></div>))}
                              <div className="pt-2 border-t border-[#f2f0eb]"><InputGroup label="折扣" type="number" value={data.discount} onChange={e => setData({...data, discount: Number(e.target.value)})} /></div>
                          </div>
                          <button onClick={copyConfirmText} className="w-full py-3 bg-[#5e5a56] text-white rounded-xl shadow-md font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#4a4744] transition-all"><Copy size={14} /> 複製方案確認文</button>
                          <div className="flex justify-end"><SaveButton onClick={() => handleSave()} isSaving={isSaving} /></div>
                      </div>
                  )}

                  {activeTab === 5 && (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-white p-5 rounded-xl border border-[#e6e2dc] space-y-4">
                              <div className="space-y-1"><label className="text-xs font-bold text-[#a8a4a0]">Harper 備註</label><textarea rows="4" value={data.adminNotes} onChange={e => setData({...data, adminNotes: e.target.value})} className="w-full p-3 bg-[#faf9f6] rounded border border-[#e6e2dc] text-sm outline-none resize-none" placeholder="內部備註..." /></div>
                              <div className="space-y-1"><label className="text-xs font-bold text-red-400">取消原因</label><input type="text" value={data.cancelReason} onChange={e => setData({...data, cancelReason: e.target.value})} className="w-full p-2 border border-red-100 bg-red-50 text-red-800 text-sm rounded" /></div>
                          </div>
                          <div className="flex justify-end"><SaveButton onClick={() => handleSave()} isSaving={isSaving} /></div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
};

// --- 輔助小元件 ---
const SearchIcon = ({size, className}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const XIcon = ({size}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Briefcase = ({size}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;

const FieldRead = ({ label, value, copy, link }) => (
    <div className="flex justify-between items-center border-b border-[#fcfbf9] pb-2 last:border-0">
        <span className="text-xs font-bold text-[#a8a4a0]">{label}</span>
        <div className="flex items-center gap-2">
            {link ? (
                <a href={link} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#5e5a56] hover:text-[#8c8680] border-b border-dashed border-[#8c8680]">{value || '-'}</a>
            ) : (
                <span className="text-sm font-medium text-[#5e5a56]">{value || '-'}</span>
            )}
            {copy && value && <button onClick={() => navigator.clipboard.writeText(value)} className="text-[#d4cfc9] hover:text-[#8c8680]"><Copy size={12} /></button>}
        </div>
    </div>
);

const InputGroup = ({ label, type = "text", value, onChange, placeholder }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-[#a8a4a0]">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} 
            className="w-full p-2 border border-[#e6e2dc] rounded text-sm bg-[#faf9f6] outline-none focus:border-[#8c8680] transition-colors" />
    </div>
);

const SaveButton = ({ onClick, isSaving }) => (
    <button onClick={onClick} disabled={isSaving} className="px-6 py-2 bg-[#5e5a56] text-white rounded-lg shadow font-bold text-xs hover:bg-[#4a4744] disabled:opacity-50 transition-all">
        {isSaving ? "儲存中..." : "儲存變更"}
    </button>
);
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
