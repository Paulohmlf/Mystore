import { useIsFocused } from '@react-navigation/native';
import { ChartLineUp, Database } from 'phosphor-react-native'; // Ícones para o relatório
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getProdutos, getSaidas } from '../services/storage';

// Sua paleta de cores
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
};

// Interface para os dados processados do relatório
interface ItemRelatorio {
  id: string;
  nome: string;
  precoCompra: number;
  totalEntrada: number;
  totalVendido: number;
  estoqueDisponivel: number;
  lucroTotal: number;
}

export default function RelatorioScreen() {
  const [dadosRelatorio, setDadosRelatorio] = useState<ItemRelatorio[]>([]);
  const [lucroGeral, setLucroGeral] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const isFocused = useIsFocused();

  // Recalcula o relatório sempre que a tela entra em foco
  useEffect(() => {
    if (isFocused) {
      gerarRelatorio();
    }
  }, [isFocused]);

  /**
   * Busca dados de entrada e saída e processa o relatório.
   */
  const gerarRelatorio = async () => {
    setIsLoading(true);
    
    const produtos = await getProdutos();
    const saidas = await getSaidas();

    let lucroAcumuladoGeral = 0;

    // Processa os dados
    const relatorio = produtos.map(produto => {
      // 1. Filtra saídas apenas para este produto
      const saidasDoProduto = saidas.filter(s => s.produtoId === produto.id);

      // 2. Calcula total vendido
      const totalVendido = saidasDoProduto.reduce((soma, saida) => soma + saida.quantidade, 0);

      // 3. Calcula o lucro (Item 6 do roteiro)
      // Lucro = soma( (preçoVenda - precoCompra) * quantidade vendida )
      const lucroTotalProduto = saidasDoProduto.reduce((somaLucro, saida) => {
        const lucroDaVenda = (saida.precoVenda - produto.precoCompra) * saida.quantidade;
        return somaLucro + lucroDaVenda;
      }, 0);

      // 4. Calcula estoque disponível
      const estoqueDisponivel = produto.quantidade - totalVendido;

      // Acumula o lucro geral
      lucroAcumuladoGeral += lucroTotalProduto;

      // Retorna o objeto formatado
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

  // Como renderizar cada item do relatório
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
    backgroundColor: cores.verdeMedio, // Cor média
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
      color: cores.verdeEscuro, // Lucro em destaque
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