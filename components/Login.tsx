import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import loginHero from '../assets/login-hero.jpg';

function useCountUp(target: number, duration = 1300): number {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let start: number | null = null;
        let raf: number;

        const step = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return value;
}

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    const conformeCount = useCountUp(96.7);
    const itensCount = useCountUp(13.9);
    const centrosCount = useCountUp(3);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (authError) {
            if (authError.message === 'Invalid login credentials') {
                setError('Credenciais inválidas. Verifique seu e-mail e chave de acesso.');
            } else if (authError.message === 'Email not confirmed') {
                setError('Confirmação pendente. Verifique a caixa de entrada do seu e-mail.');
            } else if (authError.message === 'Email logins are disabled') {
                setError('Acesso temporariamente restrito pelo administrador do sistema.');
            } else {
                setError(authError.message);
            }
        }
        setLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Informe o e-mail cadastrado para prosseguir.');
            return;
        }
        setLoading(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin,
        });

        if (resetError) {
            setError(resetError.message);
        } else {
            setResetEmailSent(true);
        }
        setLoading(false);
    };

    const formPanel = (
        <div className="w-full max-w-[420px]">
            {!isForgotPassword ? (
                <>
                    <div className="mb-9 fade-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-[10px] tracking-[0.25em] text-slate-500 uppercase">
                                [ 02 // AUTH_PROTOCOL ]
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                        </div>
                        <h2
                            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                            Acesso ao Sistema
                        </h2>
                        <p className="text-sm text-slate-400 mt-2 font-normal">
                            Identifique-se para entrar na área restrita.
                        </p>
                    </div>

                    {error && (
                        <div
                            className="mb-6 p-3.5 rounded-lg flex items-start gap-2.5 text-xs font-semibold"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#fca5a5'
                            }}
                        >
                            <span className="material-symbols-rounded text-base flex-shrink-0 text-red-400">warning</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5 fade-up" style={{ animationDelay: '0.44s' }}>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
                                E-mail do Inspetor / Usuário
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@mcindustrial.com"
                                className="w-full px-0 py-3 text-sm font-medium bg-transparent outline-none text-slate-100 placeholder:text-slate-600 border-0 border-b transition-colors focus:border-blue-500"
                                style={{ borderBottomColor: 'rgba(255, 255, 255, 0.12)' }}
                            />
                        </div>

                        <div className="space-y-1.5 fade-up" style={{ animationDelay: '0.54s' }}>
                            <div className="flex justify-between items-baseline">
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
                                    Chave de Acesso
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setIsForgotPassword(true);
                                    }}
                                    className="text-[11px] font-medium text-slate-500 hover:text-white transition-colors cursor-pointer"
                                >
                                    Esqueceu a chave?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full px-0 pr-8 py-3 text-sm font-medium bg-transparent outline-none text-slate-100 placeholder:text-slate-600 border-0 border-b transition-colors focus:border-blue-500"
                                    style={{ borderBottomColor: 'rgba(255, 255, 255, 0.12)' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-rounded text-lg">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 fade-up" style={{ animationDelay: '0.64s' }}>
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <span className="text-xs text-slate-400 font-medium">Manter sessão ativa</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 fade-up"
                            style={{
                                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                                animationDelay: '0.74s'
                            }}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Entrar no Painel</span>
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <span className="material-symbols-rounded text-sm">arrow_forward</span>
                                    </div>
                                </>
                            )}
                        </button>
                    </form>
                </>
            ) : (
                <div className="space-y-6">
                    <div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsForgotPassword(false);
                                setResetEmailSent(false);
                                setError(null);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-white mb-5 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-rounded text-sm">arrow_back</span>
                            [ VOLTAR AO LOGIN ]
                        </button>
                        <h2
                            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                            Redefinição de Chave
                        </h2>
                        <p className="text-sm text-slate-400 mt-2 font-normal">
                            Insira seu e-mail para receber as instruções de recuperação.
                        </p>
                    </div>

                    {resetEmailSent ? (
                        <div
                            className="p-5 rounded-2xl text-center space-y-3"
                            style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                <span className="material-symbols-rounded text-xl">done</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">Link Enviado</h4>
                            <p className="text-xs text-slate-300">
                                Instruções despachadas para <strong>{email}</strong>.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setResetEmailSent(false);
                                }}
                                className="w-full mt-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                            >
                                Retornar para o Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {error && (
                                <div
                                    className="p-3.5 rounded-lg flex items-start gap-2.5 text-xs font-semibold"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        color: '#fca5a5'
                                    }}
                                >
                                    <span className="material-symbols-rounded text-base flex-shrink-0 text-red-400">warning</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500">
                                    E-mail Registrado
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@mcindustrial.com"
                                    className="w-full px-0 py-3 text-sm font-medium bg-transparent outline-none text-slate-100 placeholder:text-slate-600 border-0 border-b transition-colors focus:border-blue-500"
                                    style={{ borderBottomColor: 'rgba(255, 255, 255, 0.12)' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                                style={{
                                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                                    boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)'
                                }}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span>Despachar Link de Redefinição</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}

            <div className="mt-9 pt-5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-600 fade-up" style={{ animationDelay: '0.86s' }}>
                <span>ENC: RSA-4096-GCM</span>
                <span>AUTH_SECURE</span>
            </div>
        </div>
    );

    return (
        <div className="login-view min-h-screen lg:h-screen w-full flex flex-col bg-[#05060A] text-slate-100 selection:bg-blue-600 selection:text-white lg:overflow-hidden font-sans">

            {/* Slim top bar */}
            <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between relative z-30 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                            token
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-white text-sm tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            MC INDUSTRIAL
                        </span>
                        <span className="text-[10px] font-mono tracking-widest text-slate-500 hidden sm:inline-block">
                            / QC_SYSTEM_v2.4
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px]">
                    <div className="hidden md:flex items-center gap-2 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="tracking-wider uppercase">CORE: OPERATIONAL</span>
                    </div>
                    <div className="text-slate-400">
                        <span className="text-slate-600 mr-1.5">TIME_UTC:</span>
                        <span className="text-white font-bold">{currentTime || 'LIVE'}</span>
                    </div>
                </div>
            </header>

            {/* MAIN STAGE — cinematic split */}
            <main className="w-full flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">

                {/* LEFT: full-bleed cinematic image */}
                <div className="relative hidden lg:flex lg:flex-[1.35] min-h-0 overflow-hidden">
                    <img
                        src={loginHero}
                        alt="Operação industrial de mineração — inspeção em campo"
                        className="absolute inset-0 w-full h-full object-cover kenburns-img"
                    />

                    {/* Vignette + legibility scrim */}
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, rgba(5,6,10,0.55) 0%, rgba(5,6,10,0.05) 30%, rgba(5,6,10,0.15) 55%, rgba(5,6,10,0.92) 100%)'
                    }} />
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(90deg, rgba(5,6,10,0.35) 0%, transparent 18%, transparent 82%, rgba(5,6,10,0.95) 100%)'
                    }} />

                    {/* Editorial overlay content */}
                    <div className="relative z-10 flex flex-col justify-end h-full w-full px-10 xl:px-14 pb-12 pt-10">
                        <div className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-blue-300 bg-blue-500/10 border border-blue-400/25 backdrop-blur-sm px-3.5 py-1 rounded-md mb-6 fade-up" style={{ animationDelay: '0.1s' }}>
                            <span>[ 01 // ENTERPRISE_ACCESS ]</span>
                        </div>

                        <h1
                            className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-white tracking-tight leading-[1.05] max-w-2xl fade-up"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", textShadow: '0 4px 24px rgba(0,0,0,0.35)', animationDelay: '0.22s' }}
                        >
                            Inteligência & Precisão em Cada Lote.
                        </h1>

                        <p className="text-sm xl:text-base text-slate-300 font-normal leading-relaxed max-w-md mt-5 fade-up" style={{ animationDelay: '0.34s' }}>
                            Painel corporativo de controle de qualidade, inspeções técnicas e rastreabilidade operacional de ponta a ponta.
                        </p>

                        {/* Editorial metric ticker */}
                        <div className="flex items-center gap-6 xl:gap-9 mt-10 pt-7 border-t border-white/[0.15] fade-up" style={{ animationDelay: '0.48s' }}>
                            <div>
                                <span className="text-2xl xl:text-3xl font-extrabold text-white block tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                    {conformeCount.toFixed(1)}%
                                </span>
                                <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">Taxa Conforme</span>
                            </div>
                            <div className="w-px h-8 bg-white/15" />
                            <div>
                                <span className="text-2xl xl:text-3xl font-extrabold text-white block tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                    {itensCount.toFixed(1)}k
                                </span>
                                <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">Itens Auditados</span>
                            </div>
                            <div className="w-px h-8 bg-white/15" />
                            <div>
                                <span className="text-2xl xl:text-3xl font-extrabold text-white block tabular-nums" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                    {String(Math.round(centrosCount)).padStart(2, '0')}
                                </span>
                                <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">Centros Ativos</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 font-mono text-[11px] text-slate-500 mt-7 fade-up" style={{ animationDelay: '0.6s' }}>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                LAT 06°04'S · LON 50°10'W
                            </span>
                            <span>CARAJÁS · SÃO LUÍS · S11D</span>
                        </div>
                    </div>
                </div>

                {/* Mobile hero banner (compact) */}
                <div className="relative lg:hidden h-48 flex-shrink-0 overflow-hidden">
                    <img
                        src={loginHero}
                        alt="Operação industrial de mineração — inspeção em campo"
                        className="absolute inset-0 w-full h-full object-cover kenburns-img"
                    />
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(180deg, rgba(5,6,10,0.2) 0%, rgba(5,6,10,0.96) 100%)'
                    }} />
                    <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-5">
                        <div className="inline-flex w-fit items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-blue-300 bg-blue-500/10 border border-blue-400/25 px-2.5 py-0.5 rounded mb-2 fade-up" style={{ animationDelay: '0.1s' }}>
                            <span>[ 01 // ENTERPRISE_ACCESS ]</span>
                        </div>
                        <h1
                            className="text-xl font-extrabold text-white tracking-tight leading-tight fade-up"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", animationDelay: '0.22s' }}
                        >
                            Inteligência & Precisão em Cada Lote.
                        </h1>
                    </div>
                </div>

                {/* RIGHT: minimal form panel */}
                <div className="w-full lg:flex-1 flex flex-col items-center lg:justify-center px-6 sm:px-10 py-10 lg:py-0 lg:overflow-y-auto">
                    {formPanel}
                </div>

            </main>

            {/* Slim footer telemetry */}
            <footer className="w-full px-6 sm:px-10 py-4 border-t border-white/[0.06] relative z-20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600 font-mono flex-shrink-0">
                <div>
                    <span>© 2026 MC INDUSTRIAL SYSTEMS INC. · ALL RIGHTS RESERVED</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="hover:text-slate-400 transition-colors cursor-pointer">PRIVACY PROTOCOL</span>
                    <span className="hover:text-slate-400 transition-colors cursor-pointer">TERMS OF USE</span>
                    <span className="text-slate-700">BUILD 2026.09</span>
                </div>
            </footer>

        </div>
    );
};
