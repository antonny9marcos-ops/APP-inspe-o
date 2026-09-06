import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsProps {
    profile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => Promise<void>;
    onUpdatePassword: (password: string) => Promise<void>;
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onUpdateProfile, onUpdatePassword, theme = 'light', onToggleTheme }) => {
    const [name, setName] = useState(profile.name);
    const [avatar, setAvatar] = useState(profile.avatar);

    React.useEffect(() => {
        setName(profile.name);
        setAvatar(profile.avatar);
    }, [profile.name, profile.avatar]);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Valida tipo e tamanho
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Selecione um arquivo de imagem (JPG, PNG, etc).' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'A imagem deve ter menos de 5MB.' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            // Usa o user ID para garantir nome único e sobrescrita correta
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Sessão expirada. Faça login novamente.');

            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const filePath = `avatars/avatar-${user.id}.${fileExt}`;

            // Upload com upsert para sobrescrever foto anterior
            const { error: uploadError } = await supabase.storage
                .from('evidencias')
                .upload(filePath, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            // Gera URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('evidencias')
                .getPublicUrl(filePath);

            // Adiciona timestamp para forçar reload do cache do browser
            const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

            // Salva na tabela perfis imediatamente
            const { error: dbError } = await supabase
                .from('perfis')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (dbError) console.warn('Aviso ao salvar avatar no perfil:', dbError.message);

            // Salva nos metadados do Auth
            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

            // Atualiza estado local e avisa o App.tsx para atualizar Header/Sidebar imediatamente
            setAvatar(avatarUrlWithCache);
            await onUpdateProfile({ ...profile, name, avatar: avatarUrlWithCache });

            setMessage({ type: 'success', text: '✅ Foto atualizada com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            console.error('Erro no upload da foto:', err);
            setMessage({ type: 'error', text: 'Erro ao enviar foto: ' + (err.message || 'Verifique as permissões do bucket no Supabase.') });
        } finally {
            setIsUploading(false);
            // Limpa o input para permitir reenviar o mesmo arquivo
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await onUpdateProfile({ ...profile, name, avatar });
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil: ' + err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setIsSaving(true);
        try {
            await onUpdatePassword(newPassword);
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao alterar senha: ' + (err.message || 'Tente novamente.') });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-5">
                <div className="p-3 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
                    <span className="material-symbols-rounded !text-3xl fill-1">settings</span>
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configurações</h1>
                    <p className="text-slate-500 mt-1 font-medium">Gerencie suas informações pessoais e segurança da conta.</p>
                </div>
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
                        <div className="relative group cursor-pointer" onClick={() => !isUploading && fileInputRef.current?.click()}>
                            <img
                                src={avatar}
                                alt="Profile"
                                className="w-28 h-28 rounded-full object-cover border-4 border-slate-50 shadow-md transition-all group-hover:opacity-70 group-hover:scale-105"
                            />
                            <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-full text-white transition-opacity ${isUploading ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100 bg-black/30'}`}>
                                <span className={`material-symbols-rounded !text-2xl ${isUploading ? 'animate-spin' : ''}`}>
                                    {isUploading ? 'progress_activity' : 'photo_camera'}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider mt-1">
                                    {isUploading ? 'Enviando...' : 'Trocar foto'}
                                </span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                                disabled={isUploading}
                            />
                        </div>
                        <div className="text-center">
                            <button
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="text-xs font-bold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? 'Enviando foto...' : 'Alterar Foto de Perfil'}
                            </button>
                            <p className="text-[10px] text-slate-400 mt-1">JPG, PNG ou WebP • máx. 5MB</p>
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
                            <label className="text-sm font-bold text-slate-700">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                                placeholder="Mínimo 6 caracteres"
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

                {/* Aparência & Tema */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-indigo-500/10 p-3 rounded-2xl">
                            <span className="material-symbols-rounded text-indigo-500 !text-2xl fill-1">palette</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Aparência & Tema Visual</h2>
                            <p className="text-xs text-slate-500 font-medium">Personalize a cor principal do aplicativo com o estilo premium MC Industrial.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Modo Claro Card */}
                        <div
                            onClick={() => theme === 'dark' && onToggleTheme && onToggleTheme()}
                            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                                theme === 'light'
                                    ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-rounded text-blue-600 text-2xl">light_mode</span>
                                    <span className="font-extrabold text-slate-900 text-base">Modo Claro (Padrão)</span>
                                </div>
                                {theme === 'light' && (
                                    <span className="material-symbols-rounded text-blue-600 fill-icon text-xl">check_circle</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Visual claro, dinâmico e sofisticado. Excelente visibilidade em escritórios e ambientes iluminados.</p>
                        </div>

                        {/* Modo Escuro Card */}
                        <div
                            onClick={() => theme === 'light' && onToggleTheme && onToggleTheme()}
                            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                                theme === 'dark'
                                    ? 'border-blue-500 bg-slate-900 text-white shadow-md ring-2 ring-blue-500/20'
                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-rounded text-amber-400 text-2xl">dark_mode</span>
                                    <span className="font-extrabold text-slate-900 text-base">Modo Escuro</span>
                                </div>
                                {theme === 'dark' && (
                                    <span className="material-symbols-rounded text-blue-400 fill-icon text-xl">check_circle</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Estilo dark glassmorphism de alta fidelidade. Reduz o cansaço visual em uso prolongado.</p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="text-center pt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                © 2026 MC Industrial Systems Inc.
            </footer>
        </div>
    );
};
