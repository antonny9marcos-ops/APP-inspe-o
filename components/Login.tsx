import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password,
        });

        if (authError) {
            if (authError.message === 'Invalid login credentials') {
                setError('Nome de usuário ou senha incorretos.');
            } else if (authError.message === 'Email not confirmed') {
                setError('A confirmação de e-mail é necessária. Desative esta exigência no painel do Supabase (Auth > Settings).');
            } else if (authError.message === 'Email logins are disabled') {
                setError('O login por e-mail está desativado. Ative o "Email provider" no painel do Supabase (Auth > Providers).');
            } else {
                setError(authError.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
            {/* Elementos Decorativos de Fundo */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-success/5 rounded-full blur-[100px] animate-pulse"></div>

            <div className="w-full max-w-md p-4 relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl p-8 md:p-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex bg-primary rounded-2xl p-3 text-white shadow-lg shadow-primary/20 mb-6">
                            <span className="material-symbols-rounded !text-3xl fill-1">factory</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">MC Industrial</h1>
                        <p className="text-slate-500 font-medium">Faça login para acessar o painel de controle</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center gap-3 animate-in shake duration-500">
                            <span className="material-symbols-rounded">error</span>
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <span className="material-symbols-rounded !text-xl">alternate_email</span>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="exemplo@mc.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Senha</label>
                                <button type="button" className="text-xs font-bold text-primary hover:underline">Esqueceu a senha?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-rounded !text-xl">lock</span>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-primary focus:border-primary font-medium transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Entrar
                                    <span className="material-symbols-rounded">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        © 2026 MC Industrial Systems Inc.
                    </p>
                </div>
            </div>
        </div>
    );
};
