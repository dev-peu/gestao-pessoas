import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import logo from './logo.svg';
import * as XLSX from 'xlsx';

function App() {
  const [data, setData] = useState([]); // Estado para armazenar os dados da planilha
  const [item, setItem] = useState({});
  const newItem = {
    nome: '',
    celular: '',
    email: '',
    login: '',
    senha: '',
    mac: '',
    senhaMac: '',
    servidor: '',
    dataCadastro: '',
    ultimoPagamento: '',
    valor: 0,
    anotacoes: '',
    totalRecebido: 0
  }

  // Função para ler o arquivo Excel
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setData(jsonData); // Armazena os dados no estado
      console.log(jsonData); // Mostra o objeto no console para verificar
    };

    reader.readAsBinaryString(file);
  };

  const handleSave = () => {
    // Cálculo dos dias até o vencimento
    const diasParaVencer = calcularDiasParaVencer(item.ultimoPagamento);
    
    // Se o item está vazio, significa que estamos adicionando um novo item
    if (item.id > data[data.length - 1]?.id) {
      if (!item.nome) {
        return alert('Salve um nome nesse usuário');
      }
      setData([...data, { ...item, diasParaVencer }]); // Adiciona o novo item ao estado com dias para vencer
    } else {
      // Caso contrário, é uma atualização
      const updatedItem = { ...item, diasParaVencer }; // Atualiza o item com dias para vencer
      
      const updatedData = data.map((d) => (d.id === updatedItem.id ? updatedItem : d));
      setData(updatedData);
    }
  
    setItem({}); // Fecha o modal após salvar
  };
  
  
  const calcularDiasParaVencer = (ultimoPagamento) => {
    if (!ultimoPagamento) return null; // Se não houver data, retorna null
  
    const dataUltimoPagamento = new Date(ultimoPagamento);
    const diasParaVencimento = 30; // Por exemplo, 30 dias após o último pagamento
    const dataVencimento = new Date(dataUltimoPagamento);
    dataVencimento.setDate(dataVencimento.getDate() + diasParaVencimento);
  
    const hoje = new Date();
    const diffTime = dataVencimento - hoje; // Diferença em milissegundos
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Converter para dias
  
    return diffDays; // Retorna o número de dias até o vencimento
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data); // Converte os dados em uma planilha
    const workbook = XLSX.utils.book_new(); // Cria um novo livro de trabalho
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados"); // Adiciona a planilha ao livro
    const hoje = new Date();
    XLSX.writeFile(workbook, `Gestao_iptv_${hoje.toLocaleDateString('brazil')}.xlsx`); // Faz o download do arquivo
  };



  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {data.length <= 0 && (
          <>
            <h1>Escolha a planilha</h1>
            <input className="import__btn" type="file" accept=".xls,.xlsx" onChange={handleFileUpload} />
          </>
        )}

        {data.length > 0 && (
          <>
            <div className="container">
              {data.map((item) => (
                <div className='item' key={item.id} onClick={() => setItem(item)}>
                  <p>{item.nome}</p>
                  <p>Dias até vencimento: {item.diasParaVencer !== undefined ? item.diasParaVencer : 'N/A'}</p>
                </div>
              ))}
            </div>

            <div className='adicionar' onClick={() => setItem({...newItem, id: data.length + 1})}>
              <i style={{color: 'green', fontSize: '50px'}} class="fa-solid fa-square-plus"></i>
            </div>

            <div className="baixar" onClick={handleExport}>
              <span> <i class="fa-solid fa-circle-down"></i> Baixar</span>
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
                  Email:
                  <input 
                    type="text" 
                    value={item.email} 
                    onChange={(e) => setItem({ ...item, email: e.target.value })} 
                  />
                  <a className='ligar' href={`mailto:${item.email}`}>Contatar</a>
                </label>
              </div>

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
                  Servidor
                  <input
                    type="text"
                    value={item.servidor} // Certifique-se de adicionar a propriedade no seu objeto `item`
                    onChange={(e) => setItem({ ...item, servidor: e.target.value })}
                  />
                </label>

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
                Status: {item.ultimoPagamento && (
                  <span> 
                    {calcularDiasParaVencer(item.ultimoPagamento) < 0 ? `(Vencido há ${String(calcularDiasParaVencer(item.ultimoPagamento)).replace('-', '')} dias)` : `Dias até o vencimento: ${calcularDiasParaVencer(item.ultimoPagamento)}`}
                  </span>
                )}
              </div>
              
              <label>
                  Anotações:
                  <textarea style={{padding: '5px'}}
                    value={item.anotacoes} // Certifique-se de adicionar a propriedade no seu objeto `item`
                    onChange={(e) => setItem({ ...item, anotacoes: e.target.value })}
                    rows={3}
                  />
                </label>

              {/* <span>Total recebido: R$ {item.totalRecebido.toFixed(2)}</span> */}
              <button className='salvar' onClick={() => handleSave()}>Salvar</button>
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
