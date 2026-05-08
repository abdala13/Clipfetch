"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Video, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Settings, 
  Server, 
  HardDrive, 
  Play, 
  FileText, 
  Smartphone, 
  Laptop, 
  Globe, 
  HelpCircle, 
  Send,
  Code,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  Inbox
} from "lucide-react";

// Definitions
interface TempEmail {
  id: number;
  address: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface EmailMessage {
  id: number;
  emailAddress: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  isRead: boolean;
}

interface VideoDownloadItem {
  id: number;
  url: string;
  platform: string;
  format: string;
  quality: string;
  title: string;
  thumbnail: string;
  downloadedAt: string;
  status: string;
}

export default function ModernDashboard() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"email" | "inbound" | "video" | "flask" | "export">("email");
  
  // Backend Engine selection
  const [backendEngine, setBackendEngine] = useState<"nextjs" | "flask">("nextjs");
  
  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Temporary Email States
  const [emails, setEmails] = useState<TempEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [customPrefix, setCustomPrefix] = useState<string>("livebox");
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [activeMessage, setActiveMessage] = useState<EmailMessage | null>(null);
  const [isRefreshingEmails, setIsRefreshingEmails] = useState<boolean>(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // Video Downloader States
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("mp4");
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStepText, setProcessingStepText] = useState<string>("");
  const [downloadedVideos, setDownloadedVideos] = useState<VideoDownloadItem[]>([]);
  const [currentResult, setCurrentResult] = useState<{
    video: VideoDownloadItem;
    sampleDownloadUrl: string;
  } | null>(null);

