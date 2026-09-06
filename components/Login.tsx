import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

    return (
        <div className="min-h-screen w-full flex flex-col justify-between bg-[#05060A] text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
            
            {/* Phenomenon Studio Ambient Lights & Noise Grid */}
            <div className="absolute top-[-20%] left-[20%] w-[700px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[10%] w-[600px] h-[500px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />

            {/* Architectural Grid Lines */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '64px 64px'
                }}
            />

            {/* TOP NAVIGATION BAR (Phenomenon Studio Telemetry Header) */}
            <header className="w-full px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/[0.06] relative z-20 backdrop-blur-md bg-[#05060A]/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <span className="material-symbols-rounded text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                            token
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-white text-base tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                            MC INDUSTRIAL
                        </span>
                        <span className="text-[10px] font-mono tracking-widest text-slate-500 hidden sm:inline-block">
                            / QC_SYSTEM_v2.4
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px]">
                    <div className="hidden md:flex items-center gap-2 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="tracking-wider uppercase">CORE: OPERATIONAL</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
                        <span className="text-slate-500 mr-1.5">TIME_UTC:</span>
                        <span className="text-white font-bold">{currentTime || 'LIVE'}</span>
                    </div>
                </div>
            </header>

            {/* MAIN STAGE (Phenomenon Studio Editorial Split Stage) */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between relative z-10 gap-10 lg:gap-16">
                
                {/* LEFT HERO: Brutalist High-Tech Agency Typography & Telemetry */}
                <div className="flex-1 w-full flex flex-col justify-center space-y-8 max-w-xl">
                    
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-md">
                            <span>[ 01 // ENTERPRISE_ACCESS ]</span>
                        </div>

                        <h1 
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05]"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                            Inteligência & Precisão em Cada Lote.
                        </h1>

                        <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-lg">
                            Painel corporativo de controle de qualidade, inspeções técnicas e rastreabilidade operacional de ponta a ponta.
                        </p>
                    </div>

                    {/* Agency Style Live Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-white/[0.08]">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase block">Rendimento</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                96.7%
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">▲ Taxa Conforme</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase block">Volume</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                13.9k
                            </span>
                            <span className="text-[10px] text-blue-400 font-mono mt-1 block">Itens Auditados</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                            <span className="font-mono text-[10px] tracking-widest text-slate-500 uppercase block">Unidades</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                03
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Centros Ativos</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            LAT 06°04'S · LON 50°10'W
                        </span>
                        <span>CARAJÁS · SÃO LUÍS · S11D</span>
                    </div>
                </div>

                {/* RIGHT CARD: Phenomenon Ultra-Sleek Form Card */}
                <div className="w-full max-w-md">
                    <div 
                        className="rounded-3xl p-8 sm:p-10 relative overflow-hidden backdrop-blur-2xl transition-all duration-300"
                        style={{
                            background: 'rgba(10, 12, 18, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 30px 70px -20px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        {/* Top Laser Highlight Streak */}
                        <div 
                            className="absolute top-0 left-0 right-0 h-[1px]"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.8) 50%, transparent 100%)'
                            }}
                        />

                        {!isForgotPassword ? (
                            <>
                                {/* Form Header */}
                                <div className="mb-7">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                                            [ AUTH_PROTOCOL ]
                                        </span>
                                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                    </div>
                                    <h2 
                                        className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                    >
                                        Acesso ao Sistema
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">
                                        Identifique-se para entrar na área restrita.
                                    </p>
                                </div>

                                {/* Error Banner */}
                                {error && (
                                    <div 
                                        className="mb-6 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-200"
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

                                <form onSubmit={handleLogin} className="space-y-4">
                                    {/* Email Field */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 pl-1">
                                            E-mail do Inspetor / Usuário
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="usuario@mcindustrial.com"
                                                className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all outline-none"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    color: '#f8fafc'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center pl-1">
                                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                                                Chave de Acesso (Senha)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError(null);
                                                    setIsForgotPassword(true);
                                                }}
                                                className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                                            >
                                                Esqueceu a chave?
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                className="w-full px-4 pr-11 py-3.5 rounded-xl text-sm font-medium transition-all outline-none"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    color: '#f8fafc'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                            >
                                                <span className="material-symbols-rounded text-lg">
                                                    {showPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center justify-between pt-1">
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

                                    {/* Phenomenon Magnetic CTA Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                        style={{
                                            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
                                            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
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
                            /* Return to Login Mode */
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPassword(false);
                                            setResetEmailSent(false);
                                            setError(null);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white mb-4 transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-rounded text-sm">arrow_back</span>
                                        [ VOLTAR AO LOGIN ]
                                    </button>
                                    <h2 
                                        className="text-2xl font-extrabold text-white tracking-tight"
                                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                    >
                                        Redefinição de Chave
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">
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
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        {error && (
                                            <div 
                                                className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold"
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
                                            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 pl-1">
                                                E-mail Registrado
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="usuario@mcindustrial.com"
                                                className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all outline-none"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    color: '#f8fafc'
                                                }}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
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

                        {/* Card Security Note */}
                        <div className="mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>ENC: RSA-4096-GCM</span>
                            <span>AUTH_SECURE</span>
                        </div>
                    </div>
                </div>

            </main>

            {/* PHENOMENON FOOTER TELEMETRY */}
            <footer className="w-full px-6 sm:px-12 py-5 border-t border-white/[0.06] relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
                <div>
                    <span>© 2026 MC INDUSTRIAL SYSTEMS INC. · ALL RIGHTS RESERVED</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="hover:text-slate-300 transition-colors cursor-pointer">PRIVACY PROTOCOL</span>
                    <span className="hover:text-slate-300 transition-colors cursor-pointer">TERMS OF USE</span>
                    <span className="text-slate-600">BUILD 2026.08</span>
                </div>
            </footer>

        </div>
    );
};
