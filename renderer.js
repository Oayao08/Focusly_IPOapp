/* renderer.js — Flowvity desktop app renderer
   Compiled by Babel standalone (loaded via index.html)     */

const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

/* ══════════════════════════════════════════════
   SAFE API SHIM  (works in browser dev too)
══════════════════════════════════════════════ */
const api = window.flowvityAPI || {
  register:        async () => ({ success: false, error: 'Run inside Electron' }),
  verify:          async () => ({ success: false, error: 'Run inside Electron' }),
  login:           async () => ({ success: false, error: 'Run inside Electron' }),
  logout:          async () => ({ success: true }),
  validateSession: async () => ({ valid: false }),
  resendCode:      async () => ({ success: false, error: 'Run inside Electron' }),
  window: {
    minimize:    () => {},
    maximize:    () => {},
    close:       () => {},
    isMaximized: async () => false,
    platform:    async () => 'linux',
  },
};

/* ══════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════ */
const C = {
  bg:'#080C12', sur:'#0F1520', card:'#131B26',
  bdr:'rgba(255,255,255,0.07)', bdrHov:'rgba(255,255,255,0.13)',
  mint:'#14F0A0',   mintD:'rgba(20,240,160,0.1)',   mintDD:'rgba(20,240,160,0.05)',
  amber:'#FBBF24',  amberD:'rgba(251,191,36,0.1)',
  blue:'#60A5FA',   blueD:'rgba(96,165,250,0.1)',
  pink:'#F472B6',   pinkD:'rgba(244,114,182,0.1)',
  purple:'#A78BFA', purpleD:'rgba(167,139,250,0.1)',
  red:'#F87171',    redD:'rgba(248,113,113,0.1)',
  txt:'#E2EAF2', sub:'#94A3B8', mut:'#485569',
};

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const CATS = {
  study:   { label:'Study',    emoji:'📚', color:C.blue,   dim:C.blueD   },
  health:  { label:'Health',   emoji:'🏃', color:C.mint,   dim:C.mintD   },
  creative:{ label:'Creative', emoji:'✨', color:C.pink,   dim:C.pinkD   },
  personal:{ label:'Personal', emoji:'🌱', color:C.purple, dim:C.purpleD },
  work:    { label:'Work',     emoji:'💼', color:C.amber,  dim:C.amberD  },
};

const OFF_DEVICE = [
  { emoji:'🚶', text:'Take a 10-minute walk outside',  tag:'Movement'   },
  { emoji:'📖', text:'Read a physical book for 30 min', tag:'Reading'    },
  { emoji:'🧘', text:'5 minutes of deep breathing',    tag:'Mindfulness'},
  { emoji:'✏️', text:'Journal your thoughts on paper',  tag:'Reflection' },
  { emoji:'💪', text:'Do 15 minutes of stretching',    tag:'Movement'   },
  { emoji:'🍳', text:'Cook something healthy & new',   tag:'Life Skills'},
  { emoji:'📞', text:'Call a friend or family member', tag:'Social'     },
  { emoji:'🎨', text:'Draw or sketch freely',          tag:'Creative'   },
  { emoji:'🌳', text:'Spend 15 min in nature',         tag:'Wellbeing'  },
  { emoji:'♟️', text:'Play a board or card game',       tag:'Play'       },
];

const BADGES = [
  { id:'first_task',  emoji:'⚡', name:'First Step',  desc:'Complete your first task',      pts:10  },
  { id:'focus_1',     emoji:'🎯', name:'Focused',      desc:'Complete a Pomodoro session',   pts:25  },
  { id:'habit_3',     emoji:'🔥', name:'Consistent',   desc:'3-day habit streak',            pts:40  },
  { id:'tasks_5',     emoji:'💫', name:'Momentum',     desc:'5 tasks in one day',            pts:60  },
  { id:'focus_5',     emoji:'🧠', name:'Deep Work',    desc:'5 total Pomodoro sessions',     pts:75  },
  { id:'habit_7',     emoji:'🏆', name:'Week Strong',  desc:'7-day habit streak',            pts:100 },
  { id:'off_device',  emoji:'📵', name:'Unplugged',    desc:'Log an off-device activity',    pts:20  },
];

const LEVELS = [
  { min:0,   name:'Starter',       color:C.sub    },
  { min:50,  name:'Builder',       color:C.blue   },
  { min:150, name:'Focused',       color:C.mint   },
  { min:300, name:'Consistent',    color:C.amber  },
  { min:500, name:'High Achiever', color:C.pink   },
  { min:800, name:'Flow Master',   color:C.purple },
];

