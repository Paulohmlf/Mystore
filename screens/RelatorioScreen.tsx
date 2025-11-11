import { useIsFocused } from '@react-navigation/native';
// --- MUDANÇA 1: Importar ícones e bibliotecas novas ---
import { ChartLineUp, Database, DownloadSimple } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, // Importar TouchableOpacity
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Importar as bibliotecas que instalamos
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getProdutos, getSaidas } from '../services/storage';
// --- Fim da Mudança 1 ---

// Sua paleta de cores
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

// --- MUDANÇA 2: Função para gerar o HTML do PDF ---
// Esta função cria a string de HTML que será convertida em PDF
const gerarHTMLRelatorio = (dados: ItemRelatorio[], lucroGeral: number): string => {
  // Mapeia os dados do relatório para linhas de tabela (<tr>)
  const linhasTabela = dados.map(item => `
    <tr>
      <td>${item.nome}</td>
      <td>${item.totalEntrada} un.</td>
      <td>${item.totalVendido} un.</td>
      <td>${item.estoqueDisponivel} un.</td>
      <td>R$ ${item.lucroTotal.toFixed(2)}</td>
    </tr>
  `).join(''); // .join('') junta todas as linhas em uma string só

  // Retorna o HTML completo com estilos (CSS)
  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: ${cores.begeFundo};
            color: ${cores.texto};
          }
          h1, h2 {
            color: ${cores.verdeEscuro};
            border-bottom: 2px solid ${cores.verdeClaro};
            padding-bottom: 5px;
          }
          .summary-card {
            background-color: ${cores.verdeMedio};
            color: ${cores.branco};
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 20px;
          }
          .summary-card h2 {
            color: ${cores.branco};
            margin: 0 0 10px 0;
            border-bottom: none;
          }
          .summary-card p {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid ${cores.verdeClaro};
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: ${cores.verdeEscuro};
            color: ${cores.branco};
          }
          tr:nth-child(even) {
            background-color: ${cores.branco};
          }
          tr:nth-child(odd) {
            background-color: #f7f5ef; /* Bege um pouco mais claro */
          }
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
// --- Fim da Mudança 2 ---


export default function RelatorioScreen() {
  const [dadosRelatorio, setDadosRelatorio] = useState<ItemRelatorio[]>([]);
  const [lucroGeral, setLucroGeral] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- MUDANÇA 3: Estado de carregamento para o PDF ---
  const [isExportando, setIsExportando] = useState(false);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      gerarRelatorio();
    }
  }, [isFocused]);

  const gerarRelatorio = async () => {
    // (Lógica sem mudanças)
    setIsLoading(true);
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
    setIsLoading(false);
  };

  // --- MUDANÇA 4: Função para Exportar o PDF ---
  const handleExportarPDF = async () => {
    if (isExportando) return; // Previne cliques duplos
    setIsExportando(true);

    try {
      // 1. Gera o HTML
      const htmlContent = gerarHTMLRelatorio(dadosRelatorio, lucroGeral);
      
      // 2. Cria o arquivo PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // 3. Compartilha o arquivo
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
      setIsExportando(false); // Libera o botão
    }
  };
  // --- Fim da Mudança 4 ---


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

  return (
    <SafeAreaView style={styles.container}>
      {/* Card de Resumo Geral */}
      <View style={styles.resumoGeralCard}>
          <View>
            <Text style={styles.resumoGeralLabel}>Lucro Total Acumulado</Text>
            <Text style={styles.resumoGeralValor}>R$ {lucroGeral.toFixed(2)}</Text>
          </View>
          <ChartLineUp size={40} color={cores.branco} weight="bold" />
      </View>

      {/* --- MUDANÇA 5: Adicionar o Botão de Exportar --- */}
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
      {/* --- Fim da Mudança 5 --- */}

      <Text style={styles.listaTitulo}>Relatório Detalhado por Produto</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={cores.verdeEscuro} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={dadosRelatorio}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.lista}
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

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.begeFundo,
  },
  resumoGeralCard: {
    backgroundColor: cores.verdeMedio, 
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

  // --- MUDANÇA 6: Estilos para o botão de exportar ---
  botaoExportar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.branco,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botaoExportarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.verdeEscuro,
    marginLeft: 10,
  },
  // --- Fim da Mudança 6 ---

  listaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      fontSize: 16,
      color: cores.verdeMedio,
      marginTop: 8,
  }
});