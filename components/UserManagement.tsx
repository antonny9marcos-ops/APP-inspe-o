import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface UserRecord {
    id: string;
    nome: string;
    role: string;
    avatar_url?: string;
    cargo?: string;
    created_at: string;
}

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'Admin' | 'Inspetor' | 'Cliente'>('Inspetor');
    const [isRegistering, setIsRegistering] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('perfis')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar usuários:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRegisterUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegistering(true);
        setMessage(null);

        try {
            // Nota: No Supabase, criar um usuário por outro requer o Admin API (Service Role)
            // Para este MVP, vamos simular o cadastro e adicionar ao 'perfis' se o usuário existir
            // ou orientar o Admin. 
            // Em uma aplicação real, aqui chamaríamos uma Edge Function.

            const { data, error } = await supabase.auth.signUp({
                email: newEmail,
                password: newPassword,
                options: {
                    data: {
                        full_name: newName,
                        role: newRole,
                    }
                }
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: `Usuário ${newName} cadastrado com sucesso! Um e-mail de confirmação foi enviado (se habilitado).`
            });

            setNewName('');
            setNewEmail('');
            setNewPassword('');
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao cadastrar: ' + err.message });
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
                <p className="text-slate-500 mt-1 font-medium">Controle o acesso de inspetores e clientes à plataforma.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <span className="material-symbols-rounded">
                        {message.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-center">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Usuários Cadastrados</h2>
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{users.length} TOTAL</span>
                        </div>

                        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="p-12 text-slate-300">Carregando usuários...</div>
                            ) : users.length > 0 ? users.map(user => (
                                <div key={user.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <img
                                        src={user.avatar_url || `https://picsum.photos/seed/${user.id}/100`}
                                        className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                                        alt={user.nome}
                                    />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-black text-slate-800">{user.nome}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.cargo || 'Membro'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-600' :
                                                user.role === 'Cliente' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Entrou em {new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12">
                                    <span className="material-symbols-rounded text-slate-200 !text-5xl mb-3">group_off</span>
                                    <p className="text-slate-400 font-bold text-sm">Nenhum usuário encontrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <div className="space-y-6">
                    <form onSubmit={handleRegisterUser} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 sticky top-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/30">
                                <span className="material-symbols-rounded !text-2xl fill-1">person_add</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 leading-tight">Novo Usuário</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Painel Admin</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-2 font-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Usuário</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="rounded-2xl border-slate-100 h-12 bg-slate-50 focus:bg-white focus:ring-primary font-bold text-sm transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="rounded-2xl border-slate-100 h-12 bg-slate-50 focus:bg-white focus:ring-primary font-bold text-sm transition-all"
                                    placeholder="joao@exemplo.com"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="rounded-2xl border-slate-100 h-12 bg-slate-50 focus:bg-white focus:ring-primary font-bold text-sm transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Admin', 'Inspetor', 'Cliente'] as const).map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewRole(role)}
                                            className={`h-11 rounded-xl text-[10px] font-black uppercase transition-all px-1 border-2 ${newRole === role
                                                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                    : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className={`w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10 ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isRegistering ? 'CADASTRANDO...' : 'CADASTRAR USUÁRIO'}
                        </button>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                            <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase">
                                <span className="material-symbols-rounded !text-xs align-middle mr-1">info</span>
                                O cliente terá acesso a dashboards e relatórios, mas não poderá realizar novos registros de inspeção.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