const TABS = [
  { id:'home',   label:'Home',   Icon:({s=20,a})=><svg width={s} height={s} viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={a?0:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>{a?<rect x="9" y="13" width="6" height="8" rx="1" fill="#0C1320"/>:<polyline points="9 21 9 13 15 13 15 21"/>}</svg> },
  { id:'tasks',  label:'Tasks',  Icon:({s=20,a})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{a?<><rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M8 12l3 3 5-5" stroke="#0C1320" strokeWidth="2.2"/></>:<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-5"/></>}</svg> },
  { id:'focus',  label:'Focus',  Icon:({s=20,a})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill={a?'currentColor':'none'} strokeWidth="0"/><circle cx="12" cy="12" r="4" stroke="currentColor"/></svg> },
  { id:'habits', label:'Habits', Icon:({s=20,a})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={a?'currentColor':'none'}/></svg> },
  { id:'stats',  label:'Stats',  Icon:({s=20,a})=><svg width={s} height={s} viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="16" y="4" width="4" height="17" rx="1"/></svg> },
];

/* ══════════════════════════════════════════════
   USER CONTEXT  (namespaces localStorage)
══════════════════════════════════════════════ */
const UserCtx = createContext(null);

/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
const todayStr   = () => new Date().toISOString().split('T')[0];
const uid        = () => Math.random().toString(36).slice(2, 9);
const fmtTimer   = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const getLevel   = pts => [...LEVELS].reverse().find(l => pts >= l.min) || LEVELS[0];
const getNextLvl = pts => { const i = LEVELS.findIndex(l => l === getLevel(pts)); return LEVELS[i+1] || null; };

const getWeekDates = () => {
  const d = new Date(); const dow = d.getDay() || 7;
  return Array.from({length:7}, (_, i) => {
    const dt = new Date(d); dt.setDate(d.getDate() - dow + 1 + i);
    return dt.toISOString().split('T')[0];
  });
};

const calcStreak = dates => {
  if (!dates?.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 0, cur = new Date(todayStr());
  for (const d of sorted) {
    const diff = (cur - new Date(d)) / 86400000;
    if (diff <= 1 && diff >= 0) { streak++; cur = new Date(d); cur.setDate(cur.getDate()-1); }
    else break;
  }
  return streak;
};

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useLS(key, def) {
  const user    = useContext(UserCtx);
  const fullKey = `${user?.id || 'anon'}_${key}`;

  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(fullKey); return s ? JSON.parse(s) : def; }
    catch { return def; }
  });

  const set = useCallback(val => {
    setV(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      try { localStorage.setItem(fullKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [fullKey]);

  return [v, set];
}

function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h, {passive:true});
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

/* ══════════════════════════════════════════════
   TINY SHARED COMPONENTS
══════════════════════════════════════════════ */
function Toast({msg, onDone}) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return (
    <div style={{position:'fixed',top:54,left:'50%',transform:'translateX(-50%)',
      background:C.mint,color:'#060A10',padding:'10px 22px',borderRadius:100,
      fontSize:13,fontWeight:700,zIndex:9999,boxShadow:'0 4px 32px rgba(20,240,160,.4)',
      animation:'fadeUp .25s ease',whiteSpace:'nowrap',maxWidth:'88vw',textAlign:'center'}}>
      {msg}
    </div>
  );
}

function Pill({text, color, bg, style={}}) {
  return (
    <span style={{fontSize:11,fontWeight:700,color:color||C.mint,background:bg||C.mintD,
      borderRadius:20,padding:'3px 10px',letterSpacing:'.03em',...style}}>
      {text}
    </span>
  );
}

function Card({children, style={}, className=''}) {
  return (
    <div className={className}
      style={{background:C.card,border:`1.5px solid ${C.bdr}`,borderRadius:18,...style}}>
      {children}
    </div>
  );
}

function SLabel({children, style={}}) {
  return <span className="sec-label" style={style}>{children}</span>;
}

function Spinner() {
  return (
    <div style={{width:32,height:32,border:`3px solid ${C.mintD}`,
      borderTop:`3px solid ${C.mint}`,borderRadius:'50%',
      animation:'spin .8s linear infinite'}}/>
  );
}

function defaultHabits() {
  return [
    {id:uid(),title:'Morning movement',   emoji:'🏃',category:'health',  completedDates:[],createdAt:todayStr()},
    {id:uid(),title:'Read for 20 min',    emoji:'📖',category:'personal',completedDates:[],createdAt:todayStr()},
    {id:uid(),title:'Phone-free first hour',emoji:'📵',category:'personal',completedDates:[],createdAt:todayStr()},
  ];
}

/* ══════════════════════════════════════════════
   TITLEBAR  (custom, cross-platform)
══════════════════════════════════════════════ */
function TitleBar() {
  const [platform, setPlatform] = useState('linux');
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    api.window.platform().then(p => setPlatform(p));
    const checkMax = async () => setMaximized(await api.window.isMaximized());
    checkMax();
    const interval = setInterval(checkMax, 1000);
    return () => clearInterval(interval);
  }, []);

  const isMac = platform === 'darwin';

  /* macOS traffic-light colours */
  const macBtns = [
    { key:'close',    bg:'#FF5F57', hov:'#FF3B30', action: () => api.window.close()    },
    { key:'min',      bg:'#FEBC2E', hov:'#FFA500', action: () => api.window.minimize() },
    { key:'max',      bg:'#28C840', hov:'#1AAF2C', action: () => api.window.maximize() },
  ];

  return (
    <div className="titlebar drag-region" style={{
      height:38, display:'flex', alignItems:'center',
      background:'#070B11', borderBottom:`1px solid rgba(255,255,255,.06)`,
      position:'relative', flexShrink:0,
    }}>
      {/* macOS traffic lights */}
      {isMac && (
        <div className="no-drag" style={{display:'flex',gap:7,paddingLeft:14}}>
          {macBtns.map(b => (
            <button key={b.key} onClick={b.action}
              onMouseEnter={e => e.target.style.filter='brightness(0.8)'}
              onMouseLeave={e => e.target.style.filter='none'}
              style={{width:13,height:13,borderRadius:'50%',background:b.bg,
                border:'none',padding:0,cursor:'default',transition:'filter .15s'}}>
            </button>
          ))}
        </div>
      )}

      {/* App title — centered */}
      <div style={{
        position:'absolute', left:'50%', transform:'translateX(-50%)',
        fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700,
        color:C.mut, letterSpacing:'.08em', pointerEvents:'none',
      }}>
        FLOWVITY
      </div>

      {/* Windows / Linux window buttons */}
      {!isMac && (
        <div className="no-drag" style={{display:'flex',marginLeft:'auto'}}>
          {[
            { icon:'—', title:'Minimize', action: () => api.window.minimize(), hover:'rgba(255,255,255,.08)', color:C.sub },
            { icon: maximized ? '❐' : '□', title:'Maximize', action: () => api.window.maximize(), hover:'rgba(255,255,255,.08)', color:C.sub },
            { icon:'✕', title:'Close',    action: () => api.window.close(),    hover:'#EF4444', color:C.sub },
          ].map(b => (
            <button key={b.title} onClick={b.action} title={b.title}
              onMouseEnter={e => { e.target.style.background = b.hover; if(b.title==='Close') e.target.style.color='#fff'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = C.sub; }}
              style={{
                width:46, height:38, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: b.icon === '✕' ? 12 : 14,
                color:C.sub, background:'transparent', transition:'all .15s',
              }}>
              {b.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   ── AUTH SCREENS ──
══════════════════════════════════════════════ */

/* Logo used on all auth screens */
function AuthLogo() {
  return (
    <div style={{textAlign:'center', marginBottom:32}}>
      <div style={{
        width:72, height:72, borderRadius:20, margin:'0 auto 14px',
        background:C.sur, border:`2px solid rgba(20,240,160,.25)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 40px rgba(20,240,160,.12)',
      }}>
        <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:34, color:C.mint}}>F</span>
      </div>
      <div style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:C.txt}}>flowvity</div>
      <div style={{fontSize:13, color:C.mut, marginTop:4}}>Focus. Flow. Grow.</div>
    </div>
  );
}

/* Password strength bar */
function PwStrength({pw}) {
  if (!pw) return null;
  const s =
    pw.length < 6 ? 1 :
    pw.length < 10 || !/[0-9]/.test(pw) ? 2 :
    pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw) ? 4 : 3;
  const cols = ['','#F87171','#FBBF24','#60A5FA','#14F0A0'];
  const labs = ['','Weak','Fair','Good','Strong'];
  return (
    <div style={{display:'flex', gap:4, alignItems:'center', marginTop:6}}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{flex:1, height:3, borderRadius:2,
          background: i <= s ? cols[s] : 'rgba(255,255,255,.08)',
          transition:'background .3s'}}/>
      ))}
      <span style={{fontSize:10, color:cols[s], marginLeft:6, fontWeight:700, minWidth:38}}>
        {labs[s]}
      </span>
    </div>
  );
}

/* 6-digit OTP input */
function OTPInput({value, onChange}) {
  const refs = useRef([]);
  const digits = value.padEnd(6,'').split('').slice(0,6);

  const set = (i, val) => {
    const d = [...digits];
    d[i] = val.replace(/\D/g,'').slice(-1);
    const next = d.join('');
    onChange(next);
    if (val && i < 5) refs.current[i+1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i-1]?.focus();
      const d = [...digits]; d[i-1] = '';
      onChange(d.join(''));
    }
  };

  const handlePaste = e => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{display:'flex', gap:8, justifyContent:'center', margin:'8px 0'}}>
      {Array.from({length:6}).map((_, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          onChange={e => set(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width:48, height:58, borderRadius:13, textAlign:'center',
            fontSize:22, fontWeight:800, fontFamily:'Syne,sans-serif',
            background: digits[i] ? C.mintD : 'rgba(255,255,255,.05)',
            border:`2px solid ${digits[i] ? C.mint : C.bdr}`,
            color: digits[i] ? C.mint : C.txt,
            transition:'all .15s',
          }}/>
      ))}
    </div>
  );
}

/* ── Login Screen ── */
function LoginScreen({onLogin, onRegister, onNeedsVerify}) {
  const [email, setEmail]   = useState('');
  const [pw,    setPw]      = useState('');
  const [err,   setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    const res = await api.login({ email: email.trim(), password: pw });
    setLoading(false);
    if (res.success) {
      onLogin(res.user, res.token);
    } else if (res.needsVerification) {
      onNeedsVerify(res.email || email);
    } else {
      setErr(res.error);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthLogo/>
        <div style={{fontSize:20, fontFamily:'Syne,sans-serif', fontWeight:800, color:C.txt, marginBottom:6}}>
          Welcome back
        </div>
        <div style={{fontSize:13, color:C.mut, marginBottom:28}}>Sign in to continue</div>

        {err && (
          <div style={{background:C.redD, border:`1.5px solid ${C.red}40`, borderRadius:12,
            padding:'10px 14px', marginBottom:16, fontSize:13, color:C.red}}>
            {err}
          </div>
        )}

        <div style={{marginBottom:12}}>
          <div style={{fontSize:11, color:C.mut, marginBottom:5, fontWeight:600}}>Email</div>
          <input type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') submit(); }}
            autoFocus/>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11, color:C.mut, marginBottom:5, fontWeight:600}}>Password</div>
          <input type="password" placeholder="••••••••" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') submit(); }}/>
        </div>

        <button onClick={submit} disabled={loading}
          style={{
            width:'100%', background:loading?'rgba(20,240,160,.5)':C.mint,
            color:'#060A10', borderRadius:14, padding:'14px',
            fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800,
            letterSpacing:'.02em', marginBottom:20, transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
          {loading ? <Spinner/> : '→  Sign In'}
        </button>

        <div style={{textAlign:'center', fontSize:13, color:C.mut}}>
          No account?{' '}
          <button onClick={onRegister}
            style={{color:C.mint, fontWeight:700, fontSize:13, textDecoration:'underline'}}>
            Create one free
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Register Screen ── */
function RegisterScreen({onLogin, onVerify}) {
  const [f, setF] = useState({username:'', email:'', pw:'', pw2:''});
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const upd = k => e => setF(p => ({...p, [k]: e.target.value}));

  const submit = async () => {
    setErr('');
    if (!f.username.trim()) return setErr('Username is required.');
    if (!f.email.trim())    return setErr('Email is required.');
    if (f.pw.length < 8)    return setErr('Password must be at least 8 characters.');
    if (f.pw !== f.pw2)     return setErr('Passwords do not match.');

    setLoading(true);
    const res = await api.register({ username:f.username.trim(), email:f.email.trim(), password:f.pw });
    setLoading(false);

    if (res.success) onVerify(f.email.trim());
    else setErr(res.error);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthLogo/>
        <div style={{fontSize:20, fontFamily:'Syne,sans-serif', fontWeight:800, color:C.txt, marginBottom:6}}>
          Create your account
        </div>
        <div style={{fontSize:13, color:C.mut, marginBottom:24}}>Free. No subscription required.</div>

        {err && (
          <div style={{background:C.redD, border:`1.5px solid ${C.red}40`, borderRadius:12,
            padding:'10px 14px', marginBottom:16, fontSize:13, color:C.red}}>
            {err}
          </div>
        )}

        {[
          {key:'username', label:'Username',        type:'text',     ph:'John Doe'},
          {key:'email',    label:'Email address',   type:'email',    ph:'you@example.com'},
          {key:'pw',       label:'Password',        type:'password', ph:'Min. 8 characters'},
          {key:'pw2',      label:'Confirm password',type:'password', ph:'Repeat password'},
        ].map(({key,label,type,ph}) => (
          <div key={key} style={{marginBottom: key==='pw2'?24:12}}>
            <div style={{fontSize:11, color:C.mut, marginBottom:5, fontWeight:600}}>{label}</div>
            <input type={type} placeholder={ph} value={f[key]}
              onChange={upd(key)}
              onKeyDown={e => { if(e.key==='Enter') submit(); }}/>
            {key==='pw' && <PwStrength pw={f.pw}/>}
          </div>
        ))}

        <button onClick={submit} disabled={loading}
          style={{
            width:'100%', background:loading?'rgba(20,240,160,.5)':C.mint,
            color:'#060A10', borderRadius:14, padding:'14px',
            fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800,
            marginBottom:20, transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
          {loading ? <Spinner/> : '→  Create account'}
        </button>

        <div style={{textAlign:'center', fontSize:12, color:C.mut}}>
          A 6-digit code will be sent to your email to verify your account.
        </div>
        <div style={{textAlign:'center', marginTop:16, fontSize:13, color:C.mut}}>
          Already have an account?{' '}
          <button onClick={onLogin}
            style={{color:C.mint, fontWeight:700, fontSize:13, textDecoration:'underline'}}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Verify Screen ── */
function VerifyScreen({email, onVerified, onBack}) {
  const [code,    setCode]    = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resent,  setResent]  = useState(false);
  const [cooldown,setCooldown]= useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async () => {
    if (code.length < 6) return setErr('Please enter the full 6-digit code.');
    setErr(''); setLoading(true);
    const res = await api.verify({ email, code });
    setLoading(false);
    if (res.success) onVerified(res.user, res.token);
    else setErr(res.error);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    const res = await api.resendCode({ email });
    if (res.success) { setResent(true); setCooldown(60); }
    else setErr(res.error);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthLogo/>
        <div style={{textAlign:'center', marginBottom:28}}>
          <div style={{fontSize:40, marginBottom:12}}>📬</div>
          <div style={{fontSize:20, fontFamily:'Syne,sans-serif', fontWeight:800, color:C.txt, marginBottom:6}}>
            Check your email
          </div>
          <div style={{fontSize:13, color:C.sub, lineHeight:1.7}}>
            We sent a 6-digit code to<br/>
            <strong style={{color:C.mint}}>{email}</strong>
          </div>
        </div>

        {err && (
          <div style={{background:C.redD, border:`1.5px solid ${C.red}40`, borderRadius:12,
            padding:'10px 14px', marginBottom:16, fontSize:13, color:C.red, textAlign:'center'}}>
            {err}
          </div>
        )}
        {resent && !err && (
          <div style={{background:C.mintD, border:`1.5px solid rgba(20,240,160,.3)`, borderRadius:12,
            padding:'10px 14px', marginBottom:16, fontSize:13, color:C.mint, textAlign:'center'}}>
            ✓ New code sent!
          </div>
        )}

        <OTPInput value={code} onChange={v => { setCode(v); setErr(''); }}/>

        <button onClick={submit} disabled={loading || code.length < 6}
          style={{
            width:'100%', marginTop:24,
            background: code.length < 6 ? 'rgba(255,255,255,.05)' : loading ? 'rgba(20,240,160,.5)' : C.mint,
            color: code.length < 6 ? C.mut : '#060A10',
            borderRadius:14, padding:'14px',
            fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, marginBottom:16,
            transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
          {loading ? <Spinner/> : '✓  Verify email'}
        </button>

        <div style={{display:'flex', justifyContent:'space-between', fontSize:13}}>
          <button onClick={onBack} style={{color:C.mut, fontSize:13}}>← Back</button>
          <button onClick={resend} disabled={cooldown > 0}
            style={{color: cooldown > 0 ? C.mut : C.mint, fontSize:13, fontWeight:600}}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Loading Screen ── */
function LoadingScreen() {
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:20, background:C.bg}}>
      <div style={{
        width:64, height:64, borderRadius:18,
        background:C.sur, border:`2px solid rgba(20,240,160,.2)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 30px rgba(20,240,160,.1)',
      }}>
        <span style={{fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:30, color:C.mint}}>F</span>
      </div>
      <Spinner/>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP — shared components
══════════════════════════════════════════════ */

/* Sidebar user widget */
function SbUser({user, onLogout, points, level}) {
  const initials = user.username?.slice(0,2).toUpperCase() || '?';
  return (
    <div style={{marginBottom:10}}>
      <div className="sb-user">
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
          <div style={{
            width:36, height:36, borderRadius:11, flexShrink:0,
            background:C.mintD, border:`1.5px solid rgba(20,240,160,.3)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, color:C.mint,
          }}>
            {initials}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13, fontWeight:700, color:C.txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {user.username}
            </div>
            <div style={{fontSize:10, color:C.mut, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {user.email}
            </div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{
            width:'100%', fontSize:11, fontWeight:700, color:C.sub,
            background:'rgba(255,255,255,.04)', border:`1px solid ${C.bdr}`,
            borderRadius:9, padding:'6px', transition:'all .2s',
          }}
          onMouseEnter={e => { e.target.style.color = C.red; e.target.style.borderColor = `${C.red}40`; }}
          onMouseLeave={e => { e.target.style.color = C.sub; e.target.style.borderColor = C.bdr; }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APP (main shell — shown when authenticated)
══════════════════════════════════════════════ */
function App({user, onLogout}) {
  const [tab, setTab]         = useState('home');
  const [tasks,    setTasks]  = useLS('tasks',   []);
  const [habits,   setHabits] = useLS('habits',  defaultHabits());
  const [sessions, setSessions]= useLS('sessions',[]);
  const [points,   setPoints] = useLS('points',  0);
  const [badges,   setBadges] = useLS('badges',  []);
  const [offLog,   setOffLog] = useLS('offlog',  []);
  const [toast, setToast]     = useState(null);
  const tq = useRef([]);
  const w  = useW();
  const D  = w >= 960;

  const showToast = useCallback(msg => {
    tq.current.push(msg);
    if (!toast) setToast(tq.current.shift());
  }, [toast]);

  const nextToast = useCallback(() => {
    if (tq.current.length > 0) setToast(tq.current.shift());
    else setToast(null);
  }, []);

  const addPts = useCallback((p, r) => {
    setPoints(x => x + p);
    showToast(`+${p} pts — ${r}`);
  }, [showToast]);

  const awardBadge = useCallback(id => {
    setBadges(prev => {
      if (prev.includes(id)) return prev;
      const bg = BADGES.find(b => b.id === id);
      if (bg) { setTimeout(() => showToast(`🏅 Badge unlocked: ${bg.name}!`), 600); setPoints(x => x + bg.pts); }
      return [...prev, id];
    });
  }, [showToast]);

  const shared = { tasks, setTasks, habits, setHabits, sessions, setSessions,
    points, badges, offLog, setOffLog, addPts, awardBadge, showToast, D };

  const lvl     = getLevel(points);
  const nextLvl = getNextLvl(points);

  return (
    <div className="app-body" style={{flex:1, overflow:'hidden', display:'flex'}}>
      {toast && <Toast msg={toast} onDone={nextToast}/>}

      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="sb-logo">flow<em>vity</em></div>
        <SbUser user={user} onLogout={onLogout} points={points} level={lvl}/>
        <div className="sb-divider"/>
        <nav className="sb-nav">
          {TABS.map(({id,label,Icon}) => (
            <button key={id} className={`sb-item${tab===id?' on':''}`} onClick={() => setTab(id)}>
              <Icon s={17} a={tab===id}/>{label}
            </button>
          ))}
        </nav>
        {/* Points widget */}
        <div className="sb-pts">
          <div style={{fontSize:10, color:C.mut, letterSpacing:'.05em', marginBottom:5}}>POINTS</div>
          <div className="sb-pts-val">⚡ {points}</div>
          <div style={{fontSize:12, fontWeight:700, color:lvl.color, marginTop:5, letterSpacing:'.03em'}}>{lvl.name}</div>
          {nextLvl && (
            <div style={{marginTop:10}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:C.mut, marginBottom:4}}>
                <span>→ {nextLvl.name}</span><span>{points}/{nextLvl.min}</span>
              </div>
              <div style={{background:'rgba(255,255,255,.05)', borderRadius:4, height:4, overflow:'hidden'}}>
                <div style={{height:4, borderRadius:4, background:nextLvl.color,
                  width:`${Math.min(100,(points/nextLvl.min)*100)}%`,
                  transition:'width .6s ease', position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)',animation:'shimmer 2s infinite'}}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="main-col">
        <div className="scroll-area">
          <div className="content-wrap">
            {tab==='home'   && <HomeScreen   {...shared} setTab={setTab} user={user} onLogout={onLogout}/>}
            {tab==='tasks'  && <TasksScreen  {...shared}/>}
            {tab==='focus'  && <FocusScreen  {...shared}/>}
            {tab==='habits' && <HabitsScreen {...shared}/>}
            {tab==='stats'  && <StatsScreen  {...shared}/>}
          </div>
        </div>

        {/* Bottom nav (mobile/tablet) */}
        <nav className="bottom-nav">
          {TABS.map(({id,label,Icon}) => (
            <button key={id} className={`nav-btn${tab===id?' on':''}`} onClick={() => setTab(id)}>
              <Icon s={20} a={tab===id}/>
              <span className="nav-lbl">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME SCREEN
══════════════════════════════════════════════ */
function HomeScreen({tasks,habits,sessions,points,badges,offLog,setOffLog,addPts,awardBadge,setTab,D,user,onLogout}) {
  const today      = todayStr();
  const todayTasks = tasks.filter(t => t.date === today);
  const done       = todayTasks.filter(t => t.completed).length;
  const total      = todayTasks.length;
  const prog       = total > 0 ? done / total : 0;
  const rs = D ? 54 : 43; const ss = D ? 122 : 105;
  const circ = 2*Math.PI*rs;
  const focMins = sessions.filter(s=>s.date===today&&s.type==='work'&&s.completed).reduce((a,s)=>a+s.duration,0);
  const habDone = habits.filter(h=>h.completedDates.includes(today)).length;
  const hour    = new Date().getHours();
  const greet   = hour<12?`Good morning, ${user.username} ☀️`:hour<17?`Good afternoon, ${user.username} ⚡`:`Good evening, ${user.username} 🌙`;
  const lvl     = getLevel(points);
  const nextLvl = getNextLvl(points);
  const [sug]   = useState(() => OFF_DEVICE[Math.floor(Math.random()*OFF_DEVICE.length)]);

  const logOff = () => {
    setOffLog(l => [{id:uid(),activity:sug.text,emoji:sug.emoji,date:today},...l]);
    addPts(15,'Off-device activity!'); awardBadge('off_device');
  };

  const progressCard = (
    <Card style={{padding:D?24:20, display:'flex', alignItems:'center', gap:D?24:20,
      background:`linear-gradient(135deg,${C.card},${C.sur})`}} className="fade-up">
      <div style={{position:'relative',flexShrink:0}} className={prog>0?'breathe':''}>
        <svg width={ss} height={ss} viewBox={`0 0 ${ss} ${ss}`}>
          <circle cx={ss/2} cy={ss/2} r={rs} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={10}/>
          <circle cx={ss/2} cy={ss/2} r={rs} fill="none"
            stroke={prog>0?C.mint:'rgba(255,255,255,.04)'} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ*(1-prog)}
            style={{transform:'rotate(-90deg)',transformOrigin:'center',transition:'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:D?28:22,color:C.txt,lineHeight:1}}>{done}</span>
          <span style={{fontSize:10,color:C.mut,marginTop:2}}>of {total}</span>
        </div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:D?15:14,fontWeight:700,color:C.txt,marginBottom:14}}>
          Today's Progress
          <span style={{fontSize:11,fontWeight:700,color:prog===1?C.mint:C.sub,
            background:prog===1?C.mintD:'rgba(255,255,255,.06)',borderRadius:10,padding:'2px 8px',marginLeft:8}}>
            {Math.round(prog*100)}%
          </span>
        </div>
        <div className="g2" style={{gap:D?10:8}}>
          {[
            {icon:'⏱',val:`${Math.floor(focMins/60)}h ${focMins%60}m`,lbl:'Focus', col:C.blue},
            {icon:'🔥',val:`${habDone}/${habits.length}`,lbl:'Habits',col:C.amber},
            {icon:'🏅',val:badges.length,lbl:'Badges',col:C.purple},
            {icon:'🌿',val:offLog.filter(l=>l.date===today).length,lbl:'Offline',col:C.mint},
          ].map(({icon,val,lbl,col}) => (
            <div key={lbl} style={{background:'rgba(255,255,255,.04)',borderRadius:12,padding:D?'11px 13px':'9px 11px'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:D?15:14,fontWeight:800,color:col}}>{icon} {val}</div>
              <div style={{fontSize:10,color:C.mut,marginTop:2}}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const tasksPreview = total > 0 && (
    <Card style={{padding:D?20:16}} className="fade-up">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <SLabel>Today's Tasks</SLabel>
        <button onClick={() => setTab('tasks')} style={{fontSize:12,color:C.mint,fontWeight:600}}>View all →</button>
      </div>
      {todayTasks.slice(0,D?5:3).map(t => {
        const cat = CATS[t.category];
        return (
          <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',
            borderBottom:`1px solid ${C.bdr}`,opacity:t.completed?.45:1}}>
            <div style={{width:18,height:18,borderRadius:6,flexShrink:0,
              border:`2px solid ${t.completed?cat.color:C.bdr}`,
              background:t.completed?cat.color:'transparent',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {t.completed&&<span style={{color:'#060A10',fontSize:10,fontWeight:800}}>✓</span>}
            </div>
            <span style={{flex:1,fontSize:13,color:C.txt,textDecoration:t.completed?'line-through':'none',
              whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</span>
            <span style={{fontSize:13}}>{cat?.emoji}</span>
          </div>
        );
      })}
    </Card>
  );

  const offlineSug = (
    <div style={{background:`linear-gradient(135deg,${C.mintDD},rgba(20,240,160,.02))`,
      border:`1.5px solid rgba(20,240,160,.18)`,borderRadius:18,padding:D?20:18}} className="fade-up">
      <div style={{fontSize:10,fontWeight:800,color:C.mint,letterSpacing:'.1em',marginBottom:10}}>
        📵  OFFLINE ACTIVITY SUGGESTION
      </div>
      <div style={{fontSize:D?17:16,fontWeight:600,color:C.txt,marginBottom:12}}>
        {sug.emoji} {sug.text}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <Pill text={sug.tag} color={C.mint} bg={C.mintD}/>
        <button onClick={logOff} style={{fontSize:D?13:12,fontWeight:700,color:C.mint,
          background:C.mintD,border:`1.5px solid rgba(20,240,160,.3)`,
          borderRadius:20,padding:D?'8px 18px':'7px 16px',transition:'all .15s'}}>
          ✓ Done  +15 pts
        </button>
      </div>
    </div>
  );

  const ctaLevel = (
    <>
      <button onClick={() => setTab('focus')}
        style={{width:'100%',background:C.mint,color:'#060A10',borderRadius:16,
          padding:D?'18px':'17px',fontFamily:'Syne,sans-serif',fontSize:D?16:15,fontWeight:800,
          letterSpacing:'.03em',transition:'opacity .15s'}}
        onMouseEnter={e=>e.target.style.opacity='.88'}
        onMouseLeave={e=>e.target.style.opacity='1'}>
        ▶ Start Focus Session
      </button>
      {nextLvl && !D && (
        <Card style={{padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:7,fontSize:12}}>
            <span style={{color:C.sub}}>Level up → <span style={{color:nextLvl.color,fontWeight:700}}>{nextLvl.name}</span></span>
            <span style={{color:C.mut}}>{points}/{nextLvl.min} pts</span>
          </div>
          <div style={{background:'rgba(255,255,255,.05)',borderRadius:6,height:5,overflow:'hidden'}}>
            <div style={{height:5,borderRadius:6,background:nextLvl.color,
              width:`${Math.min(100,(points/nextLvl.min)*100)}%`,
              transition:'width .6s ease',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)',animation:'shimmer 2s infinite'}}/>
            </div>
          </div>
        </Card>
      )}
    </>
  );

  return (
    <div className="sp" style={{paddingBottom:D?40:0}}>
      <div style={{marginBottom:D?28:24,position:'relative'}} className="fade-up">
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:D?28:22,color:C.txt,lineHeight:1.2,paddingRight:!D?120:0}}>
          {greet}
        </div>
        <div style={{fontSize:D?13:12,color:C.mut,marginTop:4}}>
          {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
        </div>
        {!D && (
          <div style={{position:'absolute',top:0,right:0,textAlign:'right'}}>
            <div style={{background:C.amberD,border:`1.5px solid rgba(251,191,36,.25)`,
              borderRadius:24,padding:'7px 14px',display:'inline-flex',alignItems:'center',gap:7}}>
              <span style={{fontSize:15}}>⚡</span>
              <span style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800,color:C.amber}}>{points}</span>
            </div>
            <div style={{fontSize:11,color:lvl.color,marginTop:4,fontWeight:700}}>{lvl.name}</div>
          </div>
        )}
      </div>

      {D ? (
        <div className="home-2col">
          <div style={{display:'flex',flexDirection:'column',gap:16}}>{progressCard}{tasksPreview}</div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>{offlineSug}{ctaLevel}</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {progressCard}{tasksPreview}{offlineSug}{ctaLevel}
        </div>
      )}
      <div style={{height:D?0:28}}/>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TASKS SCREEN
══════════════════════════════════════════════ */
function TasksScreen({tasks,setTasks,addPts,awardBadge,D}) {
  const [form,setForm]   = useState({title:'',category:'study',estimatedMins:'25'});
  const [adding,setAdding]= useState(false);
  const today = todayStr();

  const submit = () => {
    if (!form.title.trim()) return;
    setTasks(ts => [...ts, {id:uid(),title:form.title.trim(),category:form.category,
      estimatedMins:parseInt(form.estimatedMins)||25,completed:false,date:today,pts:10}]);
    setForm(f => ({...f,title:''})); setAdding(false);
  };

  const toggle = id => {
    setTasks(ts => ts.map(t => {
      if (t.id !== id) return t;
      if (!t.completed) {
        addPts(t.pts||10,'Task completed!');
        const nd = ts.filter(x=>x.date===today&&x.completed).length+1;
        if (ts.filter(x=>x.date===today&&x.completed).length===0) awardBadge('first_task');
        if (nd >= 5) awardBadge('tasks_5');
      }
      return {...t,completed:!t.completed};
    }));
  };

  const del = id => setTasks(ts => ts.filter(t => t.id !== id));
  const todayT = tasks.filter(t => t.date === today);
  const doneC  = todayT.filter(t => t.completed).length;
  const groups = Object.entries(CATS)
    .map(([k,v]) => ({key:k,cat:v,items:todayT.filter(t=>t.category===k)}))
    .filter(g => g.items.length > 0);

  return (
    <div className="sp">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:D?24:22}}>
        <div>
          <h2 className="pg-title">Today's Tasks</h2>
          <div style={{fontSize:D?13:12,color:C.mut,marginTop:3}}>{doneC} done · {todayT.length-doneC} remaining</div>
        </div>
        <button onClick={() => setAdding(!adding)} style={{
          width:D?44:38,height:D?44:38,borderRadius:13,flexShrink:0,
          background:adding?C.redD:C.mint,color:adding?C.red:'#060A10',
          fontSize:24,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',
          border:adding?`1.5px solid ${C.red}40`:'none',transition:'all .2s'}}>
          {adding?'×':'+'}
        </button>
      </div>

      {adding && (
        <Card style={{padding:D?20:16,border:`1.5px solid rgba(20,240,160,.2)`,marginBottom:20}} className="fade-up">
          <input type="text" placeholder="What do you need to do?" value={form.title}
            onChange={e=>setForm(f=>({...f,title:e.target.value}))}
            onKeyDown={e=>{if(e.key==='Enter')submit();}} autoFocus style={{marginBottom:10}}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:C.mut,marginBottom:5,fontWeight:600}}>Category</div>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:C.mut,marginBottom:5,fontWeight:600}}>Est. minutes</div>
              <input type="number" value={form.estimatedMins} min="5" max="240"
                onChange={e=>setForm(f=>({...f,estimatedMins:e.target.value}))}/>
            </div>
          </div>
          <button onClick={submit} style={{width:'100%',background:C.mint,color:'#060A10',borderRadius:13,
            padding:D?'14px':'12px',fontSize:D?15:14,fontWeight:700,fontFamily:'Syne,sans-serif'}}>
            Add Task  (+10 pts)
          </button>
        </Card>
      )}

      {todayT.length===0 && (
        <div style={{textAlign:'center',padding:D?'80px 20px':'60px 20px',color:C.mut}} className="fade-up">
          <div style={{fontSize:52,marginBottom:14}}>📋</div>
          <div style={{fontSize:D?18:16,fontWeight:700,color:C.sub,marginBottom:8}}>No tasks yet</div>
          <div style={{fontSize:D?14:13,lineHeight:1.7}}>Click + to add your first task<br/>and start building momentum</div>
        </div>
      )}

      {groups.map(({key,cat,items}) => (
        <div key={key} style={{marginBottom:24}} className="fade-up">
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
            <span style={{fontSize:15}}>{cat.emoji}</span>
            <SLabel style={{color:cat.color}}>{cat.label}</SLabel>
            <span style={{fontSize:11,color:C.mut,marginLeft:'auto'}}>{items.filter(t=>t.completed).length}/{items.length}</span>
          </div>
          {items.map(t => <TaskItem key={t.id} task={t} cat={cat} onToggle={toggle} onDel={del} D={D}/>)}
        </div>
      ))}
      <div style={{height:D?40:0}}/>
    </div>
  );
}

function TaskItem({task,cat,onToggle,onDel,D}) {
  const [p,setP] = useState(false);
  return (
    <div style={{background:task.completed?'rgba(255,255,255,.02)':C.card,
      border:`1.5px solid ${C.bdr}`,borderLeft:`3px solid ${task.completed?cat.color+'40':cat.color}`,
      borderRadius:14,padding:D?'15px 16px':'13px 14px',marginBottom:8,
      display:'flex',alignItems:'center',gap:12,
      opacity:task.completed?.5:1,transition:'all .25s'}} className="fade-up">
      <button onClick={() => {setP(true);setTimeout(()=>setP(false),300);onToggle(task.id);}}
        style={{width:D?26:24,height:D?26:24,borderRadius:8,flexShrink:0,
          border:`2px solid ${task.completed?cat.color:C.bdr}`,
          background:task.completed?cat.color:'transparent',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all .2s',transform:p?'scale(1.2)':'scale(1)'}}>
        {task.completed&&<span style={{color:'#060A10',fontSize:12,fontWeight:900}}>✓</span>}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:D?15:14,fontWeight:500,color:C.txt,
          textDecoration:task.completed?'line-through':'none',
          whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{task.title}</div>
        <div style={{fontSize:11,color:C.mut,marginTop:2}}>{task.estimatedMins} min</div>
      </div>
      <Pill text={`+${task.pts||10}`} color={cat.color} bg={cat.dim}/>
      <button onClick={() => onDel(task.id)} style={{color:C.mut,fontSize:20,padding:'2px 6px',lineHeight:1,flexShrink:0}}>×</button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FOCUS SCREEN
══════════════════════════════════════════════ */
function FocusScreen({tasks,sessions,setSessions,addPts,awardBadge,showToast,D}) {
  const [wm,setWm] = useState(25);
  const [bm,setBm] = useState(5);
  const [phase,setPhase]   = useState('work');
  const [left,setLeft]     = useState(25*60);
  const [run,setRun]       = useState(false);
  const [sD,setSD]         = useState(0);
  const [sel,setSel]       = useState('');
  const today = todayStr();
  const todayT = tasks.filter(t=>t.date===today&&!t.completed);
  const todayS = sessions.filter(s=>s.date===today&&s.type==='work'&&s.completed);
  const todayM = todayS.reduce((a,x)=>a+x.duration,0);

  useEffect(()=>{
    if(!run)return; const id=setInterval(()=>setLeft(t=>Math.max(0,t-1)),1000); return()=>clearInterval(id);
  },[run]);

  useEffect(()=>{
    if(left>0||!run)return; setRun(false);
    if(phase==='work'){
      const sc=sD+1; setSD(sc);
      setSessions(ss=>[...ss,{id:uid(),duration:wm,type:'work',taskId:sel,date:today,completed:true}]);
      addPts(30,'Focus session complete!');
      if(sc===1) awardBadge('focus_1');
      if(sessions.filter(x=>x.type==='work'&&x.completed).length+1>=5) awardBadge('focus_5');
      setPhase('break'); setLeft(bm*60); showToast('🎉 Session done! Take a break.');
    } else {
      setPhase('work'); setLeft(wm*60); showToast('⚡ Break over — ready to focus!');
    }
  },[left,run]);

  const tog = () => { if(left===0){setPhase('work');setLeft(wm*60);return;} setRun(r=>!r); };
  const rst = () => { setRun(false); setPhase('work'); setLeft(wm*60); };
  const tot = phase==='work'?wm*60:bm*60;
  const prg = 1-(left/tot);
  const rs  = D?104:82; const sz=D?262:210;
  const circ= 2*Math.PI*rs; const rc=phase==='break'?C.blue:C.mint;

  const phaseTabs = (
    <div style={{display:'flex',gap:D?12:8,marginBottom:D?30:28}}>
      {[{id:'work',l:'🎯 Focus',m:wm},{id:'break',l:'☕ Break',m:bm}].map(p=>(
        <button key={p.id} onClick={()=>{if(!run){setPhase(p.id);setLeft(p.m*60);}}}
          style={{flex:1,padding:D?'13px':'10px',borderRadius:14,fontSize:D?14:13,fontWeight:700,
            border:`1.5px solid ${phase===p.id?(p.id==='work'?C.mint:C.blue):C.bdr}`,
            background:phase===p.id?(p.id==='work'?C.mintD:C.blueD):'transparent',
            color:phase===p.id?(p.id==='work'?C.mint:C.blue):C.mut,transition:'all .2s'}}>
          {p.l}
        </button>
      ))}
    </div>
  );

  const ring = (
    <div style={{display:'flex',justifyContent:'center',marginBottom:D?32:28}}>
      <div style={{position:'relative',width:sz,height:sz}} className={run?'pulse':''}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
          <circle cx={sz/2} cy={sz/2} r={rs} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={12}/>
          {run&&<circle cx={sz/2} cy={sz/2} r={rs} fill="none" stroke={rc} strokeWidth={12} opacity={.07}/>}
          <circle cx={sz/2} cy={sz/2} r={rs} fill="none"
            stroke={run||prg>0?rc:'rgba(255,255,255,.05)'}
            strokeWidth={12} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-prg)}
            style={{transform:'rotate(-90deg)',transformOrigin:'center',
              transition:'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)',
              filter:run?`drop-shadow(0 0 8px ${rc}60)`:''}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',gap:5}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:D?56:44,
            color:C.txt,letterSpacing:'-2px',lineHeight:1}}>{fmtTimer(left)}</div>
          <div style={{fontSize:D?12:11,fontWeight:700,letterSpacing:'.1em',color:run?rc:C.mut,transition:'color .3s'}}>
            {run?(phase==='work'?'FOCUSING':'ON BREAK'):(phase==='work'?'READY':'BREAK READY')}
          </div>
          {sD>0&&<div style={{fontSize:11,color:C.amber,marginTop:2}}>{'●'.repeat(Math.min(sD,4))}{sD>4&&` +${sD-4}`}</div>}
        </div>
      </div>
    </div>
  );

  const ctrls = (
    <div style={{display:'flex',gap:10,marginBottom:D?30:22}}>
      <button onClick={tog} className={run?'':'glow'}
        style={{flex:1,borderRadius:17,padding:D?'19px':'17px',
          fontFamily:'Syne,sans-serif',fontSize:D?17:16,fontWeight:800,letterSpacing:'.02em',
          background:run?C.redD:C.mint,color:run?C.red:'#060A10',
          border:run?`1.5px solid ${C.red}50`:'none',transition:'all .2s'}}>
        {run?'⏸  Pause':'▶  Start'}
      </button>
      <button onClick={rst} style={{width:D?62:56,height:D?62:56,borderRadius:17,fontSize:21,
        border:`1.5px solid ${C.bdr}`,color:C.sub,background:'transparent'}}>↺</button>
    </div>
  );

  const settings = !run && (
    <Card style={{padding:D?20:16}} className="fade-up">
      <SLabel style={{marginBottom:12,display:'block'}}>Timer Settings</SLabel>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>
          <div style={{fontSize:11,color:C.mut,marginBottom:6}}>Focus (min)</div>
          <input type="number" value={wm} min="5" max="60"
            onChange={e=>{const v=Math.max(5,parseInt(e.target.value)||25);setWm(v);if(phase==='work')setLeft(v*60);}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.mut,marginBottom:6}}>Break (min)</div>
          <input type="number" value={bm} min="1" max="30"
            onChange={e=>{const v=Math.max(1,parseInt(e.target.value)||5);setBm(v);if(phase==='break')setLeft(v*60);}}/>
        </div>
      </div>
    </Card>
  );

  const history = todayS.length > 0 && (
    <div>
      <SLabel style={{marginBottom:10,display:'block'}}>Today's Sessions</SLabel>
      {[...todayS].reverse().map((s,i) => {
        const lnk = s.taskId ? tasks.find(t=>t.id===s.taskId) : null;
        return (
          <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,
            background:C.card,border:`1.5px solid ${C.bdr}`,borderRadius:13,padding:'11px 14px',marginBottom:7}}>
            <div style={{width:D?30:28,height:D?30:28,borderRadius:9,flexShrink:0,background:C.mintD,
              color:C.mint,fontSize:12,fontWeight:800,display:'flex',alignItems:'center',
              justifyContent:'center',fontFamily:'Syne,sans-serif'}}>
              {todayS.length-i}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:D?14:13,color:C.txt,fontWeight:500}}>{s.duration} min session</div>
              {lnk&&<div style={{fontSize:11,color:C.mut,marginTop:2}}>{lnk.title}</div>}
            </div>
            <Pill text="+30 pts" color={C.mint} bg={C.mintD}/>
          </div>
        );
      })}
    </div>
  );

  if (D) return (
    <div className="sp">
      <div style={{marginBottom:28}}>
        <h2 className="pg-title">Focus Timer</h2>
        <div style={{fontSize:13,color:C.mut,marginTop:3}}>{todayS.length} sessions · {todayM} min today</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 400px',gap:36,alignItems:'start'}}>
        <div>
          {todayT.length>0&&(
            <select value={sel} onChange={e=>setSel(e.target.value)} style={{marginBottom:20}}>
              <option value="">Select a task (optional)</option>
              {todayT.map(t=><option key={t.id} value={t.id}>{CATS[t.category]?.emoji} {t.title}</option>)}
            </select>
          )}
          {phaseTabs}{ring}{ctrls}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>{settings}{history}</div>
      </div>
      <div style={{height:40}}/>
    </div>
  );

  return (
    <div className="sp">
      <div style={{marginBottom:22}}>
        <h2 className="pg-title">Focus Timer</h2>
        <div style={{fontSize:12,color:C.mut,marginTop:3}}>{todayS.length} sessions · {todayM} min today</div>
      </div>
      {todayT.length>0&&(
        <select value={sel} onChange={e=>setSel(e.target.value)} style={{marginBottom:18,fontSize:13}}>
          <option value="">Select a task (optional)</option>
          {todayT.map(t=><option key={t.id} value={t.id}>{CATS[t.category]?.emoji} {t.title}</option>)}
        </select>
      )}
      {phaseTabs}{ring}{ctrls}
      {!run&&settings&&<div style={{marginBottom:18}}>{settings}</div>}
      {history&&<div style={{marginBottom:20}}>{history}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   HABITS SCREEN
══════════════════════════════════════════════ */
const EMOJIS=['🏃','📖','🧘','💪','✍️','🥗','💧','🎨','📵','🌿','🎵','🌟','🏋️','🚴','🙏'];

function HabitsScreen({habits,setHabits,addPts,awardBadge,D}) {
  const [adding,setAdding]= useState(false);
  const [form,setForm]    = useState({title:'',emoji:'🌟',category:'personal'});
  const today=todayStr(); const weekDates=getWeekDates();
  const doneT=habits.filter(h=>h.completedDates.includes(today)).length;

  const tog = id => {
    setHabits(hs=>hs.map(h=>{
      if(h.id!==id)return h;
      const already=h.completedDates.includes(today);
      const dates=already?h.completedDates.filter(d=>d!==today):[...h.completedDates,today];
      if(!already){const s=calcStreak(dates);addPts(20,'Habit checked!');if(s>=3)awardBadge('habit_3');if(s>=7)awardBadge('habit_7');}
      return{...h,completedDates:dates};
    }));
  };

  const addH = () => {
    if(!form.title.trim())return;
    setHabits(hs=>[...hs,{id:uid(),title:form.title.trim(),emoji:form.emoji,category:form.category,completedDates:[],createdAt:todayStr()}]);
    setForm({title:'',emoji:'🌟',category:'personal'}); setAdding(false);
  };

  const del=id=>setHabits(hs=>hs.filter(h=>h.id!==id));

  return (
    <div className="sp">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:D?24:22}}>
        <div>
          <h2 className="pg-title">Habits</h2>
          <div style={{fontSize:D?13:12,color:C.mut,marginTop:3}}>{doneT}/{habits.length} done today</div>
        </div>
        <button onClick={()=>setAdding(!adding)} style={{
          width:D?44:38,height:D?44:38,borderRadius:13,flexShrink:0,
          background:adding?C.redD:C.mint,color:adding?C.red:'#060A10',
          fontSize:24,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',
          border:adding?`1.5px solid ${C.red}40`:'none',transition:'all .2s'}}>
          {adding?'×':'+'}
        </button>
      </div>

      {adding && (
        <Card style={{padding:D?20:16,border:`1.5px solid rgba(20,240,160,.2)`,marginBottom:20}} className="fade-up">
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.mut,marginBottom:8,fontWeight:600}}>Pick an emoji</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))} style={{
                  width:D?42:38,height:D?42:38,borderRadius:11,fontSize:19,
                  border:`1.5px solid ${form.emoji===e?C.mint:C.bdr}`,
                  background:form.emoji===e?C.mintD:'rgba(255,255,255,.03)',transition:'all .15s'}}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <input type="text" placeholder="Habit name" value={form.title}
            onChange={e=>setForm(f=>({...f,title:e.target.value}))}
            onKeyDown={e=>{if(e.key==='Enter')addH();}} autoFocus style={{marginBottom:10}}/>
          <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{marginBottom:12}}>
            {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
          <button onClick={addH} style={{width:'100%',background:C.mint,color:'#060A10',borderRadius:13,
            padding:D?'14px':'12px',fontSize:D?15:14,fontWeight:700,fontFamily:'Syne,sans-serif'}}>
            Add Habit
          </button>
        </Card>
      )}

      {habits.length===0&&(
        <div style={{textAlign:'center',padding:D?'80px 20px':'60px 20px',color:C.mut}} className="fade-up">
          <div style={{fontSize:52,marginBottom:14}}>◆</div>
          <div style={{fontSize:D?18:16,fontWeight:700,color:C.sub,marginBottom:8}}>No habits yet</div>
          <div style={{fontSize:D?14:13,lineHeight:1.7}}>Build lasting habits one day at a time.</div>
        </div>
      )}

      <div className="habits-wrap">
        {habits.map(h=>{
          const done=h.completedDates.includes(today);
          const streak=calcStreak(h.completedDates);
          const cat=CATS[h.category]||CATS.personal;
          return(
            <div key={h.id} className="fade-up" style={{
              background:done?cat.dim:C.card,border:`1.5px solid ${done?cat.color+'30':C.bdr}`,
              borderRadius:18,padding:D?'16px 18px':'14px 16px',transition:'all .3s'}}>
              <div style={{display:'flex',alignItems:'center',gap:13}}>
                <button onClick={()=>tog(h.id)} style={{
                  width:D?52:48,height:D?52:48,borderRadius:16,fontSize:24,flexShrink:0,
                  border:`2px solid ${done?cat.color:C.bdr}`,
                  background:done?cat.dim:'rgba(255,255,255,.03)',transition:'all .2s',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  position:'relative',overflow:'hidden'}}>
                  <span style={{position:'relative',zIndex:1}}>{h.emoji}</span>
                  {done&&<div style={{position:'absolute',inset:0,background:cat.color+'15',
                    display:'flex',alignItems:'flex-end',justifyContent:'flex-end',padding:'3px'}}>
                    <span style={{fontSize:10,color:cat.color,fontWeight:900}}>✓</span>
                  </div>}
                </button>
                <div style={{flex:1}}>
                  <div style={{fontSize:D?15:14,fontWeight:600,color:done?cat.color:C.txt}}>{h.title}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                    {streak>0&&<span style={{fontSize:11,color:C.amber,fontWeight:700}}>🔥 {streak}d streak</span>}
                    <span style={{fontSize:11,color:C.mut}}>{cat.emoji} {cat.label}</span>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                  {done&&<Pill text="Done ✓" color={cat.color} bg={cat.dim}/>}
                  <button onClick={()=>del(h.id)} style={{color:C.mut,fontSize:18,lineHeight:1,padding:'2px 4px'}}>×</button>
                </div>
              </div>
              <div style={{display:'flex',gap:3,marginTop:12}}>
                {weekDates.map((d,i)=>{
                  const ch=h.completedDates.includes(d);const isT=d===today;
                  return(
                    <div key={d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <div style={{width:'100%',height:5,borderRadius:3,
                        background:ch?cat.color:(isT?'rgba(255,255,255,.2)':'rgba(255,255,255,.05)'),transition:'background .3s'}}/>
                      <span style={{fontSize:8,color:isT?cat.color:C.mut,fontWeight:isT?700:400}}>
                        {['M','T','W','T','F','S','S'][i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{height:D?40:0}}/>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STATS SCREEN
══════════════════════════════════════════════ */
function StatsScreen({tasks,sessions,habits,points,badges,D}) {
  const [insight,setInsight]= useState('');
  const [loading,setLoading]= useState(false);
  const [apiKey,setApiKey]  = useState('');
  const [showKey,setShowKey]= useState(false);
  const today=todayStr(); const weekDates=getWeekDates();

  const wTD=weekDates.map(d=>{
    const all=tasks.filter(t=>t.date===d);
    return{d,done:all.filter(t=>t.completed).length,total:all.length,
      day:new Date(d+'T12:00:00').toLocaleDateString('en',{weekday:'short'})};
  });
  const wFD=weekDates.map(d=>{
    const m=sessions.filter(s=>s.date===d&&s.type==='work'&&s.completed).reduce((a,x)=>a+x.duration,0);
    return{d,mins:m,day:new Date(d+'T12:00:00').toLocaleDateString('en',{weekday:'short'})};
  });
  const totT  =tasks.filter(t=>t.completed).length;
  const totF  =sessions.filter(s=>s.type==='work'&&s.completed).reduce((a,x)=>a+x.duration,0);
  const lonStr=habits.reduce((mx,h)=>Math.max(mx,calcStreak(h.completedDates)),0);
  const mxBar =Math.max(...wTD.map(d=>d.total),1);
  const mxFoc =Math.max(...wFD.map(d=>d.mins),1);
  const wFM   =wFD.reduce((a,d)=>a+d.mins,0);
  const wTDone=wTD.reduce((a,d)=>a+d.done,0);

  const smart=()=>{
    const l=[];
    if(wFM<60)l.push("💡 Your focus time this week is below 60 min. Try 2 short Pomodoros each morning to build the habit.");
    else l.push(`🔥 Great focus this week — ${wFM} min logged! You're building real momentum.`);
    if(lonStr>=3)l.push(`🏆 Your longest habit streak is ${lonStr} days. Consistency compounds — keep it going!`);
    else l.push("🌱 Small daily habits beat occasional big efforts. Try checking off at least one habit every day.");
    if(wTDone<5)l.push("📝 Start with 2–3 clear tasks each morning. Small wins build confidence and momentum.");
    else l.push(`✅ You completed ${wTDone} tasks this week. That's solid output!`);
    return l.slice(0,3).join('\n\n');
  };

  const fetchAI=async()=>{
    if(!apiKey){setShowKey(true);return;}
    setLoading(true);setShowKey(false);
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,
          'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:350,
          system:'You are a supportive productivity coach for a young person aged 17-24. Give 3 brief, specific, encouraging insights. Use plain language and one emoji per insight. Focus on reducing phone use and building focus habits.',
          messages:[{role:'user',content:`Weekly: Tasks: ${wTDone}, Focus: ${wFM}min, Streak: ${lonStr}d, Points: ${points}, Badges: ${badges.length}. Give 3 personalized insights.`}]}),
      });
      const data=await res.json();
      setInsight(data.content?.[0]?.text||smart());
    }catch{setInsight(smart());}
    setLoading(false);
  };

  const ChH=D?110:88; const MH=D?98:78;
  const FH=D?110:72;  const FM=D?98:65;

  return(
    <div className="sp">
      <div style={{marginBottom:D?28:22}}>
        <h2 className="pg-title">Your Stats</h2>
        <div style={{fontSize:D?13:12,color:C.mut,marginTop:3}}>Your productivity journey</div>
      </div>

      <div className="g2" style={{marginBottom:D?24:20}}>
        {[
          {val:totT,  lbl:'Tasks Done', icon:'✅',col:C.mint},
          {val:`${Math.floor(totF/60)}h ${totF%60}m`,lbl:'Total Focus',icon:'⏱',col:C.blue},
          {val:`${lonStr}d`,lbl:'Best Streak',icon:'🔥',col:C.amber},
          {val:badges.length,lbl:'Badges',icon:'🏅',col:C.purple},
        ].map(m=>(
          <Card key={m.lbl} style={{padding:D?'18px 20px':'14px 16px'}} className="fade-up">
            <div style={{fontSize:D?26:22,marginBottom:6}}>{m.icon}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:D?28:24,color:m.col}}>{m.val}</div>
            <div style={{fontSize:11,color:C.mut,marginTop:3,fontWeight:500}}>{m.lbl}</div>
          </Card>
        ))}
      </div>

      <div className="charts-wrap" style={{marginBottom:D?24:14}}>
        <Card style={{padding:D?20:16}} className="fade-up">
          <SLabel style={{marginBottom:14,display:'block'}}>Tasks This Week</SLabel>
          <div style={{display:'flex',alignItems:'flex-end',gap:5,height:ChH}}>
            {wTD.map(d=>{
              const isT=d.d===today; const hT=d.total>0?(d.total/mxBar)*MH:3;
              return(
                <div key={d.d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                  <div style={{width:'100%',position:'relative',height:hT,minHeight:3,borderRadius:5,background:'rgba(255,255,255,.06)'}}>
                    {d.done>0&&<div style={{position:'absolute',bottom:0,width:'100%',
                      height:`${(d.done/Math.max(d.total,1))*100}%`,minHeight:3,
                      background:isT?C.mint:`${C.mint}55`,borderRadius:5,transition:'height .6s ease'}}/>}
                  </div>
                  <span style={{fontSize:9,color:isT?C.mint:C.mut,fontWeight:isT?800:400}}>{d.day}</span>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',gap:14,marginTop:10,fontSize:11,color:C.mut}}>
            <span><span style={{color:C.mint}}>■</span> Done</span>
            <span><span style={{color:'rgba(255,255,255,.15)'}}>■</span> Total</span>
          </div>
        </Card>

        <Card style={{padding:D?20:16}} className="fade-up">
          <SLabel style={{marginBottom:14,display:'block'}}>Focus Time (min)</SLabel>
          <div style={{display:'flex',alignItems:'flex-end',gap:5,height:FH}}>
            {wFD.map(d=>{
              const isT=d.d===today; const h=d.mins>0?(d.mins/mxFoc)*FM:3;
              return(
                <div key={d.d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                  <div style={{width:'100%',height:Math.max(h,3),borderRadius:5,
                    background:isT?C.amber:`${C.amber}50`,transition:'height .6s ease'}}/>
                  <span style={{fontSize:9,color:isT?C.amber:C.mut,fontWeight:isT?800:400}}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card style={{padding:D?20:16,marginBottom:D?16:14}} className="fade-up">
        <SLabel style={{marginBottom:14,display:'block'}}>Habit Consistency</SLabel>
        {habits.length===0?<div style={{fontSize:13,color:C.mut}}>No habits tracked yet</div>:(
          habits.map(h=>{
            const st=calcStreak(h.completedDates); const cat=CATS[h.category]||CATS.personal;
            const rate=weekDates.filter(d=>h.completedDates.includes(d)).length;
            return(
              <div key={h.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <span style={{fontSize:D?20:18,width:28,flexShrink:0}}>{h.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:D?13:12}}>
                    <span style={{color:C.txt,fontWeight:500}}>{h.title}</span>
                    <span style={{color:st>0?C.amber:C.mut,fontWeight:600}}>{st>0?`🔥 ${st}d`:'—'}</span>
                  </div>
                  <div style={{background:'rgba(255,255,255,.05)',borderRadius:4,height:4}}>
                    <div style={{height:4,borderRadius:4,background:cat.color,width:`${(rate/7)*100}%`,transition:'width .6s ease'}}/>
                  </div>
                </div>
                <span style={{fontSize:11,color:C.mut,width:30,textAlign:'right'}}>{rate}/7</span>
              </div>
            );
          })
        )}
      </Card>

      {badges.length>0&&(
        <Card style={{padding:D?20:16,marginBottom:D?16:14}} className="fade-up">
          <SLabel style={{marginBottom:14,display:'block'}}>Badges Earned</SLabel>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {BADGES.filter(b=>badges.includes(b.id)).map(b=>(
              <div key={b.id} style={{background:C.amberD,border:`1.5px solid rgba(251,191,36,.25)`,
                borderRadius:14,padding:'8px 13px',display:'flex',alignItems:'center',gap:7}}>
                <span style={{fontSize:D?19:17}}>{b.emoji}</span>
                <div>
                  <div style={{fontSize:D?13:12,fontWeight:700,color:C.amber}}>{b.name}</div>
                  <div style={{fontSize:10,color:C.mut}}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Insights */}
      <div style={{background:`linear-gradient(135deg,rgba(167,139,250,.07),rgba(167,139,250,.03))`,
        border:`1.5px solid rgba(167,139,250,.2)`,borderRadius:18,padding:D?20:16,marginBottom:D?40:28}} className="fade-up">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <SLabel style={{color:C.purple}}>🤖 AI Insights</SLabel>
          <button onClick={()=>{if(!insight)fetchAI();else{setInsight('');setShowKey(false);}}}
            style={{fontSize:12,fontWeight:700,color:C.purple,
              background:'rgba(167,139,250,.12)',border:`1.5px solid rgba(167,139,250,.25)`,
              borderRadius:20,padding:'7px 16px'}}>
            {loading?'Thinking…':(insight?'Refresh':'Get Insights')}
          </button>
        </div>
        {showKey&&(
          <div className="fade-up" style={{marginBottom:12}}>
            <div style={{fontSize:12,color:C.sub,marginBottom:7,lineHeight:1.5}}>
              Enter your Claude API key for personalized AI insights.
            </div>
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <input type="password" placeholder="sk-ant-api..." value={apiKey}
                onChange={e=>setApiKey(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')fetchAI();}} style={{flex:1,fontSize:13}}/>
              <button onClick={fetchAI} style={{background:C.purple,color:'#fff',borderRadius:12,
                padding:'0 16px',fontSize:13,fontWeight:700,flexShrink:0,minWidth:52}}>Go</button>
            </div>
            <button onClick={()=>{setShowKey(false);setInsight(smart());}}
              style={{fontSize:11,color:C.sub,textDecoration:'underline'}}>
              Use smart recommendations instead →
            </button>
          </div>
        )}
        {loading&&<div style={{textAlign:'center',padding:20,color:C.sub,fontSize:14}}>Analyzing your patterns… ✨</div>}
        {insight&&!loading&&<div className="fade-up" style={{fontSize:D?14:13,color:C.txt,lineHeight:1.8,whiteSpace:'pre-line'}}>{insight}</div>}
        {!insight&&!loading&&!showKey&&<div style={{fontSize:12,color:C.mut,lineHeight:1.7}}>Get personalized recommendations — powered by Claude AI or smart local analysis.</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ROOT  —  auth state machine
══════════════════════════════════════════════ */
function Root() {
  // authState: 'loading' | 'login' | 'register' | 'verify' | 'app'
  const [authState, setAuthState] = useState('loading');
  const [authEmail, setAuthEmail] = useState('');
  const [user, setUser]           = useState(null);

  /* Validate stored session on mount */
  useEffect(() => {
    const token = localStorage.getItem('fv_session');
    if (!token) { setAuthState('login'); return; }
    api.validateSession({ token }).then(res => {
      if (res.valid) {
        setUser(res.user);
        setAuthState('app');
      } else {
        localStorage.removeItem('fv_session');
        setAuthState('login');
      }
    });
  }, []);

  const handleLogin = (u, token) => {
    localStorage.setItem('fv_session', token);
    setUser(u);
    setAuthState('app');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('fv_session');
    await api.logout({ token });
    localStorage.removeItem('fv_session');
    setUser(null);
    setAuthState('login');
  };

  return (
    <UserCtx.Provider value={user}>
      <div className="app-shell">
        <TitleBar/>
        {authState === 'loading'   && <LoadingScreen/>}
        {authState === 'login'     && (
          <LoginScreen
            onLogin={handleLogin}
            onRegister={() => setAuthState('register')}
            onNeedsVerify={email => { setAuthEmail(email); setAuthState('verify'); }}
          />
        )}
        {authState === 'register'  && (
          <RegisterScreen
            onLogin={() => setAuthState('login')}
            onVerify={email => { setAuthEmail(email); setAuthState('verify'); }}
          />
        )}
        {authState === 'verify'    && (
          <VerifyScreen
            email={authEmail}
            onVerified={handleLogin}
            onBack={() => setAuthState('login')}
          />
        )}
        {authState === 'app'       && user && (
          <App user={user} onLogout={handleLogout}/>
        )}
      </div>
    </UserCtx.Provider>
  );
}

/* ══════════════════════════════════════════════
   MOUNT
══════════════════════════════════════════════ */
ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
