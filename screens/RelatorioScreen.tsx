// Arquivo: RelatorioScreen.tsx
import { useIsFocused } from '@react-navigation/native';
import { ChartLineUp, Database, DownloadSimple } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions, // --- MUDANÇA: Importar Dimensions ---
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// --- MUDANÇA: Importar LineChart ---
import { LineChart } from 'react-native-chart-kit';
// --- Fim da Mudança ---

import { Produto, Saida, getProdutos, getSaidas } from '../services/storage'; // --- MUDANÇA: Importar tipos ---

// Paleta de cores (sem mudanças)
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
};

// Interface (sem mudanças)
interface ItemRelatorio {
  id: string;
  nome: string;
  precoCompra: number;
  totalEntrada: number;
  totalVendido: number;
  estoqueDisponivel: number;
  lucroTotal: number;
}

// --- MUDANÇA: Tipo para os dados do gráfico ---
interface ChartData {
  labels: string[];
  datasets: [
    {
      data: number[];
      color: (opacity?: number) => string; // Cor "Gasto"
      strokeWidth: number;
    },
    {
      data: number[];
      color: (opacity?: number) => string; // Cor "Recebido"
      strokeWidth: number;
    }
  ];
  legend: string[]; // "Gasto" e "Recebido"
}
// --- Fim da Mudança ---

// Função gerarHTMLRelatorio (sem mudanças)
const gerarHTMLRelatorio = (dados: ItemRelatorio[], lucroGeral: number): string => {
  // ... (código igual ao que você enviou)
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: ${cores.begeFundo}; color: ${cores.texto}; }
          h1, h2 { color: ${cores.verdeEscuro}; border-bottom: 2px solid ${cores.verdeClaro}; padding-bottom: 5px; }
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
        <div class="summary-card">
          <h2>Lucro Total Acumulado</h2>
          <p>R$ ${lucroGeral.toFixed(2)}</p>
        </div>
        <h2>Relatório Detalhado por Produto</h2>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Estoque</th>
              <th>Lucro</th>
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
// --- Fim da Função ---


