// Arquivo: RelatorioScreen.tsx
import { useIsFocused } from '@react-navigation/native';
import {
  CaretDown,
  ChartLineUp,
  Database,
  DownloadSimple,
  Funnel,
  MagnifyingGlass, // --- MUDANÇA ---
} from 'phosphor-react-native';
import React, { useEffect, useState } from 'react'; // React.useMemo será usado
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput, // --- MUDANÇA ---
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { LineChart } from 'react-native-chart-kit';
import { Produto, Saida, getProdutos, getSaidas } from '../services/storage';

// Paleta de cores (sem mudanças)
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
  placeholder: '#A3BFAA',
};

// Constantes e Interfaces (sem mudanças)
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
const TODOS_OS_MESES = -1; 
interface ItemRelatorio {
  id: string; nome: string; precoCompra: number; totalEntrada: number;
  totalVendido: number; estoqueDisponivel: number; lucroTotal: number;
}
interface ChartData {
  labels: string[];
  datasets: [{ data: number[]; color: (opacity?: number) => string; strokeWidth: number; },
             { data: number[]; color: (opacity?: number) => string; strokeWidth: number; }];
  legend: string[];
}
interface ModalItem {
  label: string;
  value: any;
}

// Funções de cálculo (calcularLucro, prepararDadosGrafico, gerarHTMLRelatorio)
// (Exatamente como no código anterior, sem mudanças)
const calcularLucro = (saidas: Saida[], produtos: Produto[]): number => {
  const mapaProdutos = new Map(produtos.map(p => [p.id, p]));
  let lucroTotal = 0;
  for (const saida of saidas) {
    const produto = mapaProdutos.get(saida.produtoId);
    if (produto) {
      lucroTotal += (saida.precoVenda - produto.precoCompra) * saida.quantidade;
    }
  }
  return lucroTotal;
};
const prepararDadosGrafico = (saidas: Saida[], produtos: Produto[]): ChartData | null => {
  if (!saidas || saidas.length === 0 || !produtos || produtos.length === 0) {
    return null; 
  }
  const mapaProdutos = new Map<string, Produto>();
  produtos.forEach(p => mapaProdutos.set(p.id, p));
  const saidasValidas = saidas
    .filter(s => s.data && mapaProdutos.has(s.produtoId))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  if (saidasValidas.length === 0) {
    return null;
  }
  const labels: string[] = [];
  const dadosGasto: number[] = [];
  const dadosRecebido: number[] = [];
  let gastoAcumulado = 0;
  let recebidoAcumulado = 0;
  saidasValidas.forEach(saida => {
    const produto = mapaProdutos.get(saida.produtoId);
    if (!produto) return; 
    const gastoDaVenda = produto.precoCompra * saida.quantidade;
    const recebidoDaVenda = saida.precoVenda * saida.quantidade;
    gastoAcumulado += gastoDaVenda;
    recebidoAcumulado += recebidoDaVenda;
    labels.push(new Date(saida.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    dadosGasto.push(gastoAcumulado);
    dadosRecebido.push(recebidoAcumulado);
  });
  if (labels.length === 1) {
    labels.push(' ');
    dadosGasto.push(gastoAcumulado);
    dadosRecebido.push(recebidoAcumulado);
  }
  return {
    labels: labels,
    datasets: [
      { data: dadosGasto, color: (opacity = 1) => `rgba(217, 83, 79, ${opacity})`, strokeWidth: 2, },
      { data: dadosRecebido, color: (opacity = 1) => `rgba(92, 184, 92, ${opacity})`, strokeWidth: 2, },
    ],
    legend: ['Gasto (Acumulado)', 'Recebido (Acumulado)'],
  };
};
const gerarHTMLRelatorio = (dados: ItemRelatorio[], lucroPeriodo: number, filtroDesc: string): string => {
  // (Copiado, sem mudanças)
  const linhasTabela = dados.map(item => `
    <tr>
      <td>${item.nome}</td>
      <td>${item.totalEntrada} un.</td>
      <td>${item.totalVendido} un.</td>
      <td>${item.estoqueDisponivel} un.</td>
      <td>R$ ${item.lucroTotal.toFixed(2)}</td>
    </tr>
  `).join(''); 
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: ${cores.begeFundo}; color: ${cores.texto}; }
          h1, h2 { color: ${cores.verdeEscuro}; border-bottom: 2px solid ${cores.verdeClaro}; padding-bottom: 5px; }
          .filtro { color: ${cores.verdeMedio}; font-size: 16px; font-style: italic; margin-bottom: 15px; }
          .summary-card { background-color: ${cores.verdeMedio}; color: ${cores.branco}; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
          .summary-card h2 { color: ${cores.branco}; margin: 0 0 10px 0; border-bottom: none; }
          .summary-card p { font-size: 28px; font-weight: bold; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid ${cores.verdeClaro}; padding: 10px; text-align: left; }
          th { background-color: ${cores.verdeEscuro}; color: ${cores.branco}; }
          tr:nth-child(even) { background-color: ${cores.branco}; }
          tr:nth-child(odd) { background-color: #f7f5ef; }
        </style>
      </head>
      <body>
        <h1>Relatório de Estoque e Lucro</h1>
        <p class="filtro">Filtro aplicado: ${filtroDesc}</p>
        <div class="summary-card">
          <h2>Lucro Total (Período)</h2>
          <p>R$ ${lucroPeriodo.toFixed(2)}</p>
        </div>
        <h2>Relatório Detalhado de Estoque (Visão Atual)</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Entrada (Total)</th>
              <th>Saída (Total)</th>
              <th>Estoque (Atual)</th>
              <th>Lucro (Total)</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTabela}
          </tbody>
        </table>
      </body>
    </html>
  `;
};
// --- Fim das Funções de Cálculo ---


export default function RelatorioScreen() {
  // Dados brutos (sem mudanças)
  const [allProdutos, setAllProdutos] = useState<Produto[]>([]);
  const [allSaidas, setAllSaidas] = useState<Saida[]>([]);
  
  // Dados processados (sem mudanças)
  const [dadosRelatorio, setDadosRelatorio] = useState<ItemRelatorio[]>([]);
  const [lucroPeriodo, setLucroPeriodo] = useState(0);
  const [dadosGrafico, setDadosGrafico] = useState<ChartData | null>(null);
  
  // Estados de UI e Filtro (sem mudanças)
  const [isLoading, setIsLoading] = useState(true);
  const [isExportando, setIsExportando] = useState(false);
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([]);
  const [filtroAno, setFiltroAno] = useState<string | null>(null);
  const [filtroMes, setFiltroMes] = useState<number>(TODOS_OS_MESES);
  
  // Estados do Modal (sem mudanças)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'ano' | 'mes' | null>(null);
  const [modalData, setModalData] = useState<ModalItem[]>([]);

  // --- MUDANÇA: Estado para a Busca ---
  const [searchTerm, setSearchTerm] = useState('');
  // --- Fim da Mudança ---
  
  const isFocused = useIsFocused();
  const screenWidth = Dimensions.get('window').width;

  // Efeitos e Funções (carregarDadosBrutos, processarRelatorio, getDescricaoFiltro, handleExportarPDF, openPicker, onSelectItem)
  // (Exatamente como no código anterior, sem mudanças)
  useEffect(() => {
    if (isFocused) {
      carregarDadosBrutos();
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isLoading) {
      processarRelatorio();
    }
  }, [allProdutos, allSaidas, filtroAno, filtroMes, isLoading]);

  const carregarDadosBrutos = async () => {
    setIsLoading(true);
    const produtos = await getProdutos();
    const saidas = await getSaidas();
    setAllProdutos(produtos);
    setAllSaidas(saidas);
    const years = [...new Set(saidas.map(s => new Date(s.data).getFullYear().toString()))]
                    .sort((a, b) => b.localeCompare(a));
    setAnosDisponiveis(years);
    setIsLoading(false); 
  };

  const processarRelatorio = () => {
    const saidasFiltradas = allSaidas.filter(s => {
      const dataVenda = new Date(s.data);
      const anoMatch = !filtroAno || dataVenda.getFullYear().toString() === filtroAno;
      const mesMatch = (filtroMes === TODOS_OS_MESES) || dataVenda.getMonth() === filtroMes;
      return anoMatch && mesMatch;
    });

    const lucroFiltrado = calcularLucro(saidasFiltradas, allProdutos);
    setLucroPeriodo(lucroFiltrado);
    
    const dadosParaGrafico = prepararDadosGrafico(saidasFiltradas, allProdutos);
    setDadosGrafico(dadosParaGrafico);

    const relatorio = allProdutos.map(produto => {
      const saidasDoProduto = allSaidas.filter(s => s.produtoId === produto.id);
      const totalVendido = saidasDoProduto.reduce((soma, saida) => soma + saida.quantidade, 0);
      const lucroTotalProduto = calcularLucro(saidasDoProduto, [produto]);
      const estoqueDisponivel = produto.quantidade - totalVendido;
      return {
        id: produto.id, nome: produto.nome, precoCompra: produto.precoCompra,
        totalEntrada: produto.quantidade, totalVendido: totalVendido,
        estoqueDisponivel: estoqueDisponivel, lucroTotal: lucroTotalProduto,
      };
    });
    setDadosRelatorio(relatorio);
  };
  
  const getDescricaoFiltro = () => {
    const ano = filtroAno || "Todos";
    const mes = filtroMes === TODOS_OS_MESES ? "Todos" : meses[filtroMes];
    return `Ano: ${ano} | Mês: ${mes}`;
  };

  const handleExportarPDF = async () => {
    if (isExportando) return; 
    setIsExportando(true);
    try {
      const htmlContent = gerarHTMLRelatorio(dadosRelatorio, lucroPeriodo, getDescricaoFiltro());
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exportar Relatório em PDF',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao exportar o PDF.');
    } finally {
      setIsExportando(false); 
    }
  };

  const openPicker = (mode: 'ano' | 'mes') => {
    setPickerMode(mode);
    if (mode === 'ano') {
      const anosFormatados = anosDisponiveis.map(ano => ({ label: ano, value: ano }));
      setModalData([{ label: "Todos os Anos", value: null }, ...anosFormatados]);
    } else {
      const mesesFormatados = meses.map((mes, index) => ({ label: mes, value: index }));
      setModalData([{ label: "Todos os Meses", value: TODOS_OS_MESES }, ...mesesFormatados]);
    }
    setIsModalVisible(true);
  };

  const onSelectItem = (item: ModalItem) => {
    if (pickerMode === 'ano') {
      setFiltroAno(item.value);
      if (item.value === null) {
          setFiltroMes(TODOS_OS_MESES);
      }
    } else if (pickerMode === 'mes') {
      setFiltroMes(item.value);
    }
    setIsModalVisible(false);
    setPickerMode(null);
  };

  // renderItem (Sem mudanças)
  const renderItem = ({ item }: { item: ItemRelatorio }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemNome}>{item.nome}</Text>
      <View style={styles.detalheRow}>
        <Text style={styles.detalheLabel}>Entrada (Total):</Text>
        <Text style={styles.detalheValor}>{item.totalEntrada} un.</Text>
      </View>
      <View style={styles.detalheRow}>
        <Text style={styles.detalheLabel}>Saída (Total):</Text>
        <Text style={styles.detalheValor}>{item.totalVendido} un.</Text>
      </View>
      <View style={styles.detalheRow}>
        <Text style={styles.detalheLabel}>Estoque Atual:</Text>
        <Text style={[styles.detalheValor, styles.estoqueValor]}>{item.estoqueDisponivel} un.</Text>
      </View>
      <View style={[styles.detalheRow, styles.lucroContainer]}>
        <Text style={styles.lucroLabel}>Lucro (Total):</Text>
        <Text style={styles.lucroValor}>R$ {item.lucroTotal.toFixed(2)}</Text>
      </View>
    </View>
  );

  // renderChart (Sem mudanças)
  const renderChart = () => {
    if (!dadosGrafico && !isLoading) {
        return (
            <View style={styles.emptyContainer}>
                <ChartLineUp size={32} color={cores.verdeClaro} />
                <Text style={styles.emptyText}>Sem dados de vendas para o período selecionado.</Text>
            </View>
        );
    }
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.listaTitulo}>Evolução de Gasto vs. Recebido (Período)</Text>
        {dadosGrafico && (
            <LineChart
            data={dadosGrafico}
            width={screenWidth - 32} 
            height={250}
            yAxisLabel="R$ "
            yAxisSuffix=""
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 12, paddingTop: 16 }}
            />
        )}
      </View>
    );
  };

  // --- MUDANÇA: Lógica de filtragem da lista ---
  const filteredDadosRelatorio = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return dadosRelatorio; // Retorna todos se a busca estiver vazia
    }
    // Retorna apenas os itens cujo nome inclui o termo de busca (sem case sensitive)
    return dadosRelatorio.filter(item =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dadosRelatorio, searchTerm]); // Recalcula se 'dadosRelatorio' ou 'searchTerm' mudar
  // --- Fim da Mudança ---


  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={cores.verdeEscuro} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          // --- MUDANÇA: Usa os dados filtrados ---
          data={filteredDadosRelatorio}
          // --- Fim da Mudança ---
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.lista}
          ListHeaderComponent={
            <>
              {/* Filtro de Data (sem mudanças) */}
              <View style={styles.filtroContainer}>
                <View style={styles.filtroHeader}>
                  <Funnel size={18} color={cores.verdeEscuro} weight="bold" />
                  <Text style={styles.filtroTitulo}>Filtrar Relatório</Text>
                </View>
                <View style={styles.pickersContainer}>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => openPicker('ano')}
                  >
                    <Text style={styles.pickerButtonText}>{filtroAno || 'Todos os Anos'}</Text>
                    <CaretDown size={16} color={cores.texto} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, !filtroAno && styles.pickerDesabilitado]}
                    onPress={() => openPicker('mes')}
                    disabled={!filtroAno}
                  >
                    <Text style={styles.pickerButtonText}>
                      {filtroMes === TODOS_OS_MESES ? 'Todos os Meses' : meses[filtroMes]}
                    </Text>
                    <CaretDown size={16} color={cores.texto} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card de Resumo (sem mudanças) */}
              <View style={styles.resumoGeralCard}>
                <View>
                  <Text style={styles.resumoGeralLabel}>Lucro Total (Período)</Text>
                  <Text style={styles.resumoGeralValor}>R$ {lucroPeriodo.toFixed(2)}</Text>
                </View>
                <ChartLineUp size={40} color={cores.branco} weight="bold" />
              </View>

              {/* Botão de Exportar (sem mudanças) */}
              <TouchableOpacity 
                style={styles.botaoExportar}
                onPress={handleExportarPDF}
                disabled={isExportando || isLoading}
              >
                <DownloadSimple size={20} color={cores.verdeEscuro} weight="bold" />
                <Text style={styles.botaoExportarTexto}>
                  {isExportando ? 'Exportando...' : 'Exportar Relatório (PDF)'}
                </Text>
              </TouchableOpacity>

              {/* Gráfico (sem mudanças) */}
              {renderChart()}

              {/* Títulos da Lista (sem mudanças) */}
              <Text style={styles.listaTitulo}>Relatório Detalhado de Estoque (Visão Atual)</Text>
              <Text style={styles.listaSubtitulo}>
                Esta lista mostra o status TOTAL do estoque (sempre atual) e não é afetada pelos filtros de data.
              </Text>

              {/* --- MUDANÇA: Barra de Busca --- */}
              <View style={styles.searchContainer}>
                <MagnifyingGlass size={20} color={cores.placeholder} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchBar}
                  placeholder="Buscar produto na lista..."
                  placeholderTextColor={cores.placeholder}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
              {/* --- Fim da Mudança --- */}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Database size={32} color={cores.verdeClaro} />
                {/* --- MUDANÇA: Mensagem de "lista vazia" dinâmica --- */}
                <Text style={styles.emptyText}>
                  {searchTerm 
                    ? 'Nenhum produto encontrado.' 
                    : 'Nenhum produto cadastrado.'}
                </Text>
                {/* --- Fim da Mudança --- */}
            </View>
          }
        />
      )}

      {/* Modal do Picker (sem mudanças) */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {pickerMode === 'ano' ? 'Selecione o Ano' : 'Selecione o Mês'}
                </Text>
                <FlatList
                  data={modalData}
                  keyExtractor={item => String(item.value)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.modalItem} onPress={() => onSelectItem(item)}>
                      <Text style={styles.modalItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.modalList}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

// Configuração do Gráfico (sem mudanças)
const chartConfig = {
  backgroundColor: cores.branco,
  backgroundGradientFrom: cores.branco,
  backgroundGradientTo: cores.branco,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(50, 94, 84, ${opacity})`, 
  labelColor: (opacity = 1) => `rgba(50, 94, 84, ${opacity})`,
  style: { borderRadius: 16, },
  propsForDots: { r: '4', strokeWidth: '2', stroke: cores.verdeMedio, },
};


// Estilos (ADIÇÃO da Barra de Busca)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.begeFundo,
  },
  filtroContainer: {
    backgroundColor: cores.branco,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filtroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
    paddingBottom: 8,
  },
  filtroTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 8,
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: cores.begeFundo,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
    margin: 4, 
    paddingHorizontal: 10,
  },
  pickerButtonText: {
    color: cores.texto,
    fontSize: 14,
  },
  pickerDesabilitado: {
      backgroundColor: '#ECEAE1',
      opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxHeight: '60%',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 16,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
    paddingBottom: 8,
  },
  modalList: {
      // (vazio)
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.begeFundo,
  },
  modalItemText: {
    color: cores.texto,
    fontSize: 16,
    textAlign: 'center',
  },
  resumoGeralCard: {
    backgroundColor: cores.verdeMedio, 
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  resumoGeralLabel: {
    fontSize: 16,
    color: cores.branco,
    opacity: 0.9,
  },
  resumoGeralValor: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.branco,
  },
  botaoExportar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.branco,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
    elevation: 2,
  },
  botaoExportarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.verdeEscuro,
    marginLeft: 10,
  },
  chartContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: cores.branco,
    borderRadius: 12,
    paddingBottom: 10,
    elevation: 2,
    alignItems: 'center', 
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 16,
    marginTop: 20, 
    marginBottom: 10,
  },
  listaSubtitulo: {
      fontSize: 13,
      color: cores.verdeMedio,
      fontStyle: 'italic',
      marginHorizontal: 16,
      marginBottom: 10,
      marginTop: -4,
  },
  // --- MUDANÇA: Estilos da Barra de Busca ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.branco,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 10, // Adiciona espaço antes da lista
    elevation: 1,
  },
  searchIcon: {
      marginRight: 8,
  },
  searchBar: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: cores.texto,
  },
  // --- FIM DA MUDANÇA ---
  lista: {
    flex: 1,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: cores.branco,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
    paddingBottom: 8,
  },
  detalheRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detalheLabel: {
    fontSize: 14,
    color: cores.verdeMedio,
  },
  detalheValor: {
    fontSize: 14,
    color: cores.texto,
    fontWeight: '500',
  },
  estoqueValor: {
      fontWeight: 'bold',
      color: cores.verdeEscuro
  },
  lucroContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: cores.begeFundo,
  },
  lucroLabel: {
      fontSize: 15,
      color: cores.texto,
      fontWeight: 'bold',
  },
  lucroValor: {
      fontSize: 16,
      fontWeight: 'bold',
      color: cores.verdeEscuro, 
  },
  emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40, 
      paddingHorizontal: 16,
      backgroundColor: cores.branco,
      marginHorizontal: 16,
      borderRadius: 12,
      marginTop: 20,
  },
  emptyText: {
      fontSize: 16,
      color: cores.verdeMedio,
      marginTop: 8,
      textAlign: 'center',
  }
});