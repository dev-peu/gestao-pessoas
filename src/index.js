import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as XLSX from 'xlsx';

function App() {
  const servers = [
    'LCPLAY', 'BRABO TV', 'VIP OFFICE', 'MMTV', 'CLIENTE TV', 'E3PLAY', 'UniPlay', 'PlayON', 'TURBO PLAY', 'GENIAL PLAY', 'APPLAY TV'
  ];  
  const apps = [
    'KTN Player', 'IBO Player iboplayer.com', 'Ibo Player Pro iboproapp.com', 'Quick Player', 'SS-IPTV', 'ClouDDy', 'QSMART-IPTV', 'Duplecast', 'QUICKPLAYER', 'Vu Player Pro', 'BOBPLAYER', 'IPTVPLAYER.IO', 'LAZERPLAY.IO', 'IBO PRO LCPLAY', 'IBO PLAYER PRO ADÁLIO', 'MAXPLAYER'
  ];

  const [data, setData] = useState([]); // Estado para armazenar os dados da planilha
  const [item, setItem] = useState({});
  const [importing, setImporting] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Estado para exibir o modal de exclusão
  const [itemToDelete, setItemToDelete] = useState(null); // Estado para armazenar o item que será excluído

  const newItem = {
    nome: '',
    celular: '',
    app: '',
    login: '',
    senha: '',
    mac: '',
    senhaMac: '',
    servidor: '',
    dataCadastro: '',
    ultimoPagamento: '',
    valor: 0,
    anotacoes: '',
    totalRecebido: 0,
  };

  // Função para carregar os dados do LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem('users');
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  // Função para salvar os dados no LocalStorage sempre que o estado `data` mudar
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('users', JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    if (item.id) {
      // Seleciona os inputs dentro do modal
      const modalInputs = document.querySelectorAll('.modal input');
  
      // Adiciona o evento de clique para cada input
      modalInputs.forEach((input) => {
        const handleClick = (e) => {
          if (e.target.value) {
            navigator.clipboard.writeText(e.target.value)
              .then(() => {
                console.log('Texto copiado: ' + e.target.value);
              })
              .catch((err) => {
                alert('Erro ao copiar texto: ', err);
              });
          }
        };
  
        input.addEventListener('click', handleClick);
  
        // Limpeza do evento ao desmontar
        return () => {
          input.removeEventListener('click', handleClick);
        };
      });
    }
  }, [item.id]); // Roda esse efeito apenas quando o modal for aberto
  
  useEffect(() => {
    applyFilters();
  }, [data, activeFilter]);
  

  // Função para ler o arquivo Excel e sobrescrever os dados
  const handleFileUpload = (event) => {
    setImporting(true);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('A planilha está vazia ou no formato incorreto!');
        return;
      }

      setData(jsonData); // Sobrescreve os dados existentes
      alert('importado com sucesso')
    };

    reader.readAsBinaryString(file);
    setImporting(false);
  };

  const handleSave = () => {
    const diasParaVencer = calcularDiasParaVencer(item.ultimoPagamento);
  
    // Verificar se o item já existe (com base no ID)
    const existingItemIndex = data.findIndex((d) => d.id === item.id);
  
    if (existingItemIndex === -1) {
      // Se o item não existir, adicionar um novo
      if (!item.nome) {
        return alert('Salve um nome nesse usuário');
      }
      setData([...data, { ...item, diasParaVencer }]); // Adiciona novo item
    } else {
      // Se o item já existir, atualizar o existente
      const updatedItem = { ...item, diasParaVencer };
      const updatedData = data.map((d) => (d.id === updatedItem.id ? updatedItem : d));
      setData(updatedData); // Atualiza o item existente
    }
  
    setItem({}); // Limpar o item após salvar
  };

  const calcularDiasParaVencer = (ultimoPagamento) => {
    if (!ultimoPagamento) return null;
    const dataUltimoPagamento = new Date(ultimoPagamento);
    const diasParaVencimento = 30;
    const dataVencimento = new Date(dataUltimoPagamento);
    dataVencimento.setDate(dataVencimento.getDate() + diasParaVencimento);

    const hoje = new Date();
    const diffTime = dataVencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    const hoje = new Date();
    XLSX.writeFile(workbook, `Gestao_iptv_${hoje.toLocaleDateString('brazil')}.xlsx`);
  };

  const applyFilters = () => {
    let filtered = [];

    if (activeFilter === 'todos') {
      filtered = data;
    } else if (activeFilter === 'emDia') {
      filtered = data.filter((item) => calcularDiasParaVencer(item.ultimoPagamento) >= 0);
    } else if (activeFilter === 'vencidos') {
      filtered = data.filter((item) => calcularDiasParaVencer(item.ultimoPagamento) < 0);
    }

    // Ordenar por "diasParaVencer" (ordem crescente)
    filtered.sort((a, b) => {
      return (a.diasParaVencer || 0) - (b.diasParaVencer || 0); // Garantir que valores nulos ou indefinidos não causem erro
    });

    setFilteredData(filtered);
  };
  
  const handleDelete = () => {
    if (itemToDelete) {
      // Remove o itemToDelete da lista de dados
      setData(data.filter((d) => d.id !== itemToDelete.id));
      setShowDeleteModal(false); // Fecha o modal após excluir
      setItemToDelete(null); // Limpa o item a ser excluído
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false); // Fecha o modal sem excluir
    setItemToDelete(null); // Limpa o item a ser excluído
  };

  return (
    <div className="App">
      <header className="App-header">
        {data.length <= 0 && (
          importing ? (
            <>
              Importando a planilha...
              <progress value={null} />
            </>
          ) : (
            <div className="importar">
              <h1>Escolha a planilha</h1>
              <br />
              <label className="import__btn__label">
                Escolher...
                <input className="import__btn" type="file" accept=".xls,.xlsx" onChange={handleFileUpload} />
              </label>
            </div>
          )
        )}

        {data.length > 0 && (
          <>
            <div className="container">
              {filteredData.map((item) => (
                <div className="item" key={item.id} onClick={() => setItem(item)}>
                  <div className='id'>
                    {item.id}
                  </div>
                  <div>
                    <p>{item.nome}</p>
                    {
                      item.diasParaVencer !== undefined && item.diasParaVencer > 0 ? (
                        <p>Vence em <strong>{item.diasParaVencer !== undefined && item.diasParaVencer }</strong> dias</p>
                      ) :
                        item.diasParaVencer < 0 ? (
                          <p>Vencido há <strong>{String(item.diasParaVencer).replace('-', '')}</strong> dia(s)</p>
                        ) : (
                          <p>Vence Hoje</p>
                        )
                    }
                  </div>
                  <span 
                      className="excluir" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete(item);
                        setShowDeleteModal(true);
                      }}
                    >
                      Excluir
                    </span>
                </div>
              ))}
            </div>

            <div className="adicionar" onClick={() => setItem({ ...newItem, id: data.length + 1 })}>
              <i style={{ color: 'green', fontSize: '50px' }} className="fa-solid fa-square-plus"></i>
            </div>

            <div className="baixar" onClick={handleExport}>
              <span>
                <i className="fa-solid fa-circle-down"></i> Baixar
              </span>
            </div>
            <label className="import__btn__label reImport">
              Importar
              <input className="import__btn" type="file" accept=".xls,.xlsx" onChange={handleFileUpload} />
            </label>

            <div className='open__filtros' onClick={() => setShowFiltros(true)}>
              <h2>Filtros</h2>
            </div>
          </>
        )}

        {item.id && (
          <div className="container__modal" onClick={() => setItem({})}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <label>
                Nome/Usuario:
                <input 
                  type="text" 
                  value={item.nome} 
                  onChange={(e) => setItem({ ...item, nome: e.target.value })} 
                />
              </label>

              <div className="inputs">
                <label>
                  Celular:
                  <input 
                    type="number" 
                    value={item.celular} 
                    onChange={(e) => setItem({ ...item, celular: e.target.value })} 
                  />
                  <a className='ligar' href={`tel:${item.celular}`}>Ligar</a>
                </label>

                <label>
                Servidor:
                <select
                  value={servers.indexOf(item.servidor)} // Obtemos o índice do servidor atual no array
                  onChange={(e) => setItem({ ...item, servidor: servers[e.target.value] })} // Atualizamos o item com o servidor correspondente ao índice selecionado
                >
                  <option value="">Selecione</option>
                  {servers.map((server, index) => (
                    <option key={index} value={index}>
                      {server}
                    </option>
                  ))}
                </select>
              </label>
              </div>
              
              <label>
                Aplicativo:
                <select
                  value={apps.indexOf(item.app)} // Obtemos o índice do app atual no array
                  onChange={(e) => setItem({ ...item, app: apps[e.target.value] })} // Atualizamos o item com o app correspondente ao índice selecionado
                >
                  <option value="">Selecione</option>
                  {apps.map((app, index) => (
                    <option key={index} value={index}>
                      {app}
                    </option>
                  ))}
                </select>
              </label>

              <div className='inputs'>
                <label>
                  Login:
                  <input 
                    type="text" 
                    value={item.login} 
                    onChange={(e) => setItem({ ...item, login: e.target.value })} 
                  />
                </label>

                <label>
                  Senha:
                  <input 
                    type="text" 
                    value={item.senha} 
                    onChange={(e) => setItem({ ...item, senha: e.target.value })} 
                  />
                </label>
              </div>

              <div className='inputs'>
                <label>
                  MAC:
                  <input 
                    type="text" 
                    value={item.mac} 
                    onChange={(e) => setItem({ ...item, mac: e.target.value })} 
                  />
                </label>

                <label>
                  Senha MAC:
                  <input 
                    type="text" 
                    value={item.senhaMac} 
                    onChange={(e) => setItem({ ...item, senhaMac: e.target.value })} 
                  />
                </label>
              </div>

              <div className="inputs">
                <label>
                  Cadastro:
                  <input
                    type="datetime-local"
                    value={item.dataCadastro} // Certifique-se de adicionar a propriedade no seu objeto `item`
                    onChange={(e) => setItem({ ...item, dataCadastro: e.target.value })}
                  />
                </label>
              </div>

              <div className="inputs">
                <label>
                  Último Pagamento:
                  <input
                    type="datetime-local"
                    value={item.ultimoPagamento} // Certifique-se de adicionar a propriedade no seu objeto `item`
                    onChange={(e) => setItem({ ...item, ultimoPagamento: e.target.value })}
                  />
                </label>

                <label>
                  Valor:
                  <input
                    type="number"
                    value={item.valor} // Certifique-se de adicionar a propriedade no seu objeto `item`
                    onChange={(e) => setItem({ ...item, valor: e.target.value })}
                  />
                </label>
              </div>

              <div className="resultado" style={{backgroundColor: calcularDiasParaVencer(item.ultimoPagamento) < 0 ? 'red' : 'green'}}>
                {item.ultimoPagamento && (
                  <span> 
                    {calcularDiasParaVencer(item.ultimoPagamento) < 0 ? `(Vencido há ${String(calcularDiasParaVencer(item.ultimoPagamento)).replace('-', '')} dias)` : `Dias até o vencimento: ${calcularDiasParaVencer(item.ultimoPagamento)}`}
                  </span>
                )}
              </div>
              
              <label>
                  Anotações:
                  <textarea style={{padding: '5px', overflowY: 'scroll'}}
                    value={item.anotacoes} // Certifique-se de adicionar a propriedade no seu objeto `item`
                    onChange={(e) => setItem({ ...item, anotacoes: e.target.value })}
                    rows={3}
                  />
                </label>

              <button className='salvar' onClick={() => handleSave()}>Salvar</button>
            </div>
          </div>
        )}

        { showDeleteModal && itemToDelete && (
          <div className="container__modal" onClick={cancelDelete}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Confirmar Exclusão</h2>
              <p>Você tem certeza que deseja excluir o item: <strong>{itemToDelete.nome}</strong>?</p>
              <div>
                <button onClick={handleDelete}>Confirmar</button>
                <button onClick={cancelDelete}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {showFiltros && (
          <div className="container__modal" onClick={() => setShowFiltros(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h1>Filtros</h1>
              <hr />
              <div className="status">
                <div onClick={() => setActiveFilter('todos')} className={activeFilter === 'todos' ? 'active' : ''}>Todos</div>
                <div onClick={() => setActiveFilter('emDia')} className={activeFilter === 'emDia' ? 'active' : ''}>Em dia</div>
                <div onClick={() => setActiveFilter('vencidos')} className={activeFilter === 'vencidos' ? 'active' : ''}>Vencidos</div>
              </div>
              <hr />
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
