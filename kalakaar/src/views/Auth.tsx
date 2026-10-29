"use client";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { Turnstile, TURNSTILE_ENABLED } from "../components/ui/Turnstile";
import { GoldButton } from "../components/ui/GoldButton";
import { useState, useEffect } from "react";
import { ShoppingBag, Palette, CheckCircle2, Handshake, Heart } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { safeRedirectPath } from "../lib/safeRedirect";
import { notify } from "../lib/notify";

type AuthMode = "signin" | "signup" | "forgot";
type Role = "user" | "artist" | null;
type Step = 1 | 2 | 3;

function formatFriendlyAuthError(err: any): string {
  const msg = typeof err === 'string' ? err : err?.message || 'Authentication failed';
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('network')) {
    return 'Network connection unavailable. Please check your internet connection.';
  }
  return msg;
}

// Reusable Form Input applying design system
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      {...props} 
      className="appearance-none rounded-none w-full px-[1rem] py-[0.75rem] border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] text-[#2C1810] font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] focus:ring-0 transition-colors shadow-none"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select 
      {...props} 
      className="appearance-none rounded-none w-full px-[1rem] py-[0.75rem] border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] text-[#2C1810] font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] focus:ring-0 transition-colors shadow-none"
    >
      {props.children}
    </select>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <label className={`font-sans text-[0.8rem] text-[#7A5C4E] uppercase tracking-[0.1em] mb-[0.5rem] block ${className}`}>
      {children}
    </label>
  );
}

