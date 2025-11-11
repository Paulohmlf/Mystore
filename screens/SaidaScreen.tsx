import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Keyboard,
  SafeAreaView,
  ScrollView // Usar ScrollView para o seletor de produtos
  ,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Importar o hook useIsFocused
import { useIsFocused } from '@react-navigation/native';

// Importar nossos tipos e funções de storage
import { Produto, Saida, getProdutos, getSaidas, salvarSaidas } from '../services/storage';

// Sua nova paleta de cores
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
  placeholder: '#A3BFAA',
  danger: '#D9534F'
};

// Interface para o produto com estoque calculado
interface ProdutoComEstoque extends Produto {
  estoqueDisponivel: number;
}

export default function SaidaScreen() {
  // Estado para os produtos com estoque calculado
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoComEstoque[]>([]);
  // Estado para todas as saídas registradas
  const [saidas, setSaidas] = useState<Saida[]>([]);
  
  // Estados para o formulário
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoComEstoque | null>(null);
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');

  const isFocused = useIsFocused();

  // --- NOVO: Carregar dados quando a tela focar ---
  useEffect(() => {
    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  /**
   * Carrega produtos e saídas, e calcula o estoque real.
   */
  const carregarDados = async () => {
    const produtosSalvos = await getProdutos();
    const saidasSalvas = await getSaidas();
    setSaidas(saidasSalvas);

    // Calcular estoque real (Item 4 do roteiro)
    const produtosComEstoque = produtosSalvos.map(produto => {
      // 1. Soma todas as saídas anteriores para este produto
      const totalVendido = saidasSalvas
        .filter(saida => saida.produtoId === produto.id)
        .reduce((soma, saida) => soma + saida.quantidade, 0);
      
      // 2. Calcula o estoque disponível
      const estoqueDisponivel = produto.quantidade - totalVendido;

      return {
        ...produto,
        estoqueDisponivel: estoqueDisponivel
      };
    })
    // 3. Filtra produtos que ainda têm estoque
    .filter(produto => produto.estoqueDisponivel > 0);

    setProdutosDisponiveis(produtosComEstoque);
    
    // Se o produto que estava selecionado foi vendido e acabou o estoque,
    // ele sumirá da lista, então limpamos a seleção.
    if (produtoSelecionado) {
        const produtoAindaDisponivel = produtosComEstoque.find(p => p.id === produtoSelecionado.id);
        if (!produtoAindaDisponivel) {
            setProdutoSelecionado(null);
        }
    }
  };

  // --- ATUALIZADO: Registrar Saída ---
  const handleRegistrarSaida = async () => {
    if (!produtoSelecionado || !quantidadeSaida.trim() || !precoVenda.trim()) {
      Alert.alert('Erro', 'Selecione um produto e preencha todos os campos.');
      return;
    }

    const qtdNum = parseInt(quantidadeSaida, 10);
    const precoVendaNum = parseFloat(precoVenda.replace(',', '.'));

    if (isNaN(qtdNum) || qtdNum <= 0 || isNaN(precoVendaNum) || precoVendaNum <= 0) {
      Alert.alert('Erro', 'Quantidade e Preço de Venda devem ser números positivos.');
      return;
    }

    // Validação de Estoque (Item 4 do roteiro)
    // Usa 'estoqueDisponivel' que já foi calculado
    if (qtdNum > produtoSelecionado.estoqueDisponivel) {
      Alert.alert(
        'Erro de Estoque',
        `Quantidade insuficiente. Disponível: ${produtoSelecionado.estoqueDisponivel}`
      );
      return;
    }

    const novaSaida: Saida = {
      id: String(new Date().getTime()),
      produtoId: produtoSelecionado.id,
      nomeProduto: produtoSelecionado.nome,
      quantidade: qtdNum,
      precoVenda: precoVendaNum,
    };

    const novaListaSaidas = [novaSaida, ...saidas];
    setSaidas(novaListaSaidas);

    // --- NOVO: Salva a lista de saídas no AsyncStorage ---
    await salvarSaidas(novaListaSaidas);

    Alert.alert('Sucesso', 'Saída registrada!');
    
    // Limpa campos
    setProdutoSelecionado(null);
    setQuantidadeSaida('');
    setPrecoVenda('');
    Keyboard.dismiss();

    // --- NOVO: Recarrega os dados para atualizar o estoque na tela ---
    await carregarDados();
  };

  // Como renderizar a lista de saídas registradas
  const renderItemSaida = ({ item }: { item: Saida }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemNome}>{item.nomeProduto}</Text>
      <Text style={styles.itemDetalhes}>
        Qtd: {item.quantidade} | Preço Venda: R$ {item.precoVenda.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Formulário de Saída */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Selecione o Produto (Estoque &gt; 0):</Text>
        {/* Usamos ScrollView caso a lista de produtos seja grande */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorScroll}>
          <View style={styles.seletorProdutoContainer}>
            {produtosDisponiveis.length > 0 ? (
              produtosDisponiveis.map(produto => (
                <TouchableOpacity
                  key={produto.id}
                  style={[
                    styles.chipProduto,
                    produtoSelecionado?.id === produto.id && styles.chipProdutoSelecionado
                  ]}
                  onPress={() => setProdutoSelecionado(produto)}
                >
                  <Text style={[
                    styles.chipProdutoTexto,
                    produtoSelecionado?.id === produto.id && styles.chipProdutoTextoSelecionado
                  ]}>
                    {produto.nome} (Est: {produto.estoqueDisponivel})
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.semEstoqueAviso}>Nenhum produto com estoque disponível.</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Qtd. Vendida"
            value={quantidadeSaida}
            onChangeText={setQuantidadeSaida}
            keyboardType="number-pad"
            placeholderTextColor={cores.placeholder}
            editable={!!produtoSelecionado} // Só edita se houver produto
          />
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Preço de Venda (R$)"
            value={precoVenda}
            onChangeText={setPrecoVenda}
            keyboardType="numeric"
            placeholderTextColor={cores.placeholder}
            editable={!!produtoSelecionado} // Só edita se houver produto
          />
        </View>
        <Button
          title="Registrar Saída"
          onPress={handleRegistrarSaida}
          color={cores.verdeEscuro}
          disabled={!produtoSelecionado} // Desabilita se não houver produto
        />
      </View>

      {/* Lista de Saídas */}
      <FlatList
        data={saidas}
        renderItem={renderItemSaida}
        keyExtractor={item => item.id}
        style={styles.lista}
        ListHeaderComponent={<Text style={styles.listaTitulo}>Saídas Registradas</Text>}
      />
    </SafeAreaView>
  );
}

// Estilos (quase iguais aos anteriores)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.begeFundo,
  },
  formContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 8,
  },
  seletorScroll: {
      maxHeight: 50, // Limita altura da scrollview
      marginBottom: 12,
  },
  seletorProdutoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipProduto: {
    backgroundColor: cores.branco,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.verdeMedio,
    marginRight: 8,
    height: 34, // Altura fixa
  },
  chipProdutoSelecionado: {
    backgroundColor: cores.verdeMedio,
    borderColor: cores.verdeEscuro,
  },
  chipProdutoTexto: {
    color: cores.verdeMedio,
    fontSize: 14,
  },
  chipProdutoTextoSelecionado: {
    color: cores.branco,
    fontWeight: 'bold',
  },
  semEstoqueAviso: {
      color: cores.verdeMedio,
      fontStyle: 'italic',
      fontSize: 14,
      paddingLeft: 4,
  },
  input: {
    height: 44,
    backgroundColor: cores.branco,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    fontSize: 16,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputMetade: {
    width: '48%',
  },
  lista: {
    flex: 1,
    marginTop: 8,
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 16,
    marginBottom: 10,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: cores.branco,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
  },
  itemDetalhes: {
    fontSize: 14,
    color: cores.verdeMedio,
  },
});