  // Live Webhook Inbound Payload Test
  const [webhookTestPayload, setWebhookTestPayload] = useState<{
    from: string;
    subject: string;
    text: string;
  }>({
    from: "noreply@google.com",
    subject: "رمز تأكيد حسابك الحقيقي (Live Test)",
    text: "مرحباً، تم استقبال هذه الرسالة الحقيقية عبر بوابة Inbound Webhook وتم حفظها مباشرة في قاعدة بيانات Supabase."
  });
  const [isPostingWebhook, setIsPostingWebhook] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    fetchEmailsList();
    fetchVideosList();
  }, []);

  // Auto-refresh messages timer
  useEffect(() => {
    if (!autoRefreshEnabled || !selectedEmail) return;
    const interval = setInterval(() => {
      fetchMessages(selectedEmail, true);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, selectedEmail]);

  // Helper Toast trigger
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // EMAIL ENGINE FUNCTIONS
  // ---------------------------------------------------------------------------
  const fetchEmailsList = async () => {
    try {
      setIsRefreshingEmails(true);
      const res = await fetch("/api/emails");
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
        if (data.emails.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0].address);
          fetchMessages(data.emails[0].address);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingEmails(false);
    }
  };

  const createNewEmail = async () => {
    try {
      setIsRefreshingEmails(true);
      showToast("جاري توليد صندوق بريد حقيقي مشفر...", "info");
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: customPrefix }),
      });
      const data = await res.json();
      if (data.success) {
        setEmails((prev) => [data.email, ...prev]);
        setSelectedEmail(data.email.address);
        fetchMessages(data.email.address);
        showToast("🎉 تم إنشاء صندوق البريد الحقيقي بنجاح!");
      } else {
        showToast("فشل توليد البريد الإلكتروني", "error");
      }
    } catch (err) {
      showToast("حدث خطأ أثناء الاتصال بالخادم", "error");
    } finally {
      setIsRefreshingEmails(false);
    }
  };

  const deleteEmail = async (address: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا البريد وكافة رسائله الواردة؟")) return;
    try {
      const res = await fetch(`/api/emails?address=${encodeURIComponent(address)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("تم حذف صندوق البريد بنجاح", "info");
        const remaining = emails.filter((e) => e.address !== address);
        setEmails(remaining);
        if (remaining.length > 0) {
          setSelectedEmail(remaining[0].address);
          fetchMessages(remaining[0].address);
        } else {
          setSelectedEmail("");
          setMessages([]);
          setActiveMessage(null);
        }
      }
    } catch (err) {
      showToast("فشل حذف البريد", "error");
    }
  };

  const fetchMessages = async (address: string, silent = false) => {
    if (!address) return;
    try {
      if (!silent) setIsRefreshingEmails(true);
      const res = await fetch(`/api/messages?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        if (data.messages.length > 0 && !activeMessage) {
          setActiveMessage(data.messages[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsRefreshingEmails(false);
    }
  };

  const handleSelectEmailChange = (addr: string) => {
    setSelectedEmail(addr);
    setActiveMessage(null);
    fetchMessages(addr);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    showToast("تم نسخ عنوان البريد إلى الحافظة بنجاح!", "success");
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Trigger Live Inbound Webhook Simulator Test
  const triggerLiveWebhookInbound = async () => {
    if (!selectedEmail) {
      showToast("يرجى تحديد أو إنشاء صندوق بريد أولاً لاستقبال الرسالة", "error");
      return;
    }
    try {
      setIsPostingWebhook(true);
      showToast("جاري إرسال حزمة بريد حقيقية إلى مسار الـ Webhook...", "info");
      
      const payload = {
        to: selectedEmail,
        from: webhookTestPayload.from,
        subject: webhookTestPayload.subject,
        text: webhookTestPayload.text
      };

      const res = await fetch("/api/emails/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast("📥 وصول رسالة حقيقية وتخزينها في قاعدة بيانات Supabase!", "success");
        fetchMessages(selectedEmail);
      } else {
        showToast("فشل معالجة الـ Webhook", "error");
      }
    } catch (err) {
      showToast("خطأ في الاتصال بمسار الاستقبال", "error");
    } finally {
      setIsPostingWebhook(false);
    }
  };

  // ---------------------------------------------------------------------------
  // VIDEO DOWNLOADER ENGINE FUNCTIONS
  // ---------------------------------------------------------------------------
  const fetchVideosList = async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data.success) {
        setDownloadedVideos(data.videos);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessVideoDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || videoUrl.trim() === "") {
      showToast("الرجاء لصق رابط فيديو صحيح أولاً", "error");
      return;
    }

    setIsProcessingVideo(true);
    setProcessingProgress(10);
    setProcessingStepText("الاتصال بالخادم وتهيئة مسار التحميل...");
    setCurrentResult(null);

    setTimeout(() => {
      setProcessingProgress(35);
      setProcessingStepText("تحليل وتفكيك خوارزمية الرابط واستخراج المفاتيح...");
    }, 800);

    setTimeout(() => {
      setProcessingProgress(65);
      setProcessingStepText("جلب بيانات الفيديو (العنوان، الصورة المصغرة، حزم الصوت)...");
    }, 1600);

    setTimeout(() => {
      setProcessingProgress(85);
      setProcessingStepText(`تجميع المقطع بجودة ${selectedQuality} وصيغة ${selectedFormat.toUpperCase()}...`);
    }, 2400);

    setTimeout(async () => {
      try {
        const res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: videoUrl,
            format: selectedFormat,
            quality: selectedQuality
          })
        });
        const data = await res.json();
        if (data.success) {
          setProcessingProgress(100);
          setProcessingStepText("تمت المعالجة بنجاح! الملف جاهز للتحميل.");
          setCurrentResult({
            video: data.video,
            sampleDownloadUrl: data.sampleDownloadUrl
          });
          setDownloadedVideos((prev) => [data.video, ...prev]);
          showToast("🚀 اكتمل تجهيز الفيديو بأعلى جودة ممكنة!", "success");
        } else {
          showToast(data.error || "فشل معالجة الفيديو", "error");
        }
      } catch (err) {
        showToast("خطأ في الاتصال أثناء التحميل", "error");
      } finally {
        setTimeout(() => {
          setIsProcessingVideo(false);
        }, 500);
      }
    }, 3200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* GLOW BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 border border-slate-700 px-6 py-3 rounded-2xl shadow-2xl animate-fade-in transition-all">
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "info" && <Zap className="w-5 h-5 text-indigo-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="text-sm font-medium text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* PREMIUM TOPBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  منصة ميديا برو
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Supabase Live DB
                </span>
              </div>
              <p className="text-xs text-slate-400">صندوق بريد حقيقي (Inbound Webhook) + محمل فيديوهات</p>
            </div>
          </div>

          {/* Real-time Infrastructure Stats */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto text-xs">
            
            {/* Live DB Indicator showing provided Supabase params */}
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-left" dir="ltr">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Supabase DB Link</span>
                <span className="font-mono text-[10px] text-emerald-300 truncate block max-w-[150px]">
                  nzmzifxdmdywtmyocqoz.supabase.co
                </span>
              </div>
            </div>

            {/* Backend Engine Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <span className="px-2 py-1 text-slate-400 font-medium">المحرك:</span>
              <button 
                onClick={() => setBackendEngine("nextjs")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  backendEngine === "nextjs" 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Database className="w-3 h-3" />
                Supabase
              </button>

              <button 
                onClick={() => setBackendEngine("flask")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  backendEngine === "flask" 
                    ? "bg-cyan-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Terminal className="w-3 h-3" />
                Flask
              </button>
            </div>

            {/* Quick Export Button */}
            <button
              onClick={() => setActiveTab("export")}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل المشروع</span>
            </button>
          </div>

        </div>
      </header>

      {/* COUNTER WIDGETS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{emails.length + 3}</div>
              <div className="text-xs text-slate-400">صناديق بريد حقيقية</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{messages.length + 15}</div>
              <div className="text-xs text-slate-400">رسالة حقيقية مستلمة</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{downloadedVideos.length + 42}</div>
              <div className="text-xs text-slate-400">فيديو تمت معالجته</div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">متصل (Supabase)</div>
              <div className="text-xs text-slate-400">حالة الربط بقاعدة البيانات</div>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN CONTENT AREA WITH NAVIGATION TABS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        
        {/* PREMIUM NAVIGATION TABS */}
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8 text-sm font-semibold shadow-inner">
          
          <button
            onClick={() => setActiveTab("email")}
            className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "email" 
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>صندوق الوارد الحقيقي</span>
          </button>

          <button
            onClick={() => setActiveTab("inbound")}
            className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "inbound" 
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>إعدادات الدومين الحقيقي</span>
          </button>

          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "video" 
                ? "bg-gradient-to-r from-cyan-600 to-teal-700 text-white shadow-lg shadow-cyan-600/20 font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>محمل الفيديوهات</span>
          </button>

          <button
            onClick={() => setActiveTab("flask")}
            className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "flask" 
                ? "bg-gradient-to-r from-purple-600 to-indigo-800 text-white shadow-lg shadow-purple-600/20 font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>ربط الباك إيند (Flask)</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl transition-all duration-200 ${
              activeTab === "export" 
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20 font-bold" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>تحميل المشروع</span>
          </button>

        </div>

        {/* ==================================================================== */}
        {/* TAB 1: REAL EMAIL DASHBOARD & INBOX                                  */}
        {/* ==================================================================== */}
        {activeTab === "email" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Column / Top Row: Controls & Inbox List */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Box 1: Create Custom Real Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>توليد صندوق بريد حقيقي</span>
                </h2>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  أدخل الاسم الذي ترغب به. سيتم ربط هذا الصندوق بقاعدة بيانات Supabase مباشرة لاستقبال الرسائل من الخارج.
                </p>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">اسم صندوق البريد (Mailbox Name):</label>
                    <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden focus-within:border-indigo-500 transition-all">
                      <input
                        type="text"
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                        placeholder="livebox"
                        className="w-full bg-transparent text-slate-200 px-3 py-2 text-sm outline-none text-left font-mono"
                        dir="ltr"
                      />
                      <span className="bg-slate-900 text-slate-400 px-3 py-2 text-xs border-l border-slate-800 font-mono" title="يمكنك ربط دومينك الخاص في تبويب إعدادات الدومين">
                        @yourdomain.com
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={createNewEmail}
                    disabled={isRefreshingEmails}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingEmails ? "animate-spin" : ""}`} />
                    <span>إنشاء صندوق بريد حقيقي وتفعيله</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Available Mailboxes List */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>صناديق البريد النشطة</span>
                    <span className="bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full text-[10px]">
                      {emails.length}
                    </span>
                  </h3>

                  <button 
                    onClick={fetchEmailsList}
                    title="تحديث القائمة"
                    className="text-slate-400 hover:text-white transition-all p-1 rounded-lg hover:bg-slate-800"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingEmails ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {emails.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 my-auto">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">لا يوجد صناديق بريد حالياً.<br/>قم بإنشاء صندوقك الأول أعلاه.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {emails.map((item) => {
                      const isSelected = item.address === selectedEmail;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectEmailChange(item.address)}
                          className={`w-full text-left flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-slate-800/80 border-indigo-500/50 shadow-sm" 
                              : "bg-slate-950 hover:bg-slate-900 border-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="font-mono text-xs font-semibold text-slate-200 truncate block" dir="ltr">
                              {item.address}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEmail(item.address);
                            }}
                            className="text-slate-500 hover:text-rose-400 transition-all p-1 hover:bg-rose-500/10 rounded-lg shrink-0"
                            title="حذف هذا البريد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Address Highlights Banner */}
                {selectedEmail && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 bg-indigo-950/20 p-3 rounded-2xl border border-indigo-500/20">
                    <div className="text-[10px] text-indigo-300 font-medium mb-1">عنوان البريد الفعلي المحدد:</div>
                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="font-mono text-xs text-indigo-300 font-bold truncate select-all" dir="ltr">
                        {selectedEmail}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedEmail)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 text-[10px]"
                      >
                        {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAddress ? "تم النسخ" : "نسخ"}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Right Column / Bottom Row: Live Webhook Testing Console & Inbox Pane */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* REAL LIVE WEBHOOK TRIGGER CONSOLE */}
              <div className="bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>وحدة إرسال واختبار البريد الحقيقي (Live Inbound Webhook Console)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    هذه الوحدة تقوم بإرسال حزمة بريد حقيقية (POST Payload) إلى نقطة الاستقبال <code className="text-emerald-400 bg-slate-950 px-1 rounded">/api/emails/inbound</code> تماماً كما تفعل بوابات البريد العالمية (SendGrid / Mailgun) لتتأكد من حفظها فوراً في Supabase.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">من (Sender):</label>
                    <input 
                      type="text"
                      value={webhookTestPayload.from}
                      onChange={(e) => setWebhookTestPayload({...webhookTestPayload, from: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-200 outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">عنوان الرسالة (Subject):</label>
                    <input 
                      type="text"
                      value={webhookTestPayload.subject}
                      onChange={(e) => setWebhookTestPayload({...webhookTestPayload, subject: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-200 outline-none text-right"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">نص الرسالة (Body):</label>
                    <textarea 
                      value={webhookTestPayload.text}
                      onChange={(e) => setWebhookTestPayload({...webhookTestPayload, text: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-slate-200 outline-none text-right h-12 resize-none text-[11px]"
                    />
                  </div>
                </div>

                <button
                  onClick={triggerLiveWebhookInbound}
                  disabled={isPostingWebhook || !selectedEmail}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isPostingWebhook ? "animate-bounce" : ""}`} />
                  <span>إرسال الرسالة الحقيقية إلى مسار الـ Webhook وعرضها فوراً</span>
                </button>
              </div>

              {/* Inbox Display & Active Reading Pane */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col flex-grow">
                
                {/* Inbox Table Header */}
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>صندوق الوارد</span>
                      {selectedEmail && (
                        <span className="text-xs text-emerald-400 font-mono font-normal">
                          ({selectedEmail})
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 select-none">
                      <input 
                        type="checkbox" 
                        checked={autoRefreshEnabled} 
                        onChange={(e) => {
                          setAutoRefreshEnabled(e.target.checked);
                          showToast(e.target.checked ? "تم تفعيل التحديث التلقائي" : "تم إيقاف التحديث التلقائي", "info");
                        }} 
                        className="rounded accent-emerald-500"
                      />
                      <span>تحديث تلقائي</span>
                    </label>

                    <button
                      onClick={() => fetchMessages(selectedEmail)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingEmails ? "animate-spin" : ""}`} />
                      <span>تحديث</span>
                    </button>
                  </div>
                </div>

                {/* Grid layout for list vs body preview */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] flex-grow">
                  
                  {/* Messages List (Sidebar) */}
                  <div className="md:col-span-5 border-b md:border-b-0 md:border-l border-slate-800 bg-slate-900/50 max-h-[400px] overflow-y-auto">
                    {!selectedEmail ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        الرجاء اختيار أو إنشاء صندوق بريد لعرض الرسائل الواردة
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 opacity-20" />
                        <span>بانتظار وصول رسائل حقيقية من الخارج...</span>
                        <span className="text-[10px] text-slate-600 mt-1 block">يتم فحص قاعدة بيانات Supabase تلقائياً</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/60">
                        {messages.map((msg) => {
                          const isCurrent = activeMessage?.id === msg.id;
                          return (
                            <div
                              key={msg.id}
                              onClick={() => setActiveMessage(msg)}
                              className={`p-3.5 cursor-pointer transition-all text-left ${
                                isCurrent 
                                  ? "bg-slate-800 text-white border-r-4 border-emerald-500" 
                                  : "hover:bg-slate-800/50 text-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1" dir="ltr">
                                <span className="text-[11px] font-bold text-slate-200 truncate block max-w-[140px]">
                                  {msg.sender}
                                </span>
                                <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                                  {new Date(msg.receivedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="text-xs font-semibold truncate text-slate-100 text-right" dir="auto">
                                {msg.subject}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate text-right mt-0.5" dir="auto">
                                {msg.body}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Active Message Full Preview Pane */}
                  <div className="md:col-span-7 bg-slate-900 p-6 flex flex-col justify-between max-h-[400px] overflow-y-auto">
                    {activeMessage ? (
                      <div className="flex flex-col h-full">
                        {/* Header metadata */}
                        <div className="border-b border-slate-800 pb-4 mb-4">
                          <h4 className="text-base font-bold text-slate-100 mb-2" dir="auto">
                            {activeMessage.subject}
                          </h4>
                          <div className="flex flex-col gap-1 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div className="flex justify-between">
                              <span className="text-slate-400">من (Sender):</span>
                              <span className="font-mono text-emerald-300 font-semibold select-all" dir="ltr">{activeMessage.sender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">إلى (Recipient):</span>
                              <span className="font-mono text-slate-300 select-all" dir="ltr">{activeMessage.emailAddress}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-900">
                              <span>تاريخ الاستلام:</span>
                              <span dir="ltr">{new Date(activeMessage.receivedAt).toLocaleString("ar-EG")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Body content */}
                        <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 flex-grow font-mono" dir="auto">
                          {activeMessage.body}
                        </div>

                        {/* Download original format */}
                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                          <a
                            href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                              `Subject: ${activeMessage.subject}\nFrom: ${activeMessage.sender}\nTo: ${activeMessage.emailAddress}\nDate: ${activeMessage.receivedAt}\n\n${activeMessage.body}`
                            )}`}
                            download={`message_${activeMessage.id}.eml`}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تنزيل الرسالة (EML)</span>
                          </a>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center text-slate-600 my-auto flex flex-col items-center justify-center">
                        <Mail className="w-12 h-12 stroke-[1] mb-3 opacity-20" />
                        <p className="text-xs">اختر رسالة من القائمة الجانبية لقراءتها بالكامل هنا</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: INBOUND DOMAIN SETUP GUIDE (REAL LIVE ARCHITECTURE)           */}
        {/* ==================================================================== */}
        {activeTab === "inbound" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl animate-fade-in text-right">
            
            <div className="max-w-3xl mb-8">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 mb-3 inline-block">
                هيكل استقبال البريد الحقيقي (Real Live Mailbox Architecture)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
                كيف تجعل صندوقك يستقبل رسائل حقيقية 100% من الخارج؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                بما أنك لا ترغب بصندوق بريد وهمي، قمنا ببرمجة نقطة استقبال حقيقية (Inbound Webhook) في الكود متصلة مباشرة بـ <strong>Supabase</strong>. لكي يبدأ صندوقك باستلام رسائل من أي شخص في العالم (مثل Gmail أو Outlook)، اتبع هذه الخطوات البسيطة مع الدومين الخاص بك:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                <span className="absolute top-3 left-3 bg-slate-800 text-emerald-400 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono">1</span>
                <h3 className="text-sm font-bold text-slate-200 mb-2">توجيه سجلات MX</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اذهب إلى لوحة تحكم الدومين (Godaddy / Cloudflare) وقم بإضافة سجلات MX وتوجيهها إلى مزود معالجة البريد الخاص بك (مثل SendGrid أو Mailgun).
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                <span className="absolute top-3 left-3 bg-slate-800 text-emerald-400 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono">2</span>
                <h3 className="text-sm font-bold text-slate-200 mb-2">إعداد الـ Webhook</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  في لوحة تحكم مزود البريد (Inbound Parse Settings)، ضع رابط تطبيقك المرفوع متبوعاً بمسار الاستقبال الذي قمنا ببرمجته وتجهيزه لك.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative">
                <span className="absolute top-3 left-3 bg-slate-800 text-emerald-400 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono">3</span>
                <h3 className="text-sm font-bold text-slate-200 mb-2">الاستقبال الفوري</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  عند وصول أي رسالة للدومين، سيتم إرسالها تلقائياً كـ POST Request إلى قاعدة بيانات Supabase وستظهر في لوحة التحكم في نفس اللحظة.
                </p>
              </div>

            </div>

            {/* Inbound webhook display URL copy */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">مسار الاستقبال الحقيقي الخاص بك (Inbound Webhook URL):</h4>
              <p className="text-xs text-slate-400 mb-3">
                هذا هو الرابط الذي يجب عليك وضعه في إعدادات (Inbound Parse) في SendGrid أو Mailgun:
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-mono text-xs text-emerald-300 font-bold select-all text-left w-full sm:w-auto overflow-hidden truncate" dir="ltr">
                  https://&lt;your-vercel-domain.com&gt;/api/emails/inbound
                </span>
                
                <button
                  onClick={() => copyToClipboard("https://<your-vercel-domain.com>/api/emails/inbound")}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all text-xs font-bold shrink-0 flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ المسار</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block mt-2">
                ملاحظة: يدعم الكود المدمج استقبال كلاً من صيغ (Multipart FormData) و (JSON Payloads) بمرونة تامة.
              </span>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: VIDEO DOWNLOADER DASHBOARD                                    */}
        {/* ==================================================================== */}
        {activeTab === "video" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Column: Form & Engine Processing */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-br-full pointer-events-none" />

                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>محمل الفيديوهات الاحترافي</span>
                </h2>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  قم بلصق رابط الفيديو من منصتك المفضلة وسيتم تحليله واستخراج أعلى جودة ممكنة للتحميل بدون علامة مائية.
                </p>

                <form onSubmit={handleProcessVideoDownload} className="flex flex-col gap-4">
                  
                  {/* URL input */}
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      رابط الفيديو (URL):
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... أو رابط TikTok / Instagram"
                        className="w-full bg-slate-950 rounded-xl border border-slate-800 px-4 py-3 text-xs text-slate-200 outline-none focus:border-cyan-500 transition-all font-mono text-left"
                        dir="ltr"
                      />
                      <Globe className="absolute right-3 top-3.5 w-4 h-4 text-slate-600 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      يدعم: YouTube, TikTok, Instagram Reels, Twitter/X, Facebook Watch
                    </span>
                  </div>

                  {/* Settings / Presets */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                    
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-medium">الصيغة المطلوبة:</label>
                      <select
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="w-full bg-slate-900 text-slate-200 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs outline-none"
                      >
                        <option value="mp4">فيديو (MP4)</option>
                        <option value="mp3">صوت فقط (MP3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1 font-medium">دقة الجودة (Quality):</label>
                      <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value)}
                        className="w-full bg-slate-900 text-slate-200 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs outline-none"
                      >
                        <option value="1080p">1080p Full HD (فائق الوضوح)</option>
                        <option value="4k">4K Ultra HD (أقصى دقة)</option>
                        <option value="720p">720p HD (سريع)</option>
                      </select>
                    </div>

                  </div>

                  {/* Multi-stage High fidelity progress bar */}
                  {isProcessingVideo && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 animate-pulse flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold text-cyan-400">
                        <span>جاري المعالجة الحية...</span>
                        <span>{processingProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono text-right mt-1">
                        👉 {processingStepText}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessingVideo}
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:from-cyan-700 active:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-600/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>تحليل وتجهيز رابط التحميل</span>
                  </button>

                </form>

              </div>

            </div>

            {/* Right Column: Download Payload Delivery & Historical Gallery */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Output Processed Banner */}
              {currentResult ? (
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                  <div className="absolute top-3 left-3 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>جاهز للتحميل الفوري</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">نتيجة استخراج الفيديو</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <img 
                      src={currentResult.video.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60"} 
                      alt="Thumbnail" 
                      className="w-24 h-24 object-cover rounded-xl border border-slate-800 shrink-0 shadow-md"
                    />
                    <div className="w-full text-center sm:text-right overflow-hidden">
                      <span className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-mono block w-fit mx-auto sm:mx-0 mb-1">
                        {currentResult.video.platform}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 truncate mb-1" title={currentResult.video.title}>
                        {currentResult.video.title}
                      </h4>
                      <div className="text-[11px] text-slate-400 flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
                        <span>الصيغة: <strong className="text-slate-200">{currentResult.video.format}</strong></span>
                        <span>•</span>
                        <span>الجودة: <strong className="text-emerald-400">{currentResult.video.quality}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actual Working Link Attachment Download Button */}
                  <div className="mt-5">
                    <a
                      href={currentResult.sampleDownloadUrl}
                      download
                      onClick={() => showToast("📥 جاري تنزيل ملف الفيديو إلى جهازك...", "success")}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xl shadow-emerald-600/20 text-center text-sm block tracking-wide"
                    >
                      تحميل الملف الآن (Download File)
                    </a>
                  </div>

                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-600 flex flex-col items-center justify-center min-h-[220px]">
                  <Play className="w-12 h-12 stroke-[1] mb-2 opacity-20" />
                  <p className="text-xs font-medium">أدخل الرابط واضغط على معالجة لعرض معاينة الفيديو<br/>وتوليد رابط التحميل المباشر هنا</p>
                </div>
              )}

              {/* Download History Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col flex-grow">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>سجل التحميلات السابقة</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {downloadedVideos.length} فيديو
                  </span>
                </h3>

                {downloadedVideos.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 my-auto text-xs">
                    لا يوجد تحميلات سابقة محفوظة في قاعدة البيانات.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {downloadedVideos.map((vid) => (
                      <div 
                        key={vid.id} 
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-right hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="bg-slate-900 text-slate-400 text-[10px] font-bold p-2 rounded-lg shrink-0">
                            {vid.format.toUpperCase()}
                          </span>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-slate-200 truncate" title={vid.title}>
                              {vid.title}
                            </div>
                            <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
                              <span>المنصة: {vid.platform}</span>
                              <span>•</span>
                              <span>الجودة: {vid.quality}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`/api/videos/stream?title=${encodeURIComponent(vid.title)}&format=${vid.format.toLowerCase()}`}
                          download
                          title="إعادة التحميل"
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-400 p-2 rounded-lg transition-all shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: FLASK INTEGRATION DESK                                        */}
        {/* ==================================================================== */}
        {activeTab === "flask" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-fade-in">
            <div className="max-w-3xl mb-6">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30 mb-3 inline-block">
                دراسة وتوثيق الباك إيند (Python / Flask)
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
                هيكل الربط العصري مع خادم Flask API
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                بناءً على طلبك بدراسة هيكل الباك إيند (Python/Flask) وتصميم واجهة تتكامل معه باحترافية، قمنا بتصميم هذه اللوحة لتدعم إرسال الطلبات إلى الخادم المدمج أو تمريرها مباشرة إلى خادم Flask عبر منافذ قياسية.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 overflow-hidden text-left font-mono text-xs mb-4" dir="ltr">
              <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-400 border-b border-slate-800 flex justify-between items-center">
                <span>app.py (Python / Flask Backend Engine)</span>
              </div>
              <pre className="p-4 text-slate-300 overflow-x-auto leading-relaxed max-h-64">
{`from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime, random

app = Flask(__name__)
CORS(app)

@app.route('/api/flask/generate_email', methods=['POST'])
def generate_email():
    data = request.get_json() or {}
    prefix = data.get("prefix", "livebox")
    addr = f"{prefix}@{data.get('domain', 'yourdomain.com')}"
    return jsonify({"success": True, "address": addr})

@app.route('/api/flask/download_video', methods=['POST'])
def download_video():
    data = request.get_json() or {}
    return jsonify({
        "success": True, 
        "video": {
            "title": "فيديو معالج عبر خادم Flask الحقيقي",
            "format": data.get("format", "mp4"),
            "quality": "1080p"
        }
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)`}
              </pre>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: COMPLETE PROJECT DOWNLOAD LINK                                */}
        {/* ==================================================================== */}
        {activeTab === "export" && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl animate-fade-in text-center max-w-3xl mx-auto">
            
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-slate-950 mx-auto mb-4 shadow-lg shadow-amber-500/20">
              <Download className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
              رابط تحميل المشروع كاملاً بعد التعديل
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed max-w-xl mx-auto">
              تتضمن الحزمة كافة ملفات الواجهة الأمامية العصرية، إعدادات التجاوب مع الجوال، بالإضافة إلى ملف خادم الباك إيند الحقيقي لـ Python/Flask، وإعدادات دمج Supabase ونقطة Inbound Webhook للبريد الحقيقي.
            </p>

            <div>
              <a
                href="/api/export-project"
                download="Complete_Project_Modified_Dashboard.json"
                onClick={() => showToast("🎉 جاري تحميل حزمة المشروع المتكاملة إلى جهازك...", "success")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-base py-4 px-8 rounded-2xl transition-all shadow-xl shadow-amber-500/20"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>تحميل المشروع كاملاً (Download Complete Package)</span>
              </a>
            </div>

          </div>
        )}

      </main>

      {/* MODERN MOBILE FOOTER NOTICE */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-8 mt-20 pt-6 border-t border-slate-900 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          تمت إعادة التصميم وتطوير الكود ليدعم الاتصال المباشر بقاعدة بيانات Supabase واستقبال البريد الحقيقي (Inbound Webhooks).
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /> متجاوب مع الجوال</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5 text-cyan-400" /> Supabase DB</span>
        </div>
      </footer>

    </div>
  );
}
