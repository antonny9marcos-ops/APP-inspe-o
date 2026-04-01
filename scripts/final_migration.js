import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import crypto from 'crypto';

const SERVICE_ROLE_KEY = process.argv[2];
const SUPABASE_URL = 'https://pemphrthhyhozfmpesmg.supabase.co';

if (!SERVICE_ROLE_KEY) {
    console.error('Uso: node scripts/final_migration.js <SERVICE_ROLE_KEY>');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const filePath = path.join(process.cwd(), 'dados_historicos.xlsx.xlsx');

function formatDate(val) {
    if (!val) return null;
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    // Tenta converter string se necessário, pode estar no formato "MM/DD/YYYY"
    if (typeof val === 'string') {
        // Simple regex check for MM/DD/YYYY
        if (val.includes('/')) {
            const parts = val.split('/');
            if (parts.length === 3) {
                 return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
        }
    }
    return val;
}

async function run() {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        console.log(`Lendo ${rawData.length} registros do Excel...`);

        const mapped = rawData.map(row => {
            const qtdRejeitada = Number(row['Rejeitado'] || 0);
            return {
                id: crypto.randomUUID(),
                data: formatDate(row['DT. Entrada']) || new Date().toISOString().split('T')[0],
                data_chegada: formatDate(row['DT. Chegada']) || null,
                material_codigo: String(row['Material'] || ''),
                material_descricao: row['Desc.Mate'] || '',
                fornecedor: String(row['Fornecedor'] || 'Desconhecido'),
                inspetor: 'Sistema',
                setor: '1058 Carajás',
                qtd_inspecionada: Number(row['Quantidade'] || Number(row['Aprovado'] || 0) + qtdRejeitada),
                qtd_aprovada: Number(row['Aprovado'] || 0),
                qtd_rejeitada: qtdRejeitada,
                motivo_rejeicao: row['Motivo Rejeição'] || 'Nenhum / Conforme',
                nf: String(row['Nota Fiscal'] || ''),
                numero_pedido: String(row['Pedido'] || ''),
                observacoes: row['Observações'] || '',
                categoria: 'ROLO TRANSPORTADOR',
                unidade: 'UN'
            };
        });

        console.log('Iniciando inserção no Supabase com UUIDs...');

        let sucessos = 0;
        let erros = 0;

        // Inserir em lotes de 50
        for (let i = 0; i < mapped.length; i += 50) {
            const batch = mapped.slice(i, i + 50);
            const { error } = await supabase.from('inspecoes').insert(batch);
            
            if (error) {
                console.error(`Erro no lote ${i/50 + 1}:`, error.message);
                erros++;
            } else {
                sucessos += batch.length;
            }
        }

        console.log(`--- IMPORTAÇÃO FINALIZADA ---`);
        console.log(`Sucessos: ${sucessos}`);
        console.log(`Erros nos lotes: ${erros}`);

    } catch (err) {
        console.error('Erro crítico na migração:', err.message);
    }
}

run();
