import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Send, FileCode } from 'lucide-react';
import Swal from 'sweetalert2';

function App() {
  const [emailEmpresa, setEmailEmpresa] = useState(() => localStorage.getItem('emailEmpresa') || '');
  const [emailPessoal, setEmailPessoal] = useState(() => localStorage.getItem('emailPessoal') || '');

  useEffect(() => {
    localStorage.setItem('emailEmpresa', emailEmpresa);
  }, [emailEmpresa]);

  useEffect(() => {
    localStorage.setItem('emailPessoal', emailPessoal);
  }, [emailPessoal]);
  const [htmlCode, setHtmlCode] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      Swal.fire({
        icon: 'error',
        title: 'Formato inválido',
        text: 'Por favor, selecione um arquivo HTML válido.',
        confirmButtonColor: '#6366f1',
        background: '#191b22',
        color: '#ffffff'
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlCode(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailEmpresa || !emailPessoal) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha ambos os e-mails.',
        confirmButtonColor: '#6366f1',
        background: '#191b22',
        color: '#ffffff'
      });
      return;
    }

    if (!htmlCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Insira o código HTML ou faça upload de um arquivo.',
        confirmButtonColor: '#6366f1',
        background: '#191b22',
        color: '#ffffff'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulação do envio para o Back-end
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'E-mail enviado com sucesso para ambos os endereços!',
        confirmButtonColor: '#10b981',
        background: '#191b22',
        color: '#ffffff'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Ops...',
        text: 'Falha ao enviar e-mail. Tente novamente.',
        confirmButtonColor: '#ef4444',
        background: '#191b22',
        color: '#ffffff'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel">
      <h1>LariMailer - Disparador de E-mails</h1>
      <p className="subtitle">Feito com 💖 para o meu amor</p>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="emailEmpresa">E-mail da Empresa</label>
            <input 
              type="email" 
              id="emailEmpresa" 
              placeholder="empresa@dominio.com.br"
              value={emailEmpresa}
              onChange={(e) => setEmailEmpresa(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="emailPessoal">E-mail Pessoal</label>
            <input 
              type="email" 
              id="emailPessoal" 
              placeholder="seuemail@gmail.com"
              value={emailPessoal}
              onChange={(e) => setEmailPessoal(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>1. Fazer upload de arquivo HTML</label>
          <div 
            className="file-upload-wrapper" 
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              accept=".html, text/html" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            {fileName ? (
              <>
                <FileCode className="file-upload-icon" style={{ color: 'var(--success)' }} />
                <span className="file-upload-text" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                  {fileName} carregado
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="file-upload-icon" />
                <span className="file-upload-text">Clique ou arraste seu arquivo .html aqui</span>
              </>
            )}
          </div>
        </div>

        <div className="divider">OU</div>

        <div className="form-group">
          <label htmlFor="htmlCode">2. Colar código HTML</label>
          <textarea 
            id="htmlCode"
            placeholder="<!DOCTYPE html>&#10;<html>&#10;...&#10;</html>"
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
          ></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
             <span>Enviando...</span>
          ) : (
            <>
              <Send size={20} />
              <span>Disparar E-mails</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default App;
