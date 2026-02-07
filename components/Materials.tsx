import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Material {
    id?: string;
    codigo: string;
    descricao: string;
    categoria: string;
    fornecedor_padrao: string;
    criticidade: 'alta' | 'media' | 'baixa';
    status: 'ativo' | 'inativo';
    created_at?: string;
}

interface Fornecedor {
    id?: string;
    nome: string;
    cnpj?: string;
    contato?: string;
    email?: string;
    status: 'ativo' | 'inativo';
}

interface MotivoRejeicao {
    id?: string;
    descricao: string;
    categoria?: string;
    status: 'ativo' | 'inativo';
}

type TabType = 'materiais' | 'fornecedores' | 'motivos';

export const Materials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('materiais');
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Categories for materials
    const categorias = ['Roletes', 'Correias', 'Rolos de Carga', 'Rolamentos', 'Componentes Mecânicos', 'Outros'];

    // Default data (used as initial values and fallback)
    const defaultFornecedores: Fornecedor[] = [
        { id: '1', nome: 'SUPERIOR INDUSTRIES DO BRASIL LTDA.', status: 'ativo' },
        { id: '2', nome: 'SOMMA INDUSTRIA E COMERCIO DE EQUIPAMENTOS LTDA.', status: 'ativo' },
        { id: '3', nome: 'PROK BRASIL INDUSTRIA DE COMPONENTES LTDA.', status: 'ativo' },
        { id: '4', nome: 'IMEPEL - INDUSTRIA MECANICA LTDA.', status: 'ativo' },
        { id: '5', nome: 'Artur Küpper GmbH & Co. KG.', status: 'ativo' },
        { id: '6', nome: 'RULMECA ROLLERS S.R.L.', status: 'ativo' },
        { id: '7', nome: 'MARTIN SPROCKET & GEAR INC.', status: 'ativo' },
        { id: '8', nome: 'SKF DO BRASIL LTDA.', status: 'ativo' },
        { id: '9', nome: 'NSK BRASIL LTDA.', status: 'ativo' },
        { id: '10', nome: 'TIMKEN DO BRASIL LTDA.', status: 'ativo' },
    ];

    const defaultMotivos: MotivoRejeicao[] = [
        { id: '1', descricao: 'Nenhum / Conforme', status: 'ativo' },
        { id: '2', descricao: 'Excentricidade acima de 0,6', status: 'ativo' },
        { id: '3', descricao: 'Defeito de Superfície / Pintura', status: 'ativo' },
        { id: '4', descricao: 'Dimensional fora de especificação', status: 'ativo' },
        { id: '5', descricao: 'Solda com defeito', status: 'ativo' },
        { id: '6', descricao: 'Material oxidado/corroído', status: 'ativo' },
        { id: '7', descricao: 'Embalagem danificada', status: 'ativo' },
        { id: '8', descricao: 'Documentação incompleta', status: 'ativo' },
        { id: '9', descricao: 'Quantidade divergente', status: 'ativo' },
        { id: '10', descricao: 'Componente faltante', status: 'ativo' },
    ];

    // Materials state
    const [materials, setMaterials] = useState<Material[]>([]);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    // Fornecedores state - inicia com valores padrão
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>(defaultFornecedores);
    const [showFornecedorModal, setShowFornecedorModal] = useState(false);
    const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

    // Motivos state - inicia com valores padrão
    const [motivos, setMotivos] = useState<MotivoRejeicao[]>(defaultMotivos);
    const [showMotivoModal, setShowMotivoModal] = useState(false);
    const [editingMotivo, setEditingMotivo] = useState<MotivoRejeicao | null>(null);

    // ============ FETCH DATA FROM SUPABASE ============
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // Fetch Fornecedores
            try {
                const { data: fornData, error: fornError } = await supabase
                    .from('fornecedores')
                    .select('*')
                    .order('nome');

                if (fornError) throw fornError;
                setFornecedores(fornData || []);
            } catch (err) {
                console.log('Tabela fornecedores não existe, usando dados locais');
                setFornecedores(defaultFornecedores);
            }

            // Fetch Motivos
            try {
                const { data: motData, error: motError } = await supabase
                    .from('motivos_rejeicao')
                    .select('*')
                    .order('descricao');

                if (motError) throw motError;
                setMotivos(motData || []);
            } catch (err) {
                console.log('Tabela motivos_rejeicao não existe, usando dados locais');
                setMotivos(defaultMotivos);
            }

            setIsLoading(false);
        };

        fetchData();
    }, []);

    // Filter logic
    const filteredMaterials = materials.filter(m =>
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFornecedores = fornecedores.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMotivos = motivos.filter(m =>
        m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Show message helper
    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // ============ MATERIALS CRUD ============
    const handleSaveMaterial = (material: Material) => {
        if (editingMaterial?.id) {
            setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? { ...material, id: editingMaterial.id } : m));
            showMessage('success', 'Material atualizado com sucesso!');
        } else {
            setMaterials(prev => [...prev, { ...material, id: Date.now().toString() }]);
            showMessage('success', 'Material cadastrado com sucesso!');
        }
        setShowMaterialModal(false);
        setEditingMaterial(null);
    };

    const handleDeleteMaterial = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este material?')) {
            setMaterials(prev => prev.filter(m => m.id !== id));
            showMessage('success', 'Material excluído com sucesso!');
        }
    };

    // ============ FORNECEDORES CRUD (with Supabase) ============
    const handleSaveFornecedor = async (fornecedor: Fornecedor) => {
        try {
            if (editingFornecedor?.id) {
                // Try Supabase update
                const { error } = await supabase
                    .from('fornecedores')
                    .update({ nome: fornecedor.nome, cnpj: fornecedor.cnpj, contato: fornecedor.contato, email: fornecedor.email, status: fornecedor.status })
                    .eq('id', editingFornecedor.id);

                if (error) throw error;
                setFornecedores(prev => prev.map(f => f.id === editingFornecedor.id ? { ...fornecedor, id: editingFornecedor.id } : f));
                showMessage('success', 'Fornecedor atualizado com sucesso!');
            } else {
                // Try Supabase insert
                const { data, error } = await supabase
                    .from('fornecedores')
                    .insert([{ nome: fornecedor.nome, cnpj: fornecedor.cnpj, contato: fornecedor.contato, email: fornecedor.email, status: fornecedor.status }])
                    .select()
                    .single();

                if (error) throw error;
                setFornecedores(prev => [...prev, data]);
                showMessage('success', 'Fornecedor cadastrado com sucesso!');
            }
        } catch (err) {
            // Fallback to local state
            console.log('Supabase não disponível, salvando localmente');
            if (editingFornecedor?.id) {
                setFornecedores(prev => prev.map(f => f.id === editingFornecedor.id ? { ...fornecedor, id: editingFornecedor.id } : f));
            } else {
                setFornecedores(prev => [...prev, { ...fornecedor, id: Date.now().toString() }]);
            }
            showMessage('success', editingFornecedor ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
        }
        setShowFornecedorModal(false);
        setEditingFornecedor(null);
    };

    const handleDeleteFornecedor = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

        try {
            const { error } = await supabase.from('fornecedores').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.log('Supabase não disponível, removendo localmente');
        }
        setFornecedores(prev => prev.filter(f => f.id !== id));
        showMessage('success', 'Fornecedor excluído com sucesso!');
    };

    // ============ MOTIVOS CRUD (with Supabase) ============
    const handleSaveMotivo = async (motivo: MotivoRejeicao) => {
        try {
            if (editingMotivo?.id) {
                const { error } = await supabase
                    .from('motivos_rejeicao')
                    .update({ descricao: motivo.descricao, categoria: motivo.categoria, status: motivo.status })
                    .eq('id', editingMotivo.id);

                if (error) throw error;
                setMotivos(prev => prev.map(m => m.id === editingMotivo.id ? { ...motivo, id: editingMotivo.id } : m));
                showMessage('success', 'Motivo atualizado com sucesso!');
            } else {
                const { data, error } = await supabase
                    .from('motivos_rejeicao')
                    .insert([{ descricao: motivo.descricao, categoria: motivo.categoria, status: motivo.status }])
                    .select()
                    .single();

                if (error) throw error;
                setMotivos(prev => [...prev, data]);
                showMessage('success', 'Motivo cadastrado com sucesso!');
            }
        } catch (err) {
            console.log('Supabase não disponível, salvando localmente');
            if (editingMotivo?.id) {
                setMotivos(prev => prev.map(m => m.id === editingMotivo.id ? { ...motivo, id: editingMotivo.id } : m));
            } else {
                setMotivos(prev => [...prev, { ...motivo, id: Date.now().toString() }]);
            }
            showMessage('success', editingMotivo ? 'Motivo atualizado!' : 'Motivo cadastrado!');
        }
        setShowMotivoModal(false);
        setEditingMotivo(null);
    };

    const handleDeleteMotivo = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este motivo?')) return;

        try {
            const { error } = await supabase.from('motivos_rejeicao').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.log('Supabase não disponível, removendo localmente');
        }
        setMotivos(prev => prev.filter(m => m.id !== id));
        showMessage('success', 'Motivo excluído com sucesso!');
    };

    const tabs = [
        { id: 'materiais', label: 'Materiais', icon: 'inventory_2', count: materials.length },
        { id: 'fornecedores', label: 'Fornecedores', icon: 'local_shipping', count: fornecedores.length },
        { id: 'motivos', label: 'Motivos de Rejeição', icon: 'report_problem', count: motivos.length },
    ];

    return (
        <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Cadastros</h1>
                    <p className="text-slate-500 mt-1 font-medium">Gerencie materiais, fornecedores e motivos de rejeição</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl font-bold text-sm animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as TabType); setSearchTerm(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <span className="material-symbols-rounded !text-xl">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search and Add */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={`Buscar ${activeTab}...`}
                            className="w-full pl-12 pr-4 h-12 rounded-xl border-slate-200 focus:ring-primary font-medium"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (activeTab === 'materiais') {
                                setEditingMaterial(null);
                                setShowMaterialModal(true);
                            } else if (activeTab === 'fornecedores') {
                                setEditingFornecedor(null);
                                setShowFornecedorModal(true);
                            } else {
                                setEditingMotivo(null);
                                setShowMotivoModal(true);
                            }
                        }}
                        className="h-12 px-6 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-rounded">add</span>
                        Adicionar
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* MATERIAIS TAB */}
                    {activeTab === 'materiais' && (
                        <div className="overflow-x-auto">
                            {filteredMaterials.length === 0 ? (
                                <div className="text-center py-16">
                                    <span className="material-symbols-rounded text-6xl text-slate-200 mb-4">inventory_2</span>
                                    <p className="text-slate-400 font-bold">Nenhum material cadastrado</p>
                                    <p className="text-slate-400 text-sm mt-1">Clique em "Adicionar" para começar</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="pb-4 px-4">Código</th>
                                            <th className="pb-4 px-4">Descrição</th>
                                            <th className="pb-4 px-4 hidden md:table-cell">Categoria</th>
                                            <th className="pb-4 px-4 hidden lg:table-cell">Fornecedor</th>
                                            <th className="pb-4 px-4">Status</th>
                                            <th className="pb-4 px-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredMaterials.map((material) => (
                                            <tr key={material.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-4 font-bold text-slate-900">{material.codigo}</td>
                                                <td className="py-4 px-4 text-slate-600">{material.descricao}</td>
                                                <td className="py-4 px-4 text-slate-500 hidden md:table-cell">{material.categoria}</td>
                                                <td className="py-4 px-4 text-slate-500 hidden lg:table-cell text-sm">{material.fornecedor_padrao}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${material.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {material.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => { setEditingMaterial(material); setShowMaterialModal(true); }}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-slate-500 !text-xl">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMaterial(material.id!)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <span className="material-symbols-rounded text-red-500 !text-xl">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* FORNECEDORES TAB */}
                    {activeTab === 'fornecedores' && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredFornecedores.length === 0 ? (
                                <div className="col-span-full text-center py-16">
                                    <span className="material-symbols-rounded text-6xl text-slate-200 mb-4">local_shipping</span>
                                    <p className="text-slate-400 font-bold">Nenhum fornecedor encontrado</p>
                                </div>
                            ) : (
                                filteredFornecedores.map((fornecedor) => (
                                    <div key={fornecedor.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-xl">
                                                    <span className="material-symbols-rounded text-primary !text-2xl">domain</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-sm">{fornecedor.nome}</h3>
                                                    {fornecedor.cnpj && <p className="text-xs text-slate-400 mt-1">CNPJ: {fornecedor.cnpj}</p>}
                                                    {fornecedor.email && <p className="text-xs text-slate-400">{fornecedor.email}</p>}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${fornecedor.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {fornecedor.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <button
                                                onClick={() => { setEditingFornecedor(fornecedor); setShowFornecedorModal(true); }}
                                                className="flex-1 h-9 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-rounded !text-lg">edit</span> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFornecedor(fornecedor.id!)}
                                                className="h-9 px-3 bg-white border border-red-200 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <span className="material-symbols-rounded !text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* MOTIVOS TAB */}
                    {activeTab === 'motivos' && (
                        <div className="space-y-3">
                            {filteredMotivos.length === 0 ? (
                                <div className="text-center py-16">
                                    <span className="material-symbols-rounded text-6xl text-slate-200 mb-4">report_problem</span>
                                    <p className="text-slate-400 font-bold">Nenhum motivo encontrado</p>
                                </div>
                            ) : (
                                filteredMotivos.map((motivo) => (
                                    <div key={motivo.id} className="flex items-center justify-between bg-slate-50/50 rounded-xl p-4 border border-slate-100 hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-amber-100 p-2 rounded-xl">
                                                <span className="material-symbols-rounded text-amber-600 !text-xl">warning</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{motivo.descricao}</h3>
                                                {motivo.categoria && <p className="text-xs text-slate-400">{motivo.categoria}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${motivo.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {motivo.status}
                                            </span>
                                            <button
                                                onClick={() => { setEditingMotivo(motivo); setShowMotivoModal(true); }}
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-rounded text-slate-500 !text-xl">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMotivo(motivo.id!)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-rounded text-red-500 !text-xl">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ============ MATERIAL MODAL ============ */}
            {showMaterialModal && (
                <MaterialModal
                    material={editingMaterial}
                    categorias={categorias}
                    fornecedores={fornecedores.map(f => f.nome)}
                    onSave={handleSaveMaterial}
                    onClose={() => { setShowMaterialModal(false); setEditingMaterial(null); }}
                />
            )}

            {/* ============ FORNECEDOR MODAL ============ */}
            {showFornecedorModal && (
                <FornecedorModal
                    fornecedor={editingFornecedor}
                    onSave={handleSaveFornecedor}
                    onClose={() => { setShowFornecedorModal(false); setEditingFornecedor(null); }}
                />
            )}

            {/* ============ MOTIVO MODAL ============ */}
            {showMotivoModal && (
                <MotivoModal
                    motivo={editingMotivo}
                    onSave={handleSaveMotivo}
                    onClose={() => { setShowMotivoModal(false); setEditingMotivo(null); }}
                />
            )}
        </div>
    );
};

// ============ MATERIAL MODAL COMPONENT ============
const MaterialModal: React.FC<{
    material: Material | null;
    categorias: string[];
    fornecedores: string[];
    onSave: (material: Material) => void;
    onClose: () => void;
}> = ({ material, categorias, fornecedores, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Material>>(material || {
        codigo: '',
        descricao: '',
        categoria: categorias[0],
        fornecedor_padrao: '',
        criticidade: 'media',
        status: 'ativo'
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">{material ? 'Editar Material' : 'Novo Material'}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Código *</label>
                            <input
                                type="text"
                                value={formData.codigo || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                                placeholder="Ex: 123456"
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Categoria</label>
                            <select
                                value={formData.categoria || categorias[0]}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            >
                                {categorias.map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Descrição *</label>
                        <input
                            type="text"
                            value={formData.descricao || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Descrição do material"
                            className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Fornecedor Padrão</label>
                        <select
                            value={formData.fornecedor_padrao || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, fornecedor_padrao: e.target.value }))}
                            className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                        >
                            <option value="">Selecione um fornecedor</option>
                            {fornecedores.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Criticidade</label>
                            <select
                                value={formData.criticidade || 'media'}
                                onChange={(e) => setFormData(prev => ({ ...prev, criticidade: e.target.value as any }))}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            >
                                <option value="alta">Alta</option>
                                <option value="media">Média</option>
                                <option value="baixa">Baixa</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Status</label>
                            <select
                                value={formData.status || 'ativo'}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 h-12 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (formData.codigo && formData.descricao) {
                                onSave(formData as Material);
                            }
                        }}
                        className="flex-1 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============ FORNECEDOR MODAL COMPONENT ============
const FornecedorModal: React.FC<{
    fornecedor: Fornecedor | null;
    onSave: (fornecedor: Fornecedor) => void;
    onClose: () => void;
}> = ({ fornecedor, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Fornecedor>>(fornecedor || {
        nome: '',
        cnpj: '',
        contato: '',
        email: '',
        status: 'ativo'
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">{fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Nome da Empresa *</label>
                        <input
                            type="text"
                            value={formData.nome || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Nome completo do fornecedor"
                            className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">CNPJ</label>
                            <input
                                type="text"
                                value={formData.cnpj || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                                placeholder="00.000.000/0000-00"
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Contato</label>
                            <input
                                type="text"
                                value={formData.contato || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                                placeholder="(00) 00000-0000"
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">E-mail</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="email@empresa.com"
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Status</label>
                            <select
                                value={formData.status || 'ativo'}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 h-12 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (formData.nome) {
                                onSave(formData as Fornecedor);
                            }
                        }}
                        className="flex-1 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============ MOTIVO MODAL COMPONENT ============
const MotivoModal: React.FC<{
    motivo: MotivoRejeicao | null;
    onSave: (motivo: MotivoRejeicao) => void;
    onClose: () => void;
}> = ({ motivo, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<MotivoRejeicao>>(motivo || {
        descricao: '',
        categoria: '',
        status: 'ativo'
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">{motivo ? 'Editar Motivo' : 'Novo Motivo de Rejeição'}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">Descrição do Motivo *</label>
                        <input
                            type="text"
                            value={formData.descricao || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Ex: Dimensional fora de especificação"
                            className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Categoria (opcional)</label>
                            <input
                                type="text"
                                value={formData.categoria || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                                placeholder="Ex: Dimensional"
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">Status</label>
                            <select
                                value={formData.status || 'ativo'}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 h-12 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (formData.descricao) {
                                onSave(formData as MotivoRejeicao);
                            }
                        }}
                        className="flex-1 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};
