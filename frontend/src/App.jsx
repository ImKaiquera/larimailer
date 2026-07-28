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
  
  const cursorDotRef = useRef(null);
  const cursorOutlineRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const particleCount = 70;
    const connectDistance = 150;
    const mouseConnectDistance = 200;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: Math.random() * 2 + 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.fill();

        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < mouseConnectDistance) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          const opacity = 1 - (distMouse / mouseConnectDistance);
          ctx.strokeStyle = `rgba(250, 204, 21, ${opacity * 0.7})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = 1 - (dist / connectDistance);
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorDotRef.current && cursorOutlineRef.current) {
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top = `${e.clientY}px`;
        
        cursorOutlineRef.current.animate({
          left: `${e.clientX}px`,
          top: `${e.clientY}px`
        }, { duration: 300, fill: "forwards" });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interactiveElements = document.querySelectorAll('button, input, textarea, .file-upload-wrapper');
    
    const handleMouseOver = () => {
      cursorDotRef.current?.classList.add('hovered');
      cursorOutlineRef.current?.classList.add('hovered');
    };
    
    const handleMouseLeave = () => {
      cursorDotRef.current?.classList.remove('hovered');
      cursorOutlineRef.current?.classList.remove('hovered');
    };

    interactiveElements.forEach(el => {
      el.addEventListener('mouseover', handleMouseOver);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseover', handleMouseOver);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  });

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
    
    if (!emailEmpresa && !emailPessoal) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha pelo menos um e-mail.',
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
        confirmButtonColor: '#10b981',
        background: '#191b22',
        color: '#ffffff'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Ops...',
        text: error.message || 'Falha ao enviar e-mail. Tente novamente.',
        confirmButtonColor: '#ef4444',
        background: '#191b22',
        color: '#ffffff'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="custom-cursor-dot" ref={cursorDotRef}></div>
      <div className="custom-cursor-outline" ref={cursorOutlineRef}></div>
      <canvas ref={canvasRef} className="plexus-canvas"></canvas>
      <div className="glass-panel">
      <h1>LariMailer - Disparador de E-mail</h1>
      <p className="subtitle">Feito com 💖 para o meu amor</p>

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
              <span>Disparar e-mail</span>
            </>
          )}
        </button>
      </form>
    </div>
    </>
  );
}

export default App;
