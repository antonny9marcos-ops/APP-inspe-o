
import React, { useState, useEffect } from 'react';
import { Inspection } from '../types';
import { supabase } from '../lib/supabase';
import { BarcodeScanner } from './BarcodeScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

interface InspectionFormProps {
  onSave: (inspection: Inspection) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onViewHistory: () => void;
  initialData?: Inspection;
  userProfile?: import('../types').UserProfile;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({ onSave, onDelete, onCancel, onViewHistory, initialData, userProfile }) => {
  const defaultSetor = (userProfile?.role === 'Inspetor' && userProfile?.setor) 
    ? userProfile.setor 
    : (initialData?.setor && initialData.setor !== 'TODOS' ? initialData.setor : '1058 Carajás');

  const defaultInspetor = initialData?.inspetor || (userProfile?.name || '');

  const [formData, setFormData] = useState<Partial<Inspection>>({
    data: initialData?.data || new Date().toISOString().split('T')[0],
    dataChegada: initialData?.dataChegada || new Date().toISOString().split('T')[0],
    inspetor: defaultInspetor,
    material: initialData?.material || '',
    descricao: initialData?.descricao || '',
    fornecedor: initialData?.fornecedor || '',
    qtdInspecionada: initialData?.qtdInspecionada || 0,
    qtdAprovada: initialData?.qtdAprovada || 0,
    qtdRejeitada: initialData?.qtdRejeitada || 0,
    motivoRejeicao: initialData?.motivoRejeicao || 'Nenhum / Conforme',
    numeroPedido: initialData?.numeroPedido || '',
    nf: initialData?.nf || '',
    observacoes: initialData?.observacoes || '',
    evidencias: initialData?.evidencias || [],
    unidade: initialData?.unidade || 'UN',
    setor: defaultSetor,
    realId: initialData?.realId,
    id: initialData?.id
  });

  useEffect(() => {
    if (initialData && initialData.id) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        setor: (userProfile?.role === 'Inspetor' && userProfile?.setor) 
          ? userProfile.setor 
          : (initialData.setor && initialData.setor !== 'TODOS' ? initialData.setor : (prev.setor || '1058 Carajás')),
        inspetor: (userProfile?.role === 'Inspetor' && !initialData.inspetor) 
          ? userProfile.name 
          : (initialData.inspetor || prev.inspetor || '')
      }));
    } else if (userProfile?.role === 'Inspetor') {
      setFormData(prev => ({
        ...prev,
        setor: userProfile.setor || prev.setor || '1058 Carajás',
        inspetor: userProfile.name || prev.inspetor || ''
      }));
    }
  }, [initialData, userProfile]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { isOpen: isScannerOpen, openScanner, scannerProps } = useBarcodeScanner();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Autocomplete states
  const [showFornecedorSuggestions, setShowFornecedorSuggestions] = useState(false);
  const [showMotivoSuggestions, setShowMotivoSuggestions] = useState(false);
  const fornecedorInputRef = React.useRef<HTMLInputElement>(null);
  const motivoInputRef = React.useRef<HTMLInputElement>(null);

  // Default fallbacks
  const defaultFornecedores = [
    'SUPERIOR INDUSTRIES DO BRASIL LTDA.',
    'SOMMA INDUSTRIA E COMERCIO DE EQUIPAMENTOS LTDA.',
    'PROK BRASIL INDUSTRIA DE COMPONENTES LTDA.',
    'IMEPEL - INDUSTRIA MECANICA LTDA.',
    'Artur Küpper GmbH & Co. KG.',
    'RULMECA ROLLERS S.R.L.',
    'MARTIN SPROCKET & GEAR INC.',
    'SKF DO BRASIL LTDA.',
    'NSK BRASIL LTDA.',
    'TIMKEN DO BRASIL LTDA.'
  ];

  const defaultMotivos = [
    'Nenhum / Conforme',
    'Excentricidade acima de 0,6',
    'Defeito de Superfície / Pintura',
    'Dimensional fora de especificação',
    'Solda com defeito',
    'Material oxidado/corroído',
    'Embalagem danificada',
    'Documentação incompleta',
    'Quantidade divergente',
    'Componente faltante'
  ];

  // Lista de fornecedores disponíveis (inicia com defaults)
  const [fornecedoresList, setFornecedoresList] = useState<string[]>(defaultFornecedores);

  // Lista de motivos de rejeição disponíveis (inicia com defaults)
  const [motivosRejeicaoList, setMotivosRejeicaoList] = useState<string[]>(defaultMotivos);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Fornecedores
      try {
        const { data, error } = await supabase
          .from('fornecedores')
          .select('nome')
          .eq('status', 'ativo')
          .order('nome');

        if (error) throw error;
        setFornecedoresList(data?.map(f => f.nome) || defaultFornecedores);
      } catch {
        setFornecedoresList(defaultFornecedores);
      }

      // Motivos
      try {
        const { data, error } = await supabase
          .from('motivos_rejeicao')
          .select('descricao')
          .eq('status', 'ativo')
          .order('descricao');

        if (error) throw error;
        setMotivosRejeicaoList(data?.map(m => m.descricao) || defaultMotivos);
      } catch {
        setMotivosRejeicaoList(defaultMotivos);
      }
    };

    fetchData();
  }, []);

  // Filtrar sugestões de fornecedor
  const filteredFornecedores = (fornecedoresList || []).filter(f =>
    typeof f === 'string' && f.toLowerCase().includes((formData.fornecedor || '').toLowerCase())
  );

  // Filtrar sugestões de motivo de rejeição
  const filteredMotivos = (motivosRejeicaoList || []).filter(m =>
    typeof m === 'string' && m.toLowerCase().includes((formData.motivoRejeicao || '').toLowerCase())
  );

  // Verificar se o valor digitado já existe na lista
  const fornecedorExistsInList = (fornecedoresList || []).some(f =>
    typeof f === 'string' && f.toLowerCase() === (formData.fornecedor || '').toLowerCase()
  );
  const motivoExistsInList = (motivosRejeicaoList || []).some(m =>
    typeof m === 'string' && m.toLowerCase() === (formData.motivoRejeicao || '').toLowerCase()
  );

  // Função para cadastrar novo fornecedor (with Supabase)
  const handleAddFornecedor = async () => {
    const novoFornecedor = (formData.fornecedor || '').trim();
    if (novoFornecedor && !fornecedorExistsInList) {
      // Add to local list
      setFornecedoresList(prev => [...prev, novoFornecedor]);
      setShowFornecedorSuggestions(false);

      // Try to save to Supabase
      try {
        await supabase.from('fornecedores').insert([{ nome: novoFornecedor, status: 'ativo' }]);
        setMessage({ type: 'success', text: `Fornecedor "${novoFornecedor}" cadastrado!` });
      } catch {
        setMessage({ type: 'success', text: `Fornecedor "${novoFornecedor}" adicionado localmente!` });
      }
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Função para cadastrar novo motivo de rejeição (with Supabase)
  const handleAddMotivo = async () => {
    const novoMotivo = (formData.motivoRejeicao || '').trim();
    if (novoMotivo && !motivoExistsInList) {
      // Add to local list
      setMotivosRejeicaoList(prev => [...prev, novoMotivo]);
      setShowMotivoSuggestions(false);

      // Try to save to Supabase
      try {
        await supabase.from('motivos_rejeicao').insert([{ descricao: novoMotivo, status: 'ativo' }]);
        setMessage({ type: 'success', text: `Motivo "${novoMotivo}" cadastrado!` });
      } catch {
        setMessage({ type: 'success', text: `Motivo "${novoMotivo}" adicionado localmente!` });
      }
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fornecedorInputRef.current && !fornecedorInputRef.current.parentElement?.contains(event.target as Node)) {
        setShowFornecedorSuggestions(false);
      }
      if (motivoInputRef.current && !motivoInputRef.current.parentElement?.contains(event.target as Node)) {
        setShowMotivoSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca a descrição do material no Supabase pelo código
  const fetchMaterialDescription = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setFormData(prev => ({ ...prev, descricao: '' }));
      return;
    }
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('descricao, categoria, unidade')
        .eq('codigo', code.trim())
        .single();

      if (data && !error) {
        setFormData(prev => ({
          ...prev,
          descricao: data.descricao,
          categoria: data.categoria,
          unidade: data.unidade || 'UN'
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar material:', err);
    }
  };

  const handleNumericChange = async (field: keyof Inspection, value: string) => {
    // Para o campo material, preserva o valor original (pode ser alfanumérico)
    // Para outros campos numéricos (nf, numeroPedido), mantém apenas dígitos
    const sanitizedValue = field === 'material' ? value : value.replace(/\D/g, '');

    // Atualiza o campo no estado
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));

    // Se for o campo material, busca a descrição automaticamente (PROCV)
    if (field === 'material') {
      if (sanitizedValue.length >= 2) {
        await fetchMaterialDescription(sanitizedValue);
      } else if (sanitizedValue.length === 0) {
        setFormData(prev => ({ ...prev, descricao: '' }));
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newEvidencias = [...(formData.evidencias || [])];

    for (const file of Array.from(files) as File[]) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('evidencias')
          .getPublicUrl(filePath);

        newEvidencias.push(publicUrl);
      } catch (err: any) {
        console.error('Erro no upload:', err);
        setMessage({ type: 'error', text: 'Erro ao enviar imagem: ' + err.message });
      }
    }

    setFormData(prev => ({ ...prev, evidencias: newEvidencias }));
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!formData.data || !formData.material || !formData.inspetor) {
      setMessage({ type: 'error', text: 'Por favor, preencha a Data, Inspetor e Código do Material.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const dbData = {
        data: formData.data,
        data_chegada: formData.dataChegada,
        inspetor: formData.inspetor,
        material_codigo: formData.material,
        material_descricao: formData.descricao,
        nf: formData.nf,
        numero_pedido: formData.numeroPedido,
        fornecedor: formData.fornecedor,
        qtd_inspecionada: formData.qtdInspecionada,
        qtd_aprovada: formData.qtdAprovada,
        qtd_rejeitada: formData.qtdRejeitada,
        motivo_rejeicao: formData.motivoRejeicao,
        observacoes: formData.observacoes,
        evidencias: formData.evidencias || [],
        categoria: formData.categoria || 'Outros',
        unidade: formData.unidade || 'UN',
        setor: formData.setor || '1058 Carajás'
      };

      let error;
      if (formData.realId) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('inspecoes')
          .update(dbData)
          .eq('id', formData.realId);
        error = updateError;
      } else {
        // INSERT
        const { error: insertError } = await supabase
          .from('inspecoes')
          .insert([dbData]);
        error = insertError;
      }

      if (error) throw error;

      setMessage({ type: 'success', text: formData.realId ? 'Inspeção atualizada com sucesso!' : 'Inspeção salva com sucesso!' });

      if (!formData.realId) {
        // Reset and notify parent for NEW entries
        setTimeout(() => {
          onSave(formData as Inspection);
        }, 1500);
      } else {
        // For updates
        setTimeout(() => {
          onSave(formData as Inspection);
        }, 1500);
      }

    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.realId) return;

    const confirmDelete = window.confirm('Tem certeza que deseja excluir esta inspeção permanentemente?Esta ação não pode ser desfeita.');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('inspecoes')
        .delete()
        .eq('id', formData.realId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Inspeção excluída com sucesso!' });

      setTimeout(() => {
        if (onDelete) onDelete();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      setMessage({ type: 'error', text: 'Erro ao excluir: ' + err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const cardStyle = {
    background: 'rgba(10, 12, 18, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
  };

  const fieldLabelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1";
  const inputClass = "w-full rounded-xl h-12 px-4 text-sm font-medium bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 24px rgba(59,130,246,0.15)' }}
          >
            <span className="material-symbols-rounded text-blue-400" style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>assignment</span>
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold">
              [ 02 // {formData.realId ? 'EDICAO_DE_REGISTRO' : 'CADASTRO_DE_INSPECAO'} ]
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {formData.realId ? 'Editar Inspeção' : 'Cadastrar Nova Inspeção'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {formData.realId ? `Editando registro #${formData.id}` : 'Insira os detalhes do material e resultados da inspeção abaixo.'}
            </p>
          </div>
        </div>
        <button
          onClick={onViewHistory}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          <span className="material-symbols-rounded !text-lg">history</span> Ver Histórico
        </button>
      </div>

      {message && (
        <div
          className="p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in fade-in slide-in-from-top-4 duration-300"
          style={{
            background: message.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
          }}
        >
          <span className="material-symbols-rounded">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Seção 1 */}
          <div className="p-5 sm:p-8 rounded-2xl" style={cardStyle}>
            <h2 className="flex items-center gap-3 text-base font-bold text-white mb-8 pb-4 border-b border-white/[0.06]">
              <span className="material-symbols-rounded text-blue-400 !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>info</span> Informações Gerais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className={fieldLabelClass}>Data da Inspeção</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={fieldLabelClass}>Data de Chegada do Material</label>
                <input
                  type="date"
                  value={formData.dataChegada}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataChegada: e.target.value }))}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex flex-col gap-2 relative group">
                <label className={fieldLabelClass}>Setor / Área</label>

                {userProfile?.role === 'Inspetor' ? (
                  <div className="rounded-xl h-12 flex items-center px-4 gap-3 cursor-not-allowed bg-white/[0.03] border border-white/[0.08]">
                    <span className="material-symbols-rounded text-slate-500 !text-xl">lock</span>
                    <span className="text-slate-300 font-bold text-sm tracking-tight">{formData.setor}</span>
                  </div>
                ) : (
                  <select
                    value={formData.setor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, setor: e.target.value }))}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="1058 Carajás">1058 Carajás</option>
                    <option value="4065 São Luis">4065 São Luis</option>
                    <option value="4050 S11D">4050 S11D</option>
                  </select>
                )}

                {userProfile?.role === 'Inspetor' && (
                  <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase italic flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                    Unidade fixa para seu perfil
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className={fieldLabelClass}>Inspetor</label>
                <input
                  type="text"
                  value={formData.inspetor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspetor: e.target.value }))}
                  placeholder="Nome do inspetor"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={fieldLabelClass}>Código do Material</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.material}
                    placeholder="Ex: 123456"
                    className={`flex-1 ${inputClass}`}
                    onChange={(e) => handleNumericChange('material', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => openScanner({
                      title: 'Código do Material',
                      onScan: async (code) => {
                        // Preenche o campo de código e busca a descrição automaticamente
                        setFormData(prev => ({ ...prev, material: code }));
                        await fetchMaterialDescription(code);
                      },
                    })}
                    title="Escanear QR Code ou Código de Barras"
                    className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-rounded !text-xl">qr_code_scanner</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={fieldLabelClass}>NF</label>
                <input
                  type="text"
                  value={formData.nf}
                  placeholder="Ex: 0001234"
                  className={inputClass}
                  onChange={(e) => handleNumericChange('nf', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={fieldLabelClass}>Número do Pedido</label>
                <input
                  type="text"
                  value={formData.numeroPedido}
                  placeholder="Ex: 4512000001"
                  className={inputClass}
                  onChange={(e) => handleNumericChange('numeroPedido', e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className={fieldLabelClass}>Descrição do Material</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Rolo de carga"
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2 relative">
                <label className={fieldLabelClass}>Fornecedor</label>
                <input
                  ref={fornecedorInputRef}
                  type="text"
                  value={formData.fornecedor || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fornecedor: e.target.value }));
                    setShowFornecedorSuggestions(true);
                  }}
                  onFocus={() => setShowFornecedorSuggestions(true)}
                  placeholder="Digite para buscar fornecedor..."
                  className={inputClass}
                />
                {showFornecedorSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ background: 'rgba(13, 17, 26, 0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {filteredFornecedores.map((fornecedor, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, fornecedor }));
                          setShowFornecedorSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-500/10 text-sm font-medium text-slate-300 hover:text-white border-b border-white/[0.06] last:border-b-0 transition-colors cursor-pointer"
                      >
                        {fornecedor}
                      </button>
                    ))}
                    {/* Opção para cadastrar novo fornecedor */}
                    {formData.fornecedor && formData.fornecedor.trim() !== '' && !fornecedorExistsInList && (
                      <button
                        type="button"
                        onClick={handleAddFornecedor}
                        className="w-full text-left px-4 py-3 bg-blue-500/5 hover:bg-blue-500/10 text-sm font-bold text-blue-400 border-t border-white/[0.08] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-rounded !text-lg">add_circle</span>
                        Cadastrar "{formData.fornecedor.trim()}"
                      </button>
                    )}
                    {filteredFornecedores.length === 0 && (!formData.fornecedor || formData.fornecedor.trim() === '') && (
                      <div className="px-4 py-3 text-sm text-slate-500 italic">
                        Digite para buscar ou cadastrar um fornecedor
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2 */}
          <div className="p-5 sm:p-8 rounded-2xl" style={cardStyle}>
            <h2 className="flex items-center gap-3 text-base font-bold text-white mb-8 pb-4 border-b border-white/[0.06]">
              <span className="material-symbols-rounded text-blue-400 !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span> Resultados da Inspeção
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                  Qtd Inspecionada <span className="text-slate-400">{formData.unidade || 'UN'}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.qtdInspecionada || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtdInspecionada: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl px-5 h-14 text-sm font-bold text-white bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1 flex justify-between">
                  Qtd Aprovada <span className="text-emerald-400">{formData.unidade || 'UN'}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.qtdAprovada || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtdAprovada: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl px-5 h-14 text-sm font-bold text-white transition-all outline-none focus:border-emerald-500"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 flex justify-between">
                  Qtd Rejeitada <span className="text-rose-400">{formData.unidade || 'UN'}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.qtdRejeitada || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtdRejeitada: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl px-5 h-14 text-sm font-bold text-white transition-all outline-none focus:border-rose-500"
                  style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 relative">
              <label className={fieldLabelClass}>Motivo da Rejeição</label>
              <input
                ref={motivoInputRef}
                type="text"
                value={formData.motivoRejeicao || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, motivoRejeicao: e.target.value }));
                  setShowMotivoSuggestions(true);
                }}
                onFocus={() => setShowMotivoSuggestions(true)}
                placeholder="Digite para buscar motivo..."
                className={inputClass}
              />
              {showMotivoSuggestions && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ background: 'rgba(13, 17, 26, 0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {filteredMotivos.map((motivo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, motivoRejeicao: motivo }));
                        setShowMotivoSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-500/10 text-sm font-medium text-slate-300 hover:text-white border-b border-white/[0.06] last:border-b-0 transition-colors cursor-pointer"
                    >
                      {motivo}
                    </button>
                  ))}
                  {/* Opção para cadastrar novo motivo */}
                  {formData.motivoRejeicao && formData.motivoRejeicao.trim() !== '' && !motivoExistsInList && (
                    <button
                      type="button"
                      onClick={handleAddMotivo}
                      className="w-full text-left px-4 py-3 bg-blue-500/5 hover:bg-blue-500/10 text-sm font-bold text-blue-400 border-t border-white/[0.08] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-rounded !text-lg">add_circle</span>
                      Cadastrar "{formData.motivoRejeicao.trim()}"
                    </button>
                  )}
                  {filteredMotivos.length === 0 && (!formData.motivoRejeicao || formData.motivoRejeicao.trim() === '') && (
                    <div className="px-4 py-3 text-sm text-slate-500 italic">
                      Digite para buscar ou cadastrar um motivo
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 sm:p-8 rounded-2xl" style={cardStyle}>
            <h2 className="flex items-center gap-3 text-base font-bold text-white mb-6 pb-4 border-b border-white/[0.06]">
              <span className="material-symbols-rounded text-blue-400 !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>camera_alt</span> Evidências
            </h2>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group h-56 border-2 border-dashed border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-500/30 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
            >
              <div className="p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <span className="material-symbols-rounded text-blue-400 !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{isUploading ? 'sync' : 'upload_file'}</span>
              </div>
              <p className="text-sm font-bold text-slate-200">{isUploading ? 'Enviando...' : 'Clique ou arraste fotos aqui'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">PNG ou JPG até 10MB</p>
            </div>

            {formData.evidencias && formData.evidencias.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {formData.evidencias.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08]">
                    <img src={url} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, evidencias: prev.evidencias?.filter((_, i) => i !== index) }));
                      }}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-red-400 p-1 rounded-full cursor-pointer"
                    >
                      <span className="material-symbols-rounded !text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8">
              <label className={`${fieldLabelClass} block mb-2`}>Observações</label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Adicione detalhes específicos aqui..."
                className={`${inputClass} h-32 py-4 resize-none`}
              ></textarea>
            </div>
          </div>

          <div className="p-5 sm:p-8 rounded-2xl" style={cardStyle}>
            <h3 className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-6">[ AÇÕES ]</h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full h-14 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)' }}
              >
                <span className="material-symbols-rounded" style={{ fontVariationSettings: "'FILL' 1" }}>{isSaving ? 'sync' : formData.realId ? 'edit' : 'save'}</span>
                {isSaving ? 'Salvando...' : formData.realId ? 'Salvar Alterações' : 'Salvar Registro'}
              </button>
              <div className="grid grid-cols-1 gap-3">
                {formData.realId && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || isSaving}
                    className="h-12 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-red-500/25 text-red-400 hover:bg-red-500/10"
                  >
                    <span className="material-symbols-rounded !text-lg">{isDeleting ? 'sync' : 'delete'}</span>
                    {isDeleting ? 'Excluindo...' : 'Excluir Registro'}
                  </button>
                )}
                <button onClick={onCancel} className="h-12 rounded-xl font-bold text-sm transition-colors cursor-pointer bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08]">Voltar para Dashboard</button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium text-center italic mt-2">Todos os campos obrigatórios devem ser preenchidos antes de salvar.</p>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-center py-10 border-t border-white/[0.06] text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        © 2026 MC Industrial Systems Inc.
      </footer>
      {isScannerOpen && scannerProps && (
        <BarcodeScanner {...scannerProps} />
      )}
    </div>
  );
};
