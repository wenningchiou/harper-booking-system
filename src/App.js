import React, { useState, useEffect } from "react";
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
  Watch,
  Sun,
  Sparkles,
  Diamond,
  MessageCircle,
  Copy,
  Edit3,
  ShieldAlert,
  Lock,
  Trash2,
  CheckSquare,
  Loader2,
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
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- ⚠️⚠️⚠️ 請在此填入您的 Firebase Config ---
// 請將您的 apiKey 等資訊貼在這裡
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
  console.warn("⚠️ Firebase Config 未設定，目前為展示模式 (Demo Mode)");
}

const appId = "harpers-makeup-system";

const HarpersMakeup = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✨ 自動美化特效：注入樣式與字體 ✨
  useEffect(() => {
    // 1. 載入 Google Fonts (質感字體)
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const link = document.createElement("link");
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    // 2. 載入 Tailwind CSS (美觀樣式庫)
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }

    // 3. 注入韓系質感背景與毛玻璃 CSS
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
      `;
      document.head.appendChild(style);
    }

    // 初始化 Firebase 登入
    if (isFirebaseReady) {
      signInAnonymously(auth)
        .then(() => console.log("Guest Login"))
        .catch(console.error);
      onAuthStateChanged(auth, setUser);
    } else {
      setUser({ uid: "demo-user" });
    }
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
      await new Promise((r) => setTimeout(r, 800)); // Demo 延遲
    }
    setBookingData(data);
    setShowModal(true);
    setIsSubmitting(false);
  };

  if (isAdminMode)
    return (
      <AdminDashboard
        onExit={() => setIsAdminMode(false)}
        user={user}
        isReady={isFirebaseReady}
        db={db}
      />
    );

  return (
    <div className="pb-24 min-h-screen relative font-sans text-stone-600">
      {/* 頂部導航 (毛玻璃特效) */}
      <nav className="sticky top-0 z-40 glass-card px-6 py-4 flex justify-between items-center shadow-sm">
        <h1
          className="text-xl font-serif font-bold tracking-widest text-[#8c8680] cursor-pointer"
          onClick={() => setActiveTab("home")}
        >
          Harper's
        </h1>
        <button onClick={() => setIsAdminMode(true)}>
          <Lock size={16} className="text-stone-300 hover:text-[#8c8680]" />
        </button>
      </nav>

      {/* 主要內容 */}
      <main className="px-5 pt-6 animate-fade-in max-w-md mx-auto">
        {activeTab === "home" && <HomeSection onChangeTab={setActiveTab} />}
        {activeTab === "services" && <ServiceSection />}
        {activeTab === "pricing" && <PriceSection />}
        {activeTab === "faq" && <FaqSection />}
        {activeTab === "rules" && <RulesSection />}
        {activeTab === "booking" && (
          <BookingForm
            onSubmit={handleBookingSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>

      {/* 底部導航 (陰影浮動效果) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 pb-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-between items-end text-[10px] font-medium text-stone-400 max-w-md mx-auto">
          <NavBtn
            icon={Star}
            label="介紹"
            active={activeTab === "services"}
            onClick={() => setActiveTab("services")}
          />
          <NavBtn
            icon={Info}
            label="價目"
            active={activeTab === "pricing"}
            onClick={() => setActiveTab("pricing")}
          />

          <div className="relative -top-5">
            <button
              onClick={() => setActiveTab("booking")}
              className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transform transition-transform active:scale-95 ${
                activeTab === "booking"
                  ? "bg-[#756f6a] ring-4 ring-[#e6e2dc]"
                  : "bg-[#8c8680]"
              }`}
            >
              <Calendar className="text-white w-6 h-6" />
            </button>
          </div>

          <NavBtn
            icon={CheckCircle}
            label="須知"
            active={activeTab === "rules"}
            onClick={() => setActiveTab("rules")}
          />
          <NavBtn
            icon={MessageCircle}
            label="QA"
            active={activeTab === "faq"}
            onClick={() => setActiveTab("faq")}
          />
        </div>
      </div>

      {showModal && bookingData && (
        <SuccessModal
          data={bookingData}
          onClose={() => {
            setShowModal(false);
            setActiveTab("home");
          }}
        />
      )}
    </div>
  );
};

