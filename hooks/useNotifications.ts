import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.lida).length || 0);
        } catch (err) {
            console.error('Erro ao buscar notificações:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Inscrição Realtime
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notificacoes',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        fetchNotifications();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupSubscription();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notificacoes')
                .update({ lida: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Erro ao marcar como lida:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notificacoes')
                .update({ lida: true })
                .eq('user_id', user.id)
                .eq('lida', false);

            if (error) throw error;
            setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Erro ao marcar todas como lidas:', err);
        }
    };

    const clearAll = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notificacoes')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Erro ao limpar notificações:', err);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll,
        refresh: fetchNotifications
    };
};
