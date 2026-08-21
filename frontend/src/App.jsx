import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Send, FileCode, Heart, Sparkles } from 'lucide-react';
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
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
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
    
    if (!emailEmpresa && !emailPessoal) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha pelo menos um e-mail.',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
      return;
    }

    if (!htmlCode) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Insira o código HTML ou faça upload de um arquivo.',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const validEmails = [emailPessoal, emailEmpresa].filter(e => e.trim() !== '');

      const response = await fetch('https://larimailer-backend.vercel.app/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: validEmails,
          subject: `Novo e-mail em HTML - ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`,
          htmlBody: htmlCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro interno no servidor.');
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: validEmails.length > 1 
          ? 'E-mail enviado com sucesso para ambos os endereços!' 
          : 'E-mail enviado com sucesso para o endereço informado!',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Ops...',
        text: error.message || 'Falha ao enviar e-mail. Tente novamente.',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="floating-decor" aria-hidden="true">
        <Heart className="floating-heart heart-one" fill="currentColor" />
        <Heart className="floating-heart heart-two" fill="currentColor" />
        <Heart className="floating-heart heart-three" fill="currentColor" />
        <span className="floating-flower flower-one">✿</span>
        <span className="floating-flower flower-two">✿</span>
      </div>

      <main className="mailer-shell">
        <aside className="love-story" aria-label="Pucca e Garu">
          <div className="sun-seal" aria-hidden="true"></div>
          <img
            className="pucca-illustration"
            src="/pucca-love.png"
            alt="Pucca dando um beijo carinhoso em Garu"
          />
          <div className="love-note">
            <Heart size={16} fill="currentColor" />
            <span>Feito para enviar carinho</span>
          </div>
        </aside>

        <section className="mailer-card">
          <header className="card-header">
            <span className="eyebrow"><Sparkles size={14} /> Mensagem especial</span>
            <h1>LariMailer</h1>
            <p className="subtitle">Um e-mail cheio de amor, do jeitinho da Pucca.</p>
          </header>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="emailPessoal">E-mail Pessoal</label>
            <input 
              type="email" 
              id="emailPessoal" 
              placeholder="seuemail@gmail.com"
              value={emailPessoal}
              onChange={(e) => setEmailPessoal(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="emailEmpresa">E-mail da Empresa</label>
            <input 
              type="email" 
              id="emailEmpresa" 
              placeholder="empresa@dominio.com.br"
              value={emailEmpresa}
              onChange={(e) => setEmailEmpresa(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>1. Envie seu arquivo HTML</label>
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
                <span className="file-upload-text">Clique para escolher seu arquivo .html</span>
              </>
            )}
          </div>
        </div>

        <div className="divider">OU</div>

        <div className="form-group">
          <label htmlFor="htmlCode">2. Ou cole seu código HTML</label>
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
              <span>Enviar com carinho</span>
            </>
          )}
        </button>
          </form>
        </section>
      </main>
    </>
  );
}

export default App;