export function Auth({ defaultMode }: { defaultMode?: AuthMode }) {
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(defaultMode || "signin");
  const [step, setStep] = useState<Step>(1); // For signup
  const [forgotSent, setForgotSent] = useState(false);
  
  const modeParam = searchParams?.get('mode') as AuthMode;
  const errorParam = searchParams?.get('error');

  useEffect(() => {
    if (modeParam && (modeParam === "signin" || modeParam === "signup" || modeParam === "forgot")) {
      setMode(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    if (errorParam) {
      notify.error(`Authentication message: ${errorParam.replace(/_/g, ' ')}`);
    }
  }, [errorParam]);
  
  // Form State
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [city, setCity] = useState("");
  const [artStyle, setArtStyle] = useState("");
  const [experience, setExperience] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    const { data: signInData, error } = await signIn(email, password);
    
    if (error) {
      setIsLoading(false);
      const message = formatFriendlyAuthError(error);
      setAuthError(message);
      toast.error(message);
      return;
    }

    const userName = signInData?.user?.user_metadata?.display_name || signInData?.user?.user_metadata?.full_name || 'back';
    toast.success(`Welcome back, ${userName}!`);
    
    const redirect = safeRedirectPath(searchParams?.get('returnUrl') || searchParams?.get('redirect'), '');
    const isArtist = signInData?.user?.user_metadata?.is_artist || signInData?.user?.user_metadata?.role === 'artist';
    
    if (redirect) {
      window.location.href = redirect;
    } else {
      window.location.href = isArtist ? "/artist-portal" : "/explore";
    }
  };

  const handleSignUpStep1 = () => {
    if (role) setStep(2);
  };

  const handleSignUpStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long";
      setAuthError(msg);
      toast.error(msg);
      return;
    }
    
    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setAuthError(msg);
      toast.error(msg);
      return;
    }
    if (!agreed) {
      const msg = "Please accept the Terms of Use and Privacy Policy to continue";
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    if (TURNSTILE_ENABLED && !captchaToken) {
      const msg = "Please complete the human check";
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    const { data, error } = await signUp(email, password, name, role === "artist", captchaToken || undefined);
    setIsLoading(false);
    
    if (error) {
      const message = formatFriendlyAuthError(error);
      setAuthError(message);
      toast.error(message);
      return;
    }
    
    toast.success("Account created successfully!");

    if (data?.session) {
       window.location.href = role === "artist" ? "/welcome/setup" : "/explore";
    } else {
       setStep(3);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setIsLoading(false);
      const message = formatFriendlyAuthError(err);
      setAuthError(message);
      toast.error(message);
    }
  };

  const handleCompleteSignUp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const redirect = safeRedirectPath(searchParams?.get('returnUrl') || searchParams?.get('redirect'), '');
    window.location.href = redirect || (role === "artist" ? "/welcome/setup" : "/explore");
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      const msg = "Please enter your email address.";
      setAuthError(msg);
      toast.error(msg);
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    const { error } = await resetPassword(email.trim());
    setIsLoading(false);

    if (error) {
      const message = formatFriendlyAuthError(error);
      setAuthError(message);
      toast.error(message);
    } else {
      setForgotSent(true);
      toast.success("Password reset instructions sent to your email!");
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-80px)] flex items-stretch justify-center bg-[#F5EFE0] w-full overflow-hidden">
      
      {/* Left Panel — Visual */}
      <div className="hidden lg:flex w-1/2 bg-[#2C1810] relative flex-col items-center justify-center p-16 overflow-hidden">
        <MadhubaniPattern opacity={0.12} stroke="#6B1E2E" />
        
        <div className="relative z-10 text-center flex flex-col items-center max-w-[400px]">
          <h1 className="font-serif text-[4rem] text-[#F5EFE0] mb-4 font-bold leading-none">
            Kalakaar
          </h1>
          <p className="font-sans text-[1.1rem] text-[#EDE4CE] mb-12 uppercase tracking-[0.1em]">
            Where Every Brushstroke Finds Its Home
          </p>

          <div className="space-y-6 text-left w-full mt-4">
            <div className="flex items-start gap-4">
               <Palette size={20} className="text-[#6B1E2E] mt-1 shrink-0" />
               <p className="font-sans text-[1.05rem] text-[rgba(245,239,224,0.9)] leading-snug">
                 Authentic Indian art — Madhubani, Warli, Gond, Pattachitra and much more
               </p>
            </div>
            <div className="flex items-start gap-4">
               <Handshake size={20} className="text-[#6B1E2E] mt-1 shrink-0" />
               <p className="font-sans text-[1.05rem] text-[rgba(245,239,224,0.9)] leading-snug">
                 Connect directly with local artists — WhatsApp or DM them directly for custom orders
               </p>
            </div>
            <div className="flex items-start gap-4">
               <Heart size={20} className="text-[#6B1E2E] mt-1 shrink-0" />
               <p className="font-sans text-[1.05rem] text-[rgba(245,239,224,0.9)] leading-snug">
                 Completely free platform — 100% of proceeds go directly to the creator
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-12 bg-[#FFFDF7] overflow-y-auto">
        <div className="max-w-[500px] w-full mx-auto my-auto">
          
          {authError && (
            <div className="mb-6 p-4 bg-[#FFF5F5] border border-[#E53E3E] text-[#C53030] font-sans text-[0.85rem] leading-relaxed">
              {authError}
            </div>
          )}

          {mode !== "forgot" && step !== 3 && (
            <div className="flex bg-[#EDE4CE] p-1 mb-8">
              <button
                onClick={() => { setMode("signin"); setAuthError(null); }}
                className={`flex-1 py-2.5 font-sans text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${mode === "signin" ? "bg-[#FFFDF7] shadow-[0_2px_8px_rgba(107,30,46,0.06)] text-[#6B1E2E] font-medium" : "text-[#7A5C4E] hover:text-[#2C1810]"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("signup"); setStep(1); setAuthError(null); }}
                className={`flex-1 py-2.5 font-sans text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${mode === "signup" ? "bg-[#FFFDF7] shadow-[0_2px_8px_rgba(107,30,46,0.06)] text-[#6B1E2E] font-medium" : "text-[#7A5C4E] hover:text-[#2C1810]"}`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* === FORGOT PASSWORD === */}
          {mode === "forgot" && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <h2 className="font-serif text-[2.2rem] text-[#2C1810] mb-2">Reset Password</h2>
               {forgotSent ? (
                 <div className="p-6 bg-[#EDE4CE]/50 border border-[rgba(107,30,46,0.18)] mb-6 text-left space-y-3">
                   <div className="flex items-center gap-2 text-[#6B1E2E] font-medium">
                     <CheckCircle2 size={20} />
                     <span>Instructions Sent</span>
                   </div>
                   <p className="font-sans text-[0.9rem] text-[#7A5C4E] leading-relaxed">
                     We have sent password reset instructions to <strong className="text-[#2C1810]">{email}</strong>. Please check your inbox and click the reset link.
                   </p>
                   <button
                     type="button"
                     onClick={() => { setMode("signin"); setAuthError(null); setForgotSent(false); }}
                     className="w-full mt-2 py-2.5 bg-[#6B1E2E] text-white font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:bg-[#8A2B3E] transition-colors"
                   >
                     Back to Sign In
                   </button>
                 </div>
               ) : (
                 <>
                   <p className="font-sans text-[#7A5C4E] text-[0.95rem] mb-8">Enter your email address and we will send you a link to reset your password.</p>
                   <form onSubmit={handleForgotSubmit}>
                     <div className="mb-6">
                       <Label>Email address</Label>
                       <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
                     </div>
                     <GoldButton variant="primary" type="submit" disabled={isLoading} className="w-full justify-center mb-4 text-[0.85rem]">
                       {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                     </GoldButton>
                     <button type="button" onClick={() => { setMode("signin"); setAuthError(null); }} className="w-full font-sans text-[0.85rem] text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors hover:underline decoration-[rgba(107,30,46,0.5)] underline-offset-4">
                       Back to Sign In
                     </button>
                   </form>
                 </>
               )}
             </div>
          )}

          {/* === SIGN IN === */}
          {mode === "signin" && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <Label>Email address</Label>
                    <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-[0.5rem]">
                       <Label className="!mb-0">Password</Label>
                       <button type="button" onClick={() => { setMode("forgot"); setAuthError(null); }} className="font-sans text-[0.75rem] text-[#6B1E2E] hover:text-[#8B2A3E] transition-colors">Forgot password?</button>
                    </div>
                    <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
                  </div>
                  <GoldButton variant="primary" className="w-full justify-center py-[0.8rem] text-[0.85rem]">Sign In</GoldButton>
               </form>

               <div className="relative my-8">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-[rgba(107,30,46,0.15)]"></div>
                 </div>
                 <div className="relative flex justify-center text-sm">
                   <span className="px-3 bg-[#FFFDF7] font-sans text-[0.8rem] text-[#7A5C4E] lowercase">or continue with</span>
                 </div>
               </div>

               <p className="font-sans text-[0.7rem] text-[#7A5C4E] text-center mb-3">By continuing with Google you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</p>
               <button onClick={handleGoogleSignIn} disabled={isLoading} type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] hover:bg-[#EDE4CE] transition-colors mb-6 cursor-pointer">
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.15C1.43 8.55 1 10.22 1 12s.43 3.45 1.15 4.93l3.69-2.84z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.15 7.07l3.69 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 <span className="font-sans text-[0.85rem] font-medium text-[#2C1810]">Continue with Google</span>
               </button>
               
               <p className="text-center font-sans text-[0.85rem] text-[#7A5C4E] mt-6">
                 Don&apos;t have an account? <button type="button" onClick={() => { setMode("signup"); setAuthError(null); }} className="text-[#6B1E2E] hover:underline decoration-[#6B1E2E]/50 underline-offset-4">Create one free →</button>
               </p>
             </div>
          )}

          {/* === SIGN UP FLOW === */}
          {mode === "signup" && step !== 3 && (
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgba(107,30,46,0.18)] relative">
               <div className="flex flex-col items-center flex-1 relative z-10">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-[0.8rem] font-medium transition-colors ${step >= 1 ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#9C7A6A] border border-[rgba(107,30,46,0.18)]"}`}>1</div>
                 <span className="font-sans text-[0.6rem] uppercase tracking-widest mt-2 text-[#7A5C4E]">Role</span>
               </div>
               <div className="flex flex-col items-center flex-1 relative z-10">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-[0.8rem] font-medium transition-colors ${step >= 2 ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#9C7A6A] border border-[rgba(107,30,46,0.18)]"}`}>2</div>
                 <span className="font-sans text-[0.6rem] uppercase tracking-widest mt-2 text-[#7A5C4E]">Details</span>
               </div>
               <div className="flex flex-col items-center flex-1 relative z-10">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-[0.8rem] font-medium transition-colors bg-[#EDE4CE] text-[#9C7A6A] border border-[rgba(107,30,46,0.18)]`}>3</div>
                 <span className="font-sans text-[0.6rem] uppercase tracking-widest mt-2 text-[#7A5C4E]">Done</span>
               </div>
               {/* Progress Line */}
               <div className="absolute top-4 left-[15%] right-[15%] h-[1px] bg-[rgba(107,30,46,0.18)] -z-0"></div>
               <div className="absolute top-4 left-[15%] h-[1px] bg-[#6B1E2E] transition-all duration-300 -z-0" style={{ right: step === 1 ? '50%' : step === 2 ? '15%' : '0%' }}></div>
            </div>
          )}

          {/* Step 1: Role */}
          {mode === "signup" && step === 1 && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div 
                    onClick={() => setRole("user")}
                    className={`border p-6 flex flex-col items-center text-center cursor-pointer transition-all ${role === "user" ? "border-[#6B1E2E] bg-[rgba(107,30,46,0.08)] shadow-[0_4px_24px_rgba(107,30,46,0.08)]" : "border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] hover:border-[rgba(107,30,46,0.5)]"}`}
                  >
                     <div className="w-12 h-12 rounded-full bg-[#EDE4CE] flex items-center justify-center mb-4 text-[#6B1E2E]">
                        <ShoppingBag size={20} />
                     </div>
                     <p className="font-sans text-[0.95rem] font-semibold text-[#2C1810] mb-2">I am an Art Enthusiast / Collector</p>
                     <p className="font-sans text-[0.75rem] text-[#7A5C4E] mb-4">Discover and collect authentic Indian artworks</p>
                     <ul className="text-left font-sans text-[0.7rem] text-[#7A5C4E] space-y-1.5 w-full">
                       <li className="flex items-start gap-2"><span className="text-[#6B1E2E] font-serif">✦</span> Browse authentic artworks</li>
                       <li className="flex items-start gap-2"><span className="text-[#6B1E2E] font-serif">✦</span> Commission custom pieces</li>
                       <li className="flex items-start gap-2"><span className="text-[#6B1E2E] font-serif">✦</span> Connect with artists</li>
                     </ul>
                  </div>

                  <div 
                    onClick={() => setRole("artist")}
                    className={`border p-6 flex flex-col items-center text-center cursor-pointer transition-all ${role === "artist" ? "border-[#6B1E2E] bg-[rgba(107,30,46,0.08)] shadow-[0_4px_24px_rgba(107,30,46,0.08)]" : "border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] hover:border-[rgba(107,30,46,0.5)]"}`}
                  >
                     <div className="w-12 h-12 rounded-full bg-[#EDE4CE] flex items-center justify-center mb-4 text-[#6B1E2E]">
                        <Palette size={20} />
                     </div>
                     <p className="font-sans text-[0.95rem] font-semibold text-[#2C1810] mb-2">I am an Artist</p>
                     <p className="font-sans text-[0.75rem] text-[#7A5C4E] mb-4">Showcase your art and reach art lovers across India</p>
                     <ul className="text-left font-sans text-[0.7rem] text-[#7A5C4E] space-y-1.5 w-full">
                       <li className="flex items-start gap-2"><span className="text-[#6B1E2E] font-serif">✦</span> List and sell your artworks</li>
                       <li className="flex items-start gap-2"><span className="text-[#6B1E2E] font-serif">✦</span> Join the artist community</li>
                     </ul>
                  </div>
               </div>
               <GoldButton variant="primary" className="w-full justify-center py-[0.8rem] text-[0.85rem]" disabled={!role} onClick={handleSignUpStep1}>
                 Continue →
               </GoldButton>
             </div>
          )}

          {/* Step 2: Details */}
          {mode === "signup" && step === 2 && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <form onSubmit={handleSignUpStep2} className="space-y-5">
                  <div>
                    <Label>Full Name *</Label>
                    <Input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="Enter your name" />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label>Password *</Label>
                       <Input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
                     </div>
                     <div>
                       <div className="flex items-center justify-between mb-[0.5rem]">
                         <Label className="!mb-0">Confirm Password *</Label>
                         <button type="button" onClick={()=>setShowPassword(!showPassword)} className="font-sans text-[0.65rem] text-[#7A5C4E] hover:text-[#6B1E2E] uppercase tracking-wider">{showPassword ? "Hide" : "Show"}</button>
                       </div>
                       <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
                     </div>
                  </div>
                  <div>
                    <Label>City / State *</Label>
                    <Input type="text" value={city} onChange={e=>setCity(e.target.value)} required placeholder="e.g. Jaipur, Rajasthan" />
                  </div>

                  {role === "artist" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-[#EDE4CE] p-5 border border-[rgba(107,30,46,0.18)] space-y-4 mt-6">
                       <p className="font-sans text-[0.8rem] font-medium text-[#2C1810] uppercase tracking-wider mb-2">Artist Details</p>
                       <div>
                          <Label>Primary Art Style *</Label>
                          <Select value={artStyle} onChange={e=>setArtStyle(e.target.value)} required>
                            <option value="">Select a style</option>
                            <option value="Madhubani">Madhubani</option>
                            <option value="Warli">Warli</option>
                            <option value="Tanjore">Tanjore</option>
                            <option value="Pattachitra">Pattachitra</option>
                            <option value="Abstract">Abstract</option>
                            <option value="Contemporary">Contemporary</option>
                            <option value="Other">Other</option>
                          </Select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Experience (Years)</Label>
                            <Input type="number" value={experience} onChange={e=>setExperience(e.target.value)} min="0" placeholder="e.g. 5" />
                          </div>
                          <div>
                            <Label>Phone Number *</Label>
                            <Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="+91" />
                          </div>
                       </div>
                    </div>
                  )}

                  <label className="flex items-start gap-3 font-sans text-[0.8rem] text-[#7A5C4E] leading-relaxed cursor-pointer">
                    <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} required className="mt-1 accent-[#6B1E2E]" />
                    <span>I agree to the <a href="/terms" target="_blank" rel="noopener" className="underline text-[#6B1E2E]">Terms of Use</a> and <a href="/privacy" target="_blank" rel="noopener" className="underline text-[#6B1E2E]">Privacy Policy</a>.</span>
                  </label>

                  <Turnstile onToken={setCaptchaToken} />

                  <div className="pt-2 flex items-center gap-4">
                    <GoldButton variant="outline" type="button" onClick={() => setStep(1)} className="px-6 py-[0.8rem] text-[0.85rem] border-[rgba(107,30,46,0.18)] text-[#2C1810]">← Back</GoldButton>
                    <GoldButton variant="primary" className="flex-1 justify-center py-[0.8rem] text-[0.85rem]">Create Account</GoldButton>
                  </div>
               </form>
             </div>
          )}

          {/* Step 3: Welcome Screen */}
          {mode === "signup" && step === 3 && (
             <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center py-8 relative">
               {/* Pattern Background for Welcome */}
               <div className="absolute inset-0 z-0 opacity-5 pointer-events-none flex items-center justify-center">
                  <MadhubaniPattern stroke="#6B1E2E" />
               </div>
               
               <div className="relative z-10 w-20 h-20 bg-[rgba(107,30,46,0.08)] rounded-full flex items-center justify-center mb-8 border border-[rgba(107,30,46,0.18)] shadow-[0_0_40px_rgba(107,30,46,0.15)] animate-bounce-slow">
                  <CheckCircle2 size={36} className="text-[#6B1E2E]" />
               </div>

               <h2 className="relative z-10 font-serif text-[2.5rem] tracking-tight text-[#2C1810] mb-4 leading-tight">
                 {role === "user" ? "Welcome to Kalakaar!" : "Welcome, fellow Kalakaar!"}
               </h2>
               
               <p className="relative z-10 font-sans text-[1rem] text-[#7A5C4E] max-w-[340px] leading-relaxed mb-10">
                 {role === "user" 
                   ? "Your journey into Indian art begins now. Explore authentic artworks and connect with creators."
                   : "Your studio is ready. Start by uploading your first artwork and connecting with collectors."}
               </p>

               <GoldButton variant="primary" onClick={handleCompleteSignUp} className="relative z-10 w-full justify-center py-[0.8rem] text-[0.85rem]">
                 {role === "user" ? "Explore Collection →" : "Go to Dashboard →"}
               </GoldButton>
             </div>
          )}

        </div>
      </div>
    </main>
  );
}