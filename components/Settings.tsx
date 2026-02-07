import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsProps {
    profile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
    password: string;
    onUpdatePassword: (password: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onUpdateProfile, password, onUpdatePassword }) => {
    const [name, setName] = useState(profile.name);
    const [role, setRole] = useState(profile.role);
    const [avatar, setAvatar] = useState(profile.avatar);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('evidencias')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('evidencias')
                .getPublicUrl(filePath);

            setAvatar(publicUrl);
            setMessage({ type: 'success', text: 'Foto carregada! Clique em Atualizar Perfil para salvar.' });
        } catch (err: any) {
            console.error('Erro no upload da foto:', err);
            setMessage({ type: 'error', text: 'Erro ao carregar foto: ' + err.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await onUpdateProfile({ ...profile, name, role, avatar });
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil: ' + err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = () => {
        if (oldPassword !== password) {
            setMessage({ type: 'error', text: 'Senha atual incorreta.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }
        if (newPassword.length < 4) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
            return;
        }

        onUpdatePassword(newPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h1>
                <p className="text-slate-500 mt-1 font-medium">Gerencie suas informações pessoais e segurança da conta.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Perfil */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <span className="material-symbols-rounded text-primary !text-2xl fill-1">person</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Perfil do Usuário</h2>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative group">
                            <img
                                src={avatar}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm transition-opacity group-hover:opacity-75"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full text-white"
                            >
                                <span className="material-symbols-rounded">{isUploading ? 'sync' : 'photo_camera'}</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <div className="text-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs font-bold text-primary hover:underline hover:text-primary-dark"
                            >
                                {isUploading ? 'Enviando...' : 'Alterar Foto de Perfil'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Cargo / Função</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                                placeholder="Ex: Gerente de Qualidade"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={isSaving || isUploading}
                        className={`w-full h-12 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 ${isSaving || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? 'Salvando...' : 'Atualizar Perfil'}
                    </button>
                </div>

                {/* Segurança */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-amber-100 p-3 rounded-2xl">
                            <span className="material-symbols-rounded text-amber-600 !text-2xl fill-1">lock</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Segurança</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Senha Atual</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                                placeholder="Mínimo 4 caracteres"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                                placeholder="Repita a nova senha"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleChangePassword}
                        className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Alterar Senha
                    </button>
                </div>
            </div>

            <footer className="text-center pt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                © 2026 MC Industrial Systems Inc.
            </footer>
        </div>
    );
};