// --- MUDANÇA: Função para preparar os dados do gráfico ---
const prepararDadosGrafico = (saidas: Saida[], produtos: Produto[]): ChartData | null => {
  if (!saidas || saidas.length === 0 || !produtos || produtos.length === 0) {
    return null; // Sem dados para o gráfico
  }

  // 1. Criar um mapa de produtos para acesso rápido ao precoCompra
  const mapaProdutos = new Map<string, Produto>();
  produtos.forEach(p => mapaProdutos.set(p.id, p));

  // 2. Ordenar saídas por data
  //    (Filtra saídas que não tenham data ou produto correspondente)
  const saidasValidas = saidas
    .filter(s => s.data && mapaProdutos.has(s.produtoId))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  if (saidasValidas.length === 0) {
    return null;
  }

  // 3. Processar saídas para acumular Gasto (Custo) e Recebido (Venda)
  const labels: string[] = [];
  const dadosGasto: number[] = [];
  const dadosRecebido: number[] = [];

  let gastoAcumulado = 0;
  let recebidoAcumulado = 0;

  saidasValidas.forEach(saida => {
    const produto = mapaProdutos.get(saida.produtoId);
    if (!produto) return; // Segurança

    // Custo da mercadoria vendida
    const gastoDaVenda = produto.precoCompra * saida.quantidade;
    // Valor recebido pela venda
    const recebidoDaVenda = saida.precoVenda * saida.quantidade;

    gastoAcumulado += gastoDaVenda;
    recebidoAcumulado += recebidoDaVenda;

    // Adiciona dados ao gráfico
    labels.push(new Date(saida.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    dadosGasto.push(gastoAcumulado);
    dadosRecebido.push(recebidoAcumulado);
  });
  
  // Se tivermos apenas 1 ponto, duplicamos para o gráfico poder desenhar uma linha
  if (labels.length === 1) {
    labels.push(' '); // Adiciona um label vazio
    dadosGasto.push(gastoAcumulado);
    dadosRecebido.push(recebidoAcumulado);
  }

  return {
    labels: labels,
    datasets: [
      {
        data: dadosGasto,
        color: (opacity = 1) => `rgba(217, 83, 79, ${opacity})`, // Vermelho (Gasto)
        strokeWidth: 2,
      },
      {
        data: dadosRecebido,
        color: (opacity = 1) => `rgba(92, 184, 92, ${opacity})`, // Verde (Recebido)
        strokeWidth: 2,
      },
    ],
    legend: ['Gasto (Acumulado)', 'Recebido (Acumulado)'],
  };
};
// --- Fim da Função ---


export default function RelatorioScreen() {
  const [dadosRelatorio, setDadosRelatorio] = useState<ItemRelatorio[]>([]);
  const [lucroGeral, setLucroGeral] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportando, setIsExportando] = useState(false);
  
  // --- MUDANÇA: Estado para o gráfico ---
  const [dadosGrafico, setDadosGrafico] = useState<ChartData | null>(null);

  const isFocused = useIsFocused();
  const screenWidth = Dimensions.get('window').width; // Pega a largura da tela

  useEffect(() => {
    if (isFocused) {
      gerarRelatorio();
    }
  }, [isFocused]);

  const gerarRelatorio = async () => {
    setIsLoading(true);
    setDadosGrafico(null); // Limpa o gráfico antigo

    const produtos = await getProdutos();
    const saidas = await getSaidas();
    let lucroAcumuladoGeral = 0;

    const relatorio = produtos.map(produto => {
      const saidasDoProduto = saidas.filter(s => s.produtoId === produto.id);
      const totalVendido = saidasDoProduto.reduce((soma, saida) => soma + saida.quantidade, 0);
      const lucroTotalProduto = saidasDoProduto.reduce((somaLucro, saida) => {
        const lucroDaVenda = (saida.precoVenda - produto.precoCompra) * saida.quantidade;
        return somaLucro + lucroDaVenda;
      }, 0);
      const estoqueDisponivel = produto.quantidade - totalVendido;
      lucroAcumuladoGeral += lucroTotalProduto;
      return {
        id: produto.id,
        nome: produto.nome,
        precoCompra: produto.precoCompra,
        totalEntrada: produto.quantidade,
        totalVendido: totalVendido,
        estoqueDisponivel: estoqueDisponivel,
        lucroTotal: lucroTotalProduto,
      };
    });

    setDadosRelatorio(relatorio);
    setLucroGeral(lucroAcumuladoGeral);

    // --- MUDANÇA: Chamar a função para preparar o gráfico ---
    const dadosParaGrafico = prepararDadosGrafico(saidas, produtos);
    setDadosGrafico(dadosParaGrafico);
    // --- Fim da Mudança ---

    setIsLoading(false);
  };

  // Função handleExportarPDF (sem mudanças)
  const handleExportarPDF = async () => {
    if (isExportando) return; 
    setIsExportando(true);

    try {
      const htmlContent = gerarHTMLRelatorio(dadosRelatorio, lucroGeral);
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
  // --- Fim da Função ---


  // renderItem (Sem mudanças)
  const renderItem = ({ item }: { item: ItemRelatorio }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemNome}>{item.nome}</Text>
      
      <View style={styles.detalheRow}>
        <Text style={styles.detalheLabel}>Entrada:</Text>
        <Text style={styles.detalheValor}>{item.totalEntrada} un.</Text>
      </View>
      <View style={styles.detalheRow}>
        <Text style={styles.detalheLabel}>Saída (Vendido):</Text>
        <Text style={styles.detalheValor}>{item.totalVendido} un.</Text>
      </View>
      <View style={styles.detalheRow}>
        <Text style={styles.detalheLabel}>Estoque Atual:</Text>
        <Text style={[styles.detalheValor, styles.estoqueValor]}>{item.estoqueDisponivel} un.</Text>
      </View>
      
      <View style={[styles.detalheRow, styles.lucroContainer]}>
        <Text style={styles.lucroLabel}>Lucro do Produto:</Text>
        <Text style={styles.lucroValor}>
          R$ {item.lucroTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  // --- MUDANÇA: Componente para renderizar o Gráfico ---
  // --- MUDANÇA: Componente para renderizar o Gráfico ---
  const renderChart = () => {
    if (isLoading) {
        return <ActivityIndicator size="large" color={cores.verdeEscuro} style={{ marginVertical: 40 }} />;
    }
    
    if (!dadosGrafico) {
        return (
            <View style={styles.emptyContainer}>
                <ChartLineUp size={32} color={cores.verdeClaro} />
                <Text style={styles.emptyText}>Sem dados de vendas para exibir o gráfico.</Text>
                <Text style={styles.emptyText}>Registre algumas saídas para começar.</Text>
            </View>
        );
    }
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.listaTitulo}>Evolução de Gasto vs. Recebido</Text>
        <LineChart
          data={dadosGrafico}
          width={screenWidth - 32} // Largura da tela menos as margens
          height={250}
          yAxisLabel="R$ "
          yAxisSuffix=""
          chartConfig={chartConfig}
          bezier // Deixa a linha curvada
          style={{
            borderRadius: 12,
            paddingTop: 16,
          }}
          // A propriedade 'legend' foi removida daqui,
          // pois ela já está incluída dentro do 'dadosGrafico'
        />
      </View>
    );
  };
  // --- Fim da Mudança ---


  // O return da tela principal agora usa FlatList
  // para podermos rolar a tela e ver o gráfico e a lista
  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={cores.verdeEscuro} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={dadosRelatorio}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.lista}
          ListHeaderComponent={
            <>
              {/* Card de Resumo Geral */}
              <View style={styles.resumoGeralCard}>
                <View>
                  <Text style={styles.resumoGeralLabel}>Lucro Total Acumulado</Text>
                  <Text style={styles.resumoGeralValor}>R$ {lucroGeral.toFixed(2)}</Text>
                </View>
                <ChartLineUp size={40} color={cores.branco} weight="bold" />
              </View>

              {/* Botão de Exportar */}
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

              {/* --- MUDANÇA: Renderiza o gráfico aqui --- */}
              {renderChart()}

              <Text style={styles.listaTitulo}>Relatório Detalhado por Produto</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Database size={32} color={cores.verdeClaro} />
                <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// --- MUDANÇA: Configuração de cores do Gráfico ---
const chartConfig = {
  backgroundColor: cores.branco,
  backgroundGradientFrom: cores.branco,
  backgroundGradientTo: cores.branco,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(50, 94, 84, ${opacity})`, // Cor principal (labels)
  labelColor: (opacity = 1) => `rgba(50, 94, 84, ${opacity})`, // Cor dos labels
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4', // Tamanho dos pontos
    strokeWidth: '2',
    stroke: cores.verdeMedio, // Borda dos pontos
  },
};
// --- Fim da Mudança ---


// Estilos (Com adições)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.begeFundo,
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

  // --- MUDANÇA: Estilos do Gráfico ---
  chartContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: cores.branco,
    borderRadius: 12,
    paddingBottom: 10,
    elevation: 2,
    alignItems: 'center', // Centraliza o gráfico
  },
  // --- Fim da Mudança ---

  listaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 16,
    marginTop: 20, // Ajustado
    marginBottom: 10,
  },
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
      paddingVertical: 40, // Aumentado
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