// --- 子組件 ---
const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${
      active ? "text-[#8c8680]" : "hover:text-stone-500"
    }`}
  >
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
    <button
      onClick={() => onChangeTab("booking")}
      className="px-10 py-4 rounded-full bg-[#8c8680] text-white tracking-[0.2em] text-xs font-bold shadow-lg shadow-[#8c8680]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
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
        <h3 className="text-lg font-bold text-[#5e5a56] mb-3 font-serif">
          彩妝師 Harper
        </h3>
        <p className="text-[#8c8680] text-sm leading-loose text-justify tracking-wide font-light">
          我是彩妝師
          Harper，擅長日韓系乾淨質感妝容，依照個人五官比例、膚況與活動需求，打造適合你的妝容。
          <br />
          <br />
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
      <PriceCard
        title="一般妝髮"
        price="2,000"
        desc="以自然乾淨的妝感為主。適用於日常聚會、證件照、面試等場合。"
        warning="一般妝髮不包含假睫毛與妝面飾品，如有需求請選擇精緻妝髮。"
      />
      <PriceCard
        title="精緻妝髮"
        price="2,500"
        desc="加強整體妝容細緻度，妝感更完整、穩定。適用於寫真拍攝、活動表演、重要場合等需求的活動。"
        highlight
      />
      <PriceCard
        title="男士妝髮"
        price="1,500"
        desc="基礎底妝、眉型修整、髮型吹整"
      />
    </div>
    <div className="space-y-4 pt-4">
      <CategoryHeader title="WEDDING SERIES" />
      <div className="relative p-6 rounded-2xl bg-white border border-[#e6e2dc] shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-20">
          <Diamond size={48} className="text-[#8c8680]" />
        </div>
        <h3 className="text-lg font-medium text-[#5e5a56] mb-4 font-serif">
          Marriage Registration
        </h3>
        <div className="space-y-3">
          <PriceRow label="新娘登記一般妝髮" price="2,500" />
          <PriceRow label="新娘登記精緻妝髮" price="3,000" />
          <PriceRow label="新郎妝髮" price="1,500" />
          <PriceRow label="親友妝容" price="2,000" />
        </div>
      </div>
      <div className="p-5 rounded-2xl border border-dashed border-[#d4cfc9] text-center bg-[#fcfbf9]">
        <h3 className="text-sm font-medium text-[#5e5a56] flex items-center justify-center gap-2 mb-1">
          <Sparkles size={16} /> 婚禮 / 新秘服務
        </h3>
        <p className="text-xs text-[#a8a4a0]">請填寫預約單，將依需求另行報價</p>
      </div>
    </div>
  </div>
);

const FaqSection = () => {
  const [idx, setIdx] = useState(null);
  const faqs = [
    {
      q: "一般妝髮和精緻妝髮差在哪？",
      a: "兩者主要差別在於妝面的細節處理與完整度。\n一般妝髮以自然、乾淨為主，適合聚會或不需強烈上鏡的場合；\n精緻妝髮則會加強底妝細緻度、眼妝層次與整體持妝表現，更適合拍攝、重要活動或希望妝感更完整的需求。\n\n另外，一般妝髮方案不包含假睫毛及貼鑽、緞帶等妝面飾品。\n若有假睫毛或妝面飾品的需求，請選擇精緻妝髮方案唷 🤍",
    },
    {
      q: "婚禮／結婚登記可以選一般妝髮方案嗎？",
      a: "不建議，也無法適用。\n婚禮／結婚登記屬於時間不可延誤、會被大量拍攝紀錄的重要場合，對妝容的細緻度、持妝穩定度與流程安排要求更高，才能確保當天呈現與服務品質。",
    },
    {
      q: "送出預約表單就算預約成功了嗎？",
      a: "還不算。\n送出表單僅代表「提出預約申請」，需經 Harper 確認檔期、回覆報價並完成訂金付款後，預約才算正式成立。",
    },
    {
      q: "訂金是多少？什麼時候要付？",
      a: "訂金為每位 NT$500，\n例如梳化人數為 2 位，訂金即為 NT$1000，以此類推。\n完成訂金付款並收到 Harper 回覆確認後，才會為您保留時段。",
    },
    {
a: (
      <span>
        可以。
        <br />
        因事改期請於至少 3 天前告知，並以一次為限。
        <br />
        若場地租借空間無法退款，將由訂金中扣除相關費用後退回餘款。
        <br />
        <strong>請勿於當天臨時取消或未到，訂金恕不退回，敬請理解。</strong>
      </span>
    ),
    },
    {
      q: "到府梳化會加收費用嗎？",
      a: "會。\n到府梳化之車馬費將依距離、時段與地點另行報價，實際費用將以 Harper 回覆確認為準。",
    },
    {
      q: "跟妝一定要加購嗎？",
      a: "不一定。\n是否需要跟妝會依活動性質、時數與現場狀況評估。\n若不確定是否有跟妝需求，也可以請 Harper 協助評估是否需要加購。",
    },
    {
      q: "如果臨時無法抵達或晚到怎麼辦？",
      a: "當然希望大家都能準時抵達開妝，但路況或突發狀況難免發生。\n若確定會晚到，請提前告知，讓我可以協助調整流程。\n若因遲到影響可服務時間，妝髮完整度將以不影響下一位客人為前提進行調整，敬請見諒。",
    },
    {
      q: "有皮膚敏感、針眼或近期醫美可以化妝嗎？",
      a: "請務必事先告知。\n如有針眼、皮膚病、過敏或近期醫美療程，Harper 會評估是否適合上妝，必要時也會建議改期，以保障您與其他客人的健康與安全。",
    },
    {
      q: "可以指定妝感或提供參考圖嗎？",
      a: "可以。\n建議於梳化前提供 1–3 張妝感或造型參考圖。\n若沒有明確想法，也非常歡迎提供當天服裝或整體風格，讓我一起和你討論並給予建議 ❤️\nHarper 會依您的五官比例、膚況與活動需求，調整出最適合您的妝容風格。",
    },
  ];
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Q & A" subtitle="常見問題" />
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#e6e2dc] overflow-hidden"
          >
            <button
              onClick={() => setIdx(idx === i ? null : i)}
              className="w-full px-6 py-4 text-left flex justify-between items-center group"
            >
              <span className="text-sm font-medium text-[#5e5a56] pr-4">
                {f.q}
              </span>
              {idx === i ? (
                <ChevronUp size={16} className="text-[#8c8680]" />
              ) : (
                <ChevronDown size={16} className="text-[#d4cfc9]" />
              )}
            </button>
            {idx === i && (
              <div className="px-6 pb-6 pt-0 text-xs text-[#8c8680] leading-relaxed whitespace-pre-wrap">
                <div className="h-px w-full bg-[#fcfbf9] mb-3"></div>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RulesSection = () => {
  const rules = [
    {
      t: "預約成立說明",
      c: "送出預約表單僅代表提出預約申請，不代表預約成功。\n預約需經 Harper 確認檔期、回覆報價，並完成訂金後，才算正式成立並保留時段。",
    },
    {
      t: "訂金與付款",
      c: "訂金為每位 NT$500（依梳化人數計算）。\n完成訂金付款並收到確認回覆後，才會保留您的預約時段。\n尾款請於梳化結束當下結清。",
    },
    {
      t: "改期與取消",
      c: "如需改期，請於至少 3 天前告知，並以一次為限。\n若場地租借空間無法退款，將自訂金中扣除相關費用後退回餘款。\n當天臨時取消或未到，訂金恕不退回，敬請理解。",
    },
    {
      t: "梳化地點與額外費用",
      c: "合作工作室需視當日空檔狀況，實際使用將以 Harper 與場地方確認回覆為準。\n到府梳化之車馬費，將依距離、時段與地點另行報價。\n若選擇「依活動地點附近協助找開妝點」，場地費需另行報價；若距離較遠將加收車馬費。",
    },
    {
      t: "跟妝與妝面飾品",
      c: "跟妝屬加購服務，是否需要將依活動性質、時數與現場狀況評估。\n如有跟妝需求請務必事先告知，因檔期與行程安排不一定可臨時加購。\n方案內容不包含妝面飾品。如需飾品，可加購租借方案（依實際品項報價）。\n若有特殊指定飾品需求，請自行準備。\n若需協助採購花材等造型素材，請務必事先告知，且需另行報價。",
    },
    {
      t: "時間與遲到",
      c: "請準時抵達開妝時間，並確保可立即開始服務。\n若因遲到影響可服務時間，妝髮完整度將以不影響下一位客人為前提進行調整，敬請見諒。",
    },
    {
      t: "健康與安全告知",
      c: "如有針眼、皮膚病、過敏或近期醫美療程，請務必事先告知。\nHarper 將評估是否適合上妝，必要時可能建議改期，以保障雙方。",
    },
    {
      t: "其他說明",
      c: "請自行保管個人物品與貴重物品。\n若有其他未列事項，將依實際溝通內容與 Harper 回覆為準。",
    },
  ];
  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Notice" subtitle="預約須知" />
      <div className="space-y-4">
        {rules.map((r, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl shadow-sm border border-[#e6e2dc]"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#f2f0eb] text-[#8c8680] text-xs font-serif font-bold">
                {i + 1}
              </span>
              <h4 className="text-sm font-bold text-[#5e5a56]">{r.t}</h4>
            </div>
            <p className="text-xs text-[#8c8680] leading-relaxed whitespace-pre-line pl-9">
              {r.c}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const BookingForm = ({ onSubmit, isSubmitting }) => {
  const [data, setData] = useState({
    name: "",
    phone: "",
    instagram: "",
    purpose: "",
    customPurpose: "",
    serviceType: "",
    peopleCountFemale: "1",
    peopleCountMale: "0",
    dates: ["", "", ""],
    timeSlots: [],
    finishTimeH: "09",
    finishTimeM: "00",
    city: "",
    locationType: "",
    followUp: "",
    notes: "",
    agreement1: false,
    agreement2: false,
    agreement3: false,
  });
  const [errors, setErrors] = useState({});

  const handleServiceSelect = (itemName) => {
    setData((p) => ({ ...p, serviceType: itemName }));
    if (itemName.includes("一般") || itemName.includes("General"))
      alert(
        "【一般妝髮提醒】\n\n此方案不包含假睫毛與妝面飾品。\n如有需求，請選擇「精緻妝髮」方案唷！"
      );
  };
  const handleChange = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const toggleTimeSlot = (slot) => {
    const current = data.timeSlots;
    if (current.includes(slot))
      setData((p) => ({ ...p, timeSlots: current.filter((s) => s !== slot) }));
    else setData((p) => ({ ...p, timeSlots: [...current, slot] }));
  };
  const handleCityChange = (e) =>
    setData((prev) => ({ ...prev, city: e.target.value, locationType: "" }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !data.name ||
      !data.phone ||
      !data.instagram ||
      !data.purpose ||
      !data.serviceType ||
      !data.dates[0] ||
      !data.city ||
      !data.locationType ||
      !data.followUp
    )
      return alert("請填寫所有必填欄位");
    if (data.purpose === "其他" && !data.customPurpose)
      return alert("請填寫活動內容");
    if (data.timeSlots.length === 0) return alert("請選擇可配合時段");
    if (!data.agreement1 || !data.agreement2 || !data.agreement3)
      return alert("請勾選所有同意事項");
    onSubmit(data);
  };

  const purposes = [
    "婚禮 新秘服務",
    "結婚登記",
    "拍攝 / 寫真",
    "演唱會 / 應援",
    "正式活動 / 晚宴",
    "面試 / 證件",
    "日常 / 聚會",
    "其他",
  ];
  const getServices = () => {
    if (data.purpose === "婚禮 新秘服務")
      return [
        { name: "婚禮/新秘服務 (另行報價)", price: "另計", time: "專人報價" },
      ];
    if (data.purpose === "結婚登記")
      return [
        { name: "新娘登記一般妝髮", price: "NT$2500", time: "1-1.5hr" },
        { name: "新娘登記精緻妝髮", price: "NT$3000", time: "1.5-2hr" },
        { name: "新郎妝髮", price: "NT$1500", time: "30-60min" },
        { name: "親友妝容", price: "NT$2000", time: "40-60min" },
      ];
    return [
      { name: "一般方案｜單妝容", price: "NT$1600", time: "40-60min" },
      { name: "一般方案｜整體妝髮", price: "NT$2000", time: "1-1.5hr" },
      { name: "精緻方案｜單妝容", price: "NT$2000", time: "1-1.5hr" },
      { name: "精緻方案｜整體妝髮", price: "NT$2500", time: "1.5-2hr" },
      { name: "男士方案｜單妝容", price: "NT$1000", time: "30-40min" },
      { name: "男士方案｜整體妝髮", price: "NT$1500", time: "30-60min" },
    ];
  };

  return (
    <div className="space-y-6 pb-20">
      <SectionHeader title="Reservation" subtitle="立即預約" />
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#e6e2dc] space-y-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <InputBox
            icon={User}
            label="姓名"
            required
            value={data.name}
            onChange={(v) => handleChange("name", v)}
            ph="姓名"
          />
          <InputBox
            icon={Send}
            label="電話"
            required
            value={data.phone}
            onChange={(v) => handleChange("phone", v)}
            ph="手機"
          />
        </div>
        <InputBox
          icon={Instagram}
          label="Instagram"
          required
          value={data.instagram}
          onChange={(v) => handleChange("instagram", v)}
          ph="@您的ID"
        />

        <div className="space-y-3">
          <Label icon={Smile} text="梳化用途" />
          <div className="grid grid-cols-2 gap-2">
            {purposes.map((p) => (
              <SelectBadge
                key={p}
                active={data.purpose === p}
                onClick={() => handleChange("purpose", p)}
              >
                {p}
              </SelectBadge>
            ))}
          </div>
          {data.purpose === "其他" && (
            <InputBox
              icon={Edit3}
              label="活動內容"
              required
              value={data.customPurpose}
              onChange={(v) => handleChange("customPurpose", v)}
              ph="例：公司尾牙..."
            />
          )}
        </div>

        {data.purpose && (
          <div className="space-y-3 animate-fade-in">
            <Label icon={Heart} text="選擇方案" />
            <div className="space-y-2">
              {getServices().map((svc) => (
                <div
                  key={svc.name}
                  onClick={() => handleServiceSelect(svc.name)}
                  className={`p-4 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                    data.serviceType === svc.name
                      ? "bg-[#f2f0eb] border-[#8c8680]"
                      : "border-[#f2f0eb] hover:bg-[#faf9f6]"
                  }`}
                >
                  <span className="text-sm font-medium text-[#5e5a56]">
                    {svc.name}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#8c8680]">
                      {svc.price}
                    </div>
                    <div className="text-[10px] text-[#a8a4a0]">{svc.time}</div>
                  </div>
                </div>
              ))}
            </div>
            {data.serviceType.includes("一般") && (
              <div className="text-[10px] bg-orange-50 text-orange-800 p-2 rounded-lg">
                提醒：一般妝髮不含假睫毛與飾品。
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Label icon={Calendar} text="日期與時段" />
          <span className="text-xs text-[#8c8680] w-12 flex-shrink-0 font-bold">
            首選日期
          </span>
          <input
            type="date"
            required
            value={data.dates[0]}
            onChange={(e) => {
              const d = [...data.dates];
              d[0] = e.target.value;
              handleChange("dates", d);
            }}
            className="w-full p-2.5 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none"
          />

          <div className="flex gap-2">
            <span className="text-xs text-[#8c8680] w-8 flex-shrink-0 font-bold">
              候補日期
            </span>
            <input
              type="date"
              placeholder="候補1"
              value={data.dates[1]}
              onChange={(e) => {
                const d = [...data.dates];
                d[1] = e.target.value;
                handleChange("dates", d);
              }}
              className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none"
            />
            <input
              type="date"
              placeholder="候補2"
              value={data.dates[2]}
              onChange={(e) => {
                const d = [...data.dates];
                d[2] = e.target.value;
                handleChange("dates", d);
              }}
              className="w-full p-3 bg-[#faf9f6] rounded-xl border border-[#e6e2dc] text-sm text-[#5e5a56] outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[#8c8680] w-30 flex-shrink-0 font-bold">
              梳化時段（可複選）
            </span>
            {[
              "凌晨 (07:00前)",
              "早上 (07:00-12:00)",
              "下午 (12:00-17:00)",
              "傍晚 (17:00-19:00)",
            ].map((t) => (
              <SelectBadge
                key={t}
                active={data.timeSlots.includes(t)}
                onClick={() => toggleTimeSlot(t)}
              >
                {t}
              </SelectBadge>
            ))}
          </div>
          {data.timeSlots.includes("凌晨 (07:00前)") && (
            <div className="text-[10px] text-orange-800 bg-orange-50 p-2 rounded">
              早妝需加收 NT$700/hr 鐘點費。
            </div>
          )}

          <div className="bg-[#faf9f6] p-3 rounded-xl flex items-center justify-between border border-[#e6e2dc]">
            <span className="text-xs text-[#8c8680] font-bold pl-1">
              最晚完妝
            </span>
            <div className="flex items-center gap-1">
              <select
                value={data.finishTimeH}
                onChange={(e) => handleChange("finishTimeH", e.target.value)}
                className="bg-transparent font-serif text-lg outline-none"
              >
                {[...Array(24).keys()].map((i) => (
                  <option key={i} value={String(i).padStart(2, "0")}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={data.finishTimeM}
                onChange={(e) => handleChange("finishTimeM", e.target.value)}
                className="bg-transparent font-serif text-lg outline-none"
              >
                <option value="00">00</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label icon={MapPin} text="地點" />
          <select
            value={data.city}
            onChange={handleCityChange}
            className="w-full p-3 rounded-xl border border-[#e6e2dc] bg-[#faf9f6] text-sm text-[#5e5a56] outline-none"
          >
            <option value="" disabled>
              請選擇縣市
            </option>
            <option value="高雄">高雄</option>
            <option value="台南">台南</option>
            <option value="其他">其他縣市</option>
          </select>
          {data.city && (
            <div className="space-y-2 animate-fade-in">
              {data.city === "高雄" && (
                <RadioBox
                  checked={data.locationType.includes("工作室")}
                  onClick={() =>
                    handleChange(
                      "locationType",
                      "合作工作室｜巨蛋站 (場地費$300)"
                    )
                  }
                  title="合作工作室｜巨蛋站"
                  subtitle="場地費 $300"
                />
              )}
              {data.city === "台南" && (
                <RadioBox
                  checked={data.locationType.includes("工作室")}
                  onClick={() =>
                    handleChange(
                      "locationType",
                      "合作工作室｜大同路 (場地費$300)"
                    )
                  }
                  title="合作工作室｜大同路"
                  subtitle="場地費 $300"
                />
              )}
              <RadioBox
                checked={data.locationType.includes("到府")}
                onClick={() => handleChange("locationType", "到府服務 (報價)")}
                title="到府服務"
                subtitle="車馬費另計"
              />
              <RadioBox
                checked={data.locationType.includes("協助找")}
                onClick={() =>
                  handleChange("locationType", "協助找開妝點 (報價)")
                }
                title="協助找開妝點"
                subtitle="場地/車馬費另計"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label icon={Users} text="跟妝加購" />
          <div className="space-y-2">
            {["不需要", "需要 ($700/hr)", "不確定，請Harper協助評估"].map(
              (o) => (
                <RadioBox
                  key={o}
                  checked={data.followUp === o}
                  onClick={() => handleChange("followUp", o)}
                  title={`${o}`}
                />
              )
            )}
          </div>
          <div className="flex gap-2">
            <Label icon={Users} text="梳化人數" />
            <div className="bg-[#faf9f6] flex-1 p-3 rounded-xl border border-[#e6e2dc] flex justify-between items-center">
              <span className="text-xs text-[#8c8680]">女</span>
              <select
                value={data.peopleCountFemale}
                onChange={(e) =>
                  handleChange("peopleCountFemale", e.target.value)
                }
                className="bg-transparent font-bold outline-none"
              >
                {[...Array(10).keys()].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-[#faf9f6] flex-1 p-3 rounded-xl border border-[#e6e2dc] flex justify-between items-center">
              <span className="text-xs text-[#8c8680]">男</span>
              <select
                value={data.peopleCountMale}
                onChange={(e) =>
                  handleChange("peopleCountMale", e.target.value)
                }
                className="bg-transparent font-bold outline-none"
              >
                {[...Array(10).keys()].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            value={data.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="w-full p-3 rounded-xl border border-[#e6e2dc] bg-[#faf9f6] text-sm outline-none resize-none"
            rows="2"
            placeholder="備註（非必填）..."
          />
        </div>

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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-full bg-[#8c8680] text-white font-medium tracking-[0.1em] shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            "傳送中..."
          ) : (
            <>
              送出預約申請 <Send size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const SuccessModal = ({ data, onClose }) => {
  const copyText = `📋 Harper’s makeup｜預約申請資料\n\n姓名：${
    data.name
  }\n電話：${data.phone}\n\n活動類型：${
    data.purpose === "其他" ? data.customPurpose : data.purpose
  }\n方案：${data.serviceType}\n\n梳化地點：${data.city} ${
    data.locationType
  }\n是否跟妝：${data.followUp}\n\n日期：${data.dates
    .filter((d) => d)
    .join(",")}\n時段：${data.timeSlots.join(",")}\n最晚完妝：${
    data.finishTimeH
  }:${data.finishTimeM}\n\n人數：女${data.peopleCountFemale} 男${
    data.peopleCountMale
  }\n備註：${data.notes || "無"}\n\n—\n麻煩幫我確認檔期與費用，謝謝！`;
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
            預約申請只剩下最後一步
          </h3>
          <p className="text-xs text-[#a8a4a0] leading-relaxed">
            請將資料{" "}
            <span className="text-[#8c8680] font-bold underline">
              完整複製並傳送給 Harper
            </span>
            ，<br />
            方便確認檔期與費用後回覆 🤍
          </p>
        </div>
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

const AdminDashboard = ({ onExit, user, isReady, db }) => {
  const [data, setData] = useState([]);
  const [pass, setPass] = useState("");
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    if (!auth || !isReady || !db) return;
    const q = query(
      collection(db, "public_appointments"),
      orderBy("createdAt", "desc")
    );
    onSnapshot(q, (ss) =>
      setData(ss.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [auth, isReady, db]);

  const deleteItem = async (id) => {
    if (window.confirm("確定要刪除這筆預約嗎？刪除後無法復原喔！"))
      await deleteDoc(doc(db, "public_appointments", id));
  };

  // 尚未設定資料庫的提示
  if (!isReady)
    return (
      <div className="h-screen flex items-center justify-center text-xs text-red-400">
        尚未設定資料庫，無法使用後台
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
            pass === "harper888" ? setAuth(true) : alert("密碼錯誤")
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

  // 登入後的管理介面
  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 pt-10 px-5 font-sans">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-[#5e5a56]">預約管理</h2>
          <p className="text-xs text-[#a8a4a0] mt-1">
            目前共有{" "}
            <span className="text-[#8c8680] font-bold">{data.length}</span>{" "}
            筆預約資料
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-xs bg-white border border-[#e6e2dc] text-[#5e5a56] px-4 py-2 rounded-full shadow-sm hover:bg-[#faf9f6]"
        >
          登出
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-dashed border-[#d4cfc9]">
          <p className="text-[#a8a4a0]">目前尚無任何預約資料</p>
        </div>
      )}

      {data.map((item) => (
        <div
          key={item.id}
          className="bg-white p-6 rounded-[2rem] border border-[#e6e2dc] shadow-sm space-y-4 relative overflow-hidden group hover:shadow-md transition-all"
        >
          {/* 左側裝飾線 */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8c8680]"></div>

          {/* 頂部：時間與刪除 */}
          <div className="flex justify-between items-start pl-2">
            <span className="text-[10px] font-bold text-[#a8a4a0] bg-[#faf9f6] px-2 py-1 rounded-md">
              填表時間：
              {item.createdAt?.toDate
                ? new Date(item.createdAt.toDate()).toLocaleString()
                : "剛剛"}
            </span>
            <button
              onClick={() => deleteItem(item.id)}
              className="p-2 -mr-2 -mt-2 text-[#d4cfc9] hover:text-red-400 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* 客人基本資料 */}
          <div className="flex items-center justify-between border-b border-[#f2f0eb] pb-4 pl-2">
            <div>
              <div className="text-xl font-bold text-[#5e5a56] flex items-center gap-2">
                {item.name}
                <a
                  href={`https://instagram.com/${item.instagram.replace(
                    "@",
                    ""
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-normal text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full no-underline hover:underline"
                >
                  IG: {item.instagram}
                </a>
              </div>
              <div className="text-sm text-[#8c8680] font-medium mt-1">
                {item.phone}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#a8a4a0]">梳化人數</div>
              <div className="text-sm font-bold text-[#5e5a56]">
                女 {item.peopleCountFemale} / 男 {item.peopleCountMale}
              </div>
            </div>
          </div>

          {/* 詳細內容區塊 */}
          <div className="space-y-2 pl-2">
            {/* 方案與用途 */}
            <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#f2f0eb]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#a8a4a0] uppercase tracking-wider">
                  Service
                </span>
              </div>
              <div className="text-sm text-[#5e5a56] font-medium">
                {item.purpose === "其他" ? item.customPurpose : item.purpose}
              </div>
              <div className="text-xs text-[#8c8680] mt-0.5">
                {item.serviceType}
              </div>
            </div>

            {/* 時間與地點 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#f2f0eb]">
                <div className="text-[10px] font-bold text-[#a8a4a0] mb-1">
                  DATE
                </div>
                <div className="text-xs text-[#5e5a56] font-bold">
                  {item.dates[0]} (首選)
                </div>
                {(item.dates[1] || item.dates[2]) && (
                  <div className="text-[10px] text-[#a8a4a0] mt-1">
                    候: {item.dates[1]} {item.dates[2]}
                  </div>
                )}
              </div>
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#f2f0eb]">
                <div className="text-[10px] font-bold text-[#a8a4a0] mb-1">
                  INFO
                </div>
                <div className="text-xs text-[#5e5a56]">
                  {item.city} {item.locationType}
                </div>
                <div className="text-[10px] text-[#8c8680] mt-1 border-t border-[#e6e2dc] pt-1">
                  完妝: {item.finishTimeH}:{item.finishTimeM}
                </div>
              </div>
            </div>

            {/* 額外資訊 */}
            <div className="flex gap-2 text-[10px] text-[#8c8680] px-1">
              <span className="bg-stone-100 px-2 py-1 rounded">
                時段: {item.timeSlots?.join(", ")}
              </span>
              <span
                className={`px-2 py-1 rounded ${
                  item.followUp.includes("需要")
                    ? "bg-pink-50 text-pink-500"
                    : "bg-stone-100"
                }`}
              >
                跟妝: {item.followUp}
              </span>
            </div>
          </div>

          {/* 備註欄位 (有填寫才會顯示) */}
          {item.notes && (
            <div className="mt-3 bg-orange-50 p-4 rounded-xl border border-orange-100 ml-2">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle size={12} className="text-orange-400" />
                <span className="text-xs font-bold text-orange-800/70">
                  客人備註
                </span>
              </div>
              <p className="text-sm text-[#5e5a56] leading-relaxed">
                {item.notes}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
const SectionHeader = ({ title, subtitle }) => (
  <div className="text-center mb-6">
    <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#d4cfc9] uppercase mb-1">
      {title}
    </h4>
    <h2 className="text-xl font-serif font-medium text-[#5e5a56] tracking-wide">
      {subtitle}
    </h2>
  </div>
);
const CategoryHeader = ({ title }) => (
  <div className="flex items-center gap-4 px-2">
    <span className="h-px flex-1 bg-[#e6e2dc]"></span>
    <span className="text-[10px] font-bold text-[#a8a4a0] tracking-[0.2em]">
      {title}
    </span>
    <span className="h-px flex-1 bg-[#e6e2dc]"></span>
  </div>
);
const PriceCard = ({ title, price, desc, highlight, warning }) => (
  <div
    className={`relative p-5 rounded-2xl border transition-all ${
      highlight
        ? "bg-white border-[#d4cfc9] shadow-sm"
        : "bg-white/50 border-transparent hover:bg-white hover:shadow-sm"
    }`}
  >
    {highlight && (
      <span className="absolute top-0 right-0 bg-[#8c8680] text-white text-[10px] px-3 py-1 rounded-bl-xl rounded-tr-xl">
        POPULAR
      </span>
    )}
    <div className="flex justify-between items-baseline mb-2">
      <h3 className="text-base font-medium text-[#5e5a56]">{title}</h3>
      <span className="text-lg font-serif text-[#8c8680]">NT$ {price}</span>
    </div>
    <p className="text-xs text-[#a8a4a0] leading-relaxed">{desc}</p>
    {warning && (
      <div className="mt-2 text-[10px] text-orange-800 bg-orange-50 p-2 rounded">
        {warning}
      </div>
    )}
  </div>
);
const PriceRow = ({ label, price }) => (
  <div className="flex justify-between items-center pb-2 border-b border-[#f2f0eb] last:border-0 last:pb-0">
    <span className="text-sm text-[#5e5a56]">{label}</span>
    <span className="font-serif text-[#8c8680]">NT$ {price}</span>
  </div>
);
const InputBox = ({ icon: Icon, label, required, value, onChange, ph }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-[#8c8680] pl-1 flex items-center gap-2">
      <Icon size={12} /> {label} {required && "*"}
    </label>
    <div className="bg-[#faf9f6] p-3 rounded-xl border border-transparent focus-within:border-[#d4cfc9] focus-within:bg-white transition-all">
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full outline-none text-[#5e5a56] text-sm bg-transparent placeholder:text-[#d4cfc9]"
        placeholder={ph}
      />
    </div>
  </div>
);
const Label = ({ icon: Icon, text }) => (
  <label className="text-xs font-bold text-[#8c8680] pl-1 flex items-center gap-2 mb-1">
    <Icon size={12} /> {text}
  </label>
);
const SelectBadge = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 rounded-xl border text-center text-xs cursor-pointer transition-all w-full ${
      active
        ? "bg-[#8c8680] text-white border-[#8c8680]"
        : "bg-[#faf9f6] text-[#5e5a56] border-[#e6e2dc]"
    }`}
  >
    {children}
  </button>
);
const RadioBox = ({ checked, onClick, title, subtitle }) => (
  <div
    onClick={onClick}
    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
      checked
        ? "bg-[#f2f0eb] border-[#8c8680]"
        : "border-[#e6e2dc] bg-[#faf9f6]"
    }`}
  >
    <div
      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
        checked ? "border-[#8c8680]" : "border-gray-300"
      }`}
    >
      {checked && <div className="w-2 h-2 rounded-full bg-[#8c8680]"></div>}
    </div>
    <div>
      <div className="text-sm text-[#5e5a56]">{title}</div>
      {subtitle && <div className="text-[10px] text-[#a8a4a0]">{subtitle}</div>}
    </div>
  </div>
);
const CheckBox = ({ checked, onClick, text }) => (
  <label className="flex gap-3 items-start cursor-pointer group">
    <input
      type="checkbox"
      required
      checked={checked}
      onChange={onClick}
      className="mt-0.5 accent-[#8c8680] w-4 h-4 cursor-pointer flex-shrink-0"
    />
    <span
      className={`text-xs leading-relaxed transition-colors ${
        checked ? "text-[#57534e]" : "text-[#a8a4a0] group-hover:text-[#8c8680]"
      }`}
    >
      {text}
    </span>
  </label>
);

export default HarpersMakeup;
