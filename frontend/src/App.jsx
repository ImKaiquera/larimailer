import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Send, FileCode, FileArchive, Heart, Sparkles, X } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

if (!API_URL) {
  throw new Error('A variável VITE_API_URL não foi configurada.');
}

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cursorFollowerRef = useRef(null);

  useEffect(() => {
    const follower = cursorFollowerRef.current;
    if (!follower || !window.matchMedia('(pointer: fine)').matches) return;

    let animationFrameId;
    let pointerX = 0;
    let pointerY = 0;

    const updatePosition = () => {
      follower.style.translate = `${pointerX + 14}px ${pointerY + 14}px`;
      animationFrameId = undefined;
    };

    const handlePointerMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      const editingText = event.target.closest('input, textarea, .swal2-container');
      const interactive = event.target.closest('button, .file-upload-wrapper');
      follower.classList.toggle('is-hidden', Boolean(editingText));
      follower.classList.toggle('is-interactive', Boolean(interactive));
      follower.classList.add('is-visible');

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updatePosition);
      }
    };

    const handlePointerLeave = () => follower.classList.remove('is-visible');

    window.addEventListener('pointermove', handlePointerMove);
    document.documentElement.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('mouseleave', handlePointerLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isZipPackage = selectedFile?.name.toLowerCase().endsWith('.zip');

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setHtmlCode('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!['html', 'zip'].includes(extension)) {
      Swal.fire({
        icon: 'error',
        title: 'Formato inválido',
        text: 'Selecione um arquivo HTML ou um pacote ZIP válido.',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
      clearSelectedFile();
      return;
    }

    setSelectedFile(file);

    if (extension === 'zip') {
      setHtmlCode('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlCode(event.target.result);
    };
    reader.onerror = () => {
      clearSelectedFile();
      Swal.fire({
        icon: 'error',
        title: 'Não foi possível abrir o arquivo',
        text: 'Tente selecionar o arquivo HTML novamente.',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
    };
    reader.readAsText(file);
  };

  const handleHtmlChange = (event) => {
    if (selectedFile) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setHtmlCode(event.target.value);
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

    if (!htmlCode && !isZipPackage) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Insira o código HTML ou selecione um arquivo HTML/ZIP.',
        confirmButtonColor: '#e5192f',
        background: '#fffaf3',
        color: '#201919'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const validEmails = [emailPessoal, emailEmpresa].filter(e => e.trim() !== '');
      const subject = `Novo e-mail em HTML - ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
      let requestOptions;

      if (isZipPackage) {
        const formData = new FormData();
        formData.append('to', JSON.stringify(validEmails));
        formData.append('subject', subject);
        formData.append('file', selectedFile);

        requestOptions = {
          method: 'POST',
          body: formData
        };
      } else {
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: validEmails,
            subject,
            htmlBody: htmlCode
          })
        };
      }

      const response = await fetch(`${API_URL}/api/send-email`, requestOptions);

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
      <img
        ref={cursorFollowerRef}
        className="pucca-cursor-follower"
        src="/pucca-cursor.png"
        alt=""
        aria-hidden="true"
      />

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
          <label>1. Envie seu HTML ou pacote ZIP</label>
          <div className="file-upload-wrapper">
            <input 
              type="file" 
              accept=".html,.zip,text/html,application/zip,application/x-zip-compressed"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            {selectedFile ? (
              <>
                {isZipPackage
                  ? <FileArchive className="file-upload-icon" style={{ color: 'var(--success)' }} />
                  : <FileCode className="file-upload-icon" style={{ color: 'var(--success)' }} />}
                <span className="file-upload-text" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                  {selectedFile.name} carregado
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="file-upload-icon" />
                <span className="file-upload-text">Clique para escolher um arquivo .html ou .zip</span>
              </>
            )}
          </div>
          {selectedFile && (
            <div className="selected-file-details">
              <span className={`file-kind-badge ${isZipPackage ? 'zip' : 'html'}`}>
                {isZipPackage ? 'Pacote ZIP' : 'Arquivo HTML'}
              </span>
              <span>{formatFileSize(selectedFile.size)}</span>
              <button type="button" className="clear-file-btn" onClick={clearSelectedFile} aria-label="Remover arquivo">
                <X size={14} /> Remover
              </button>
            </div>
          )}
        </div>

        {isZipPackage ? (
          <div className="zip-package-notice">
            <FileArchive size={20} />
            <div>
              <strong>Pacote pronto para envio</strong>
              <span>O HTML e suas imagens serão processados juntos pelo servidor.</span>
            </div>
          </div>
        ) : (
          <>
            <div className="divider">OU</div>

            <div className="form-group">
              <label htmlFor="htmlCode">2. Ou cole seu código HTML</label>
              <textarea
                id="htmlCode"
                placeholder="<!DOCTYPE html>&#10;<html>&#10;...&#10;</html>"
                value={htmlCode}
                onChange={handleHtmlChange}
              ></textarea>
            </div>
          </>
        )}

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? (
             <span>{isZipPackage ? 'Enviando pacote...' : 'Enviando...'}</span>
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
