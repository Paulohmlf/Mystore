import AsyncStorage from '@react-native-async-storage/async-storage';

// Definimos as "chaves" que usaremos para salvar no AsyncStorage
const CHAVE_PRODUTOS = '@MyStore:produtos';
const CHAVE_SAIDAS = '@MyStore:saidas';

// --- Tipos (para TypeScript) ---

// Tipo para Produto (o mesmo da EntradaScreen)
export interface Produto {
  id: string;
  nome: string;
  precoCompra: number;
  quantidade: number;
}

// Tipo para Saída (o mesmo da SaidaScreen)
export interface Saida {
  id: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoVenda: number;
}

// --- Funções para PRODUTOS (Tela de Entrada) ---

/**
 * Salva a lista completa de produtos no AsyncStorage.
 */
export const salvarProdutos = async (produtos: Produto[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(produtos);
    await AsyncStorage.setItem(CHAVE_PRODUTOS, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar produtos', e);
    // Tratar erro (ex: mostrar alerta ao usuário)
  }
};

/**
 * Carrega a lista de produtos do AsyncStorage.
 */
export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CHAVE_PRODUTOS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Erro ao carregar produtos', e);
    return []; // Retorna lista vazia em caso de erro
  }
};

// --- Funções para SAÍDAS (Tela de Saída) ---

/**
 * Salva a lista completa de saídas no AsyncStorage.
 */
export const salvarSaidas = async (saidas: Saida[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(saidas);
    await AsyncStorage.setItem(CHAVE_SAIDAS, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar saídas', e);
  }
};

/**
 * Carrega a lista de saídas do AsyncStorage.
 */
export const getSaidas = async (): Promise<Saida[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CHAVE_SAIDAS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Erro ao carregar saídas', e);
    return [];
  }
};