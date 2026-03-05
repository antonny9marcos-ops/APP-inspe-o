
import React, { useState, useEffect } from 'react';
import { Inspection } from '../types';
import { supabase } from '../lib/supabase';

interface InspectionFormProps {
  onSave: (inspection: Inspection) => void;
  onDelete?: () => void;
  onCancel: () => void;
  onViewHistory: () => void;
  initialData?: Inspection;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({ onSave, onDelete, onCancel, onViewHistory, initialData }) => {
  const [formData, setFormData] = useState<Partial<Inspection>>(initialData || {
    data: new Date().toLocaleDateString('sv-SE'),
    dataChegada: new Date().toLocaleDateString('sv-SE'),
    inspetor: '',
    material: '',
    descricao: '',
    fornecedor: '',
    qtdInspecionada: 0,
    qtdAprovada: 0,
    qtdRejeitada: 0,
    motivoRejeicao: 'Nenhum / Conforme',
    numeroPedido: '',
    nf: '',
    observacoes: '',
    evidencias: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
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
  const filteredFornecedores = fornecedoresList.filter(f =>
    f.toLowerCase().includes((formData.fornecedor || '').toLowerCase())
  );

  // Filtrar sugestões de motivo de rejeição
  const filteredMotivos = motivosRejeicaoList.filter(m =>
    m.toLowerCase().includes((formData.motivoRejeicao || '').toLowerCase())
  );

  // Verificar se o valor digitado já existe na lista
  const fornecedorExistsInList = fornecedoresList.some(f =>
    f.toLowerCase() === (formData.fornecedor || '').toLowerCase()
  );
  const motivoExistsInList = motivosRejeicaoList.some(m =>
    m.toLowerCase() === (formData.motivoRejeicao || '').toLowerCase()
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

  const handleNumericChange = async (field: keyof Inspection, value: string) => {
    const numericValue = value.replace(/\D/g, '');

    // Update the specific numeric field
    setFormData(prev => ({ ...prev, [field]: numericValue }));

    // If it's the material code, try to find the description (PROCV)
    if (field === 'material') {
      if (numericValue.length >= 2) { // Start searching after 2 digits
        try {
          const { data, error } = await supabase
            .from('materiais')
            .select('descricao')
            .eq('codigo', numericValue)
            .single();

          if (data && !error) {
            setFormData(prev => ({ ...prev, descricao: data.descricao }));
          }
        } catch (err) {
          console.error('Erro ao buscar material:', err);
        }
      } else if (numericValue.length === 0) {
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
        evidencias: formData.evidencias || []
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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
            <span className="material-symbols-rounded !text-3xl fill-1">assignment</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {formData.realId ? 'Editar Inspeção' : 'Cadastrar Nova Inspeção'}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {formData.realId ? `Editando registro #${formData.id}` : 'Insira os detalhes do material e resultados da inspeção abaixo.'}
            </p>
          </div>
        </div>
        <button
          onClick={onViewHistory}
          className="flex items-center gap-2 px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
        >
          <span className="material-symbols-rounded !text-xl">history</span> Ver Histórico
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold text-sm animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Seção 1 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-8 pb-4 border-b border-slate-50">
              <span className="material-symbols-rounded text-primary !text-2xl fill-1">info</span> Informações Gerais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Data da Inspeção</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary focus:border-primary font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Data de Chegada do Material</label>
                <input
                  type="date"
                  value={formData.dataChegada}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataChegada: e.target.value }))}
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary focus:border-primary font-medium"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Inspetor</label>
                <input
                  type="text"
                  value={formData.inspetor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspetor: e.target.value }))}
                  placeholder="Nome do inspetor"
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Código do Material</label>
                <input
                  type="text"
                  value={formData.material}
                  placeholder="Ex: 123456"
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                  onChange={(e) => handleNumericChange('material', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">NF</label>
                <input
                  type="text"
                  value={formData.nf}
                  placeholder="Ex: 0001234"
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                  onChange={(e) => handleNumericChange('nf', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Número do Pedido</label>
                <input
                  type="text"
                  value={formData.numeroPedido}
                  placeholder="Ex: 4512000001"
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                  onChange={(e) => handleNumericChange('numeroPedido', e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Descrição do Material</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Rolo de carga"
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2 relative">
                <label className="text-sm font-bold text-slate-700">Fornecedor</label>
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
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
                />
                {showFornecedorSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredFornecedores.map((fornecedor, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, fornecedor }));
                          setShowFornecedorSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm font-medium text-slate-700 border-b border-slate-50 last:border-b-0 transition-colors"
                      >
                        {fornecedor}
                      </button>
                    ))}
                    {/* Opção para cadastrar novo fornecedor */}
                    {formData.fornecedor && formData.fornecedor.trim() !== '' && !fornecedorExistsInList && (
                      <button
                        type="button"
                        onClick={handleAddFornecedor}
                        className="w-full text-left px-4 py-3 bg-primary/5 hover:bg-primary/10 text-sm font-bold text-primary border-t border-slate-100 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-rounded !text-lg">add_circle</span>
                        Cadastrar "{formData.fornecedor.trim()}"
                      </button>
                    )}
                    {filteredFornecedores.length === 0 && (!formData.fornecedor || formData.fornecedor.trim() === '') && (
                      <div className="px-4 py-3 text-sm text-slate-400 italic">
                        Digite para buscar ou cadastrar um fornecedor
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-8 pb-4 border-b border-slate-50">
              <span className="material-symbols-rounded text-primary !text-2xl fill-1">fact_check</span> Resultados da Inspeção
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Qtd Inspecionada</label>
                <input
                  type="number"
                  value={formData.qtdInspecionada || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtdInspecionada: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="rounded-xl border-slate-200 h-12 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-success">Qtd Aprovada</label>
                <input
                  type="number"
                  value={formData.qtdAprovada || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtdAprovada: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="rounded-xl border-green-200 h-12 focus:ring-success"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-danger">Qtd Rejeitada</label>
                <input
                  type="number"
                  value={formData.qtdRejeitada || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, qtdRejeitada: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="rounded-xl border-red-200 h-12 focus:ring-danger"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-bold text-slate-700">Motivo da Rejeição</label>
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
                className="rounded-xl border-slate-200 h-12 focus:ring-primary font-medium"
              />
              {showMotivoSuggestions && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredMotivos.map((motivo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, motivoRejeicao: motivo }));
                        setShowMotivoSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm font-medium text-slate-700 border-b border-slate-50 last:border-b-0 transition-colors"
                    >
                      {motivo}
                    </button>
                  ))}
                  {/* Opção para cadastrar novo motivo */}
                  {formData.motivoRejeicao && formData.motivoRejeicao.trim() !== '' && !motivoExistsInList && (
                    <button
                      type="button"
                      onClick={handleAddMotivo}
                      className="w-full text-left px-4 py-3 bg-primary/5 hover:bg-primary/10 text-sm font-bold text-primary border-t border-slate-100 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-rounded !text-lg">add_circle</span>
                      Cadastrar "{formData.motivoRejeicao.trim()}"
                    </button>
                  )}
                  {filteredMotivos.length === 0 && (!formData.motivoRejeicao || formData.motivoRejeicao.trim() === '') && (
                    <div className="px-4 py-3 text-sm text-slate-400 italic">
                      Digite para buscar ou cadastrar um motivo
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-6">
              <span className="material-symbols-rounded text-primary !text-2xl fill-1">camera_alt</span> Evidências
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
              className={`border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group h-56 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
            >
              <div className="bg-primary/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded text-primary !text-3xl fill-1">{isUploading ? 'sync' : 'upload_file'}</span>
              </div>
              <p className="text-sm font-bold text-slate-700">{isUploading ? 'Enviando...' : 'Clique ou arraste fotos aqui'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">PNG ou JPG até 10MB</p>
            </div>

            {formData.evidencias && formData.evidencias.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {formData.evidencias.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                    <img src={url} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, evidencias: prev.evidencias?.filter((_, i) => i !== index) }));
                      }}
                      className="absolute top-1 right-1 bg-white/80 hover:bg-white text-danger p-1 rounded-full shadow-sm"
                    >
                      <span className="material-symbols-rounded !text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8">
              <label className="text-sm font-bold text-slate-700 block mb-2">Observações</label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Adicione detalhes específicos aqui..."
                className="w-full rounded-2xl border-slate-200 h-32 focus:ring-primary p-4 text-sm font-medium resize-none bg-slate-50/30"
              ></textarea>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Ações</h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full h-14 bg-success text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-success/20 hover:shadow-success/40 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-rounded fill-1">{isSaving ? 'sync' : formData.realId ? 'edit' : 'save'}</span>
                {isSaving ? 'Salvando...' : formData.realId ? 'Salvar Alterações' : 'Salvar Registro'}
              </button>
              <div className="grid grid-cols-1 gap-3">
                {formData.realId && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || isSaving}
                    className="h-12 border border-red-100 text-danger hover:bg-red-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-rounded !text-lg">{isDeleting ? 'sync' : 'delete'}</span>
                    {isDeleting ? 'Excluindo...' : 'Excluir Registro'}
                  </button>
                )}
                <button onClick={onCancel} className="h-12 border border-slate-100 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors">Voltar para Dashboard</button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium text-center italic mt-2">Todos os campos obrigatórios devem ser preenchidos antes de salvar.</p>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-center py-10 border-t border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        © 2026 MC Industrial Systems Inc.
      </footer>
    </div>
  );
};
