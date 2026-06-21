(function(){
  // pré-carrega as imagens para evitar qualquer atraso/flash ao abrir o folder
  ['img/convite.jpeg', 'img/presentes.jpeg'].forEach(src => {
    const img = new Image();
    img.src = src;
  });

  const envelopeHit = document.getElementById('envelopeHit');
  const envelopeScene = document.getElementById('envelopeScene');
  const folderWrap = document.getElementById('folderWrap');
  const folder = document.getElementById('folder');
  const pageRight = document.getElementById('pageRight');
  const foldSeam = document.getElementById('foldSeam');
  const replayBtn = document.getElementById('replayBtn');
  const addressBlock = document.getElementById('addressBlock');
  const zoomHint = document.getElementById('zoomHint');

  let opened = false;

  function openInvite(){
    if(opened) return;
    opened = true;
    envelopeHit.classList.add('lock');
    envelopeHit.classList.add('opening');

    // seal breaks immediately, flap follows, then the letter slides out from
    // inside the pocket before the whole envelope scene fades away
    setTimeout(() => {
      envelopeScene.classList.add('hide');
    }, 1300);

    setTimeout(() => {
      folderWrap.classList.add('show');
      folder.classList.add('emerge');
    }, 1050);

    setTimeout(() => {
      pageRight.classList.add('open');
      foldSeam.classList.add('show');
    }, 1800);

    setTimeout(() => {
      folder.classList.add('settled');
      replayBtn.classList.add('show');
      addressBlock.classList.add('show');
      zoomHint.classList.add('show');
    }, 2500);
  }

  function resetInvite(){
    opened = false;
    folderWrap.classList.remove('show');
    folder.classList.remove('emerge','settled');
    pageRight.classList.remove('open');
    foldSeam.classList.remove('show');
    replayBtn.classList.remove('show');
    addressBlock.classList.remove('show');
    zoomHint.classList.remove('show');
    closeZoom();
    envelopeScene.classList.remove('hide');
    envelopeHit.classList.remove('opening','lock');
  }

  envelopeHit.addEventListener('click', openInvite);
  envelopeHit.addEventListener('touchend', function(e){ e.preventDefault(); openInvite(); }, {passive:false});
  replayBtn.addEventListener('click', resetInvite);

  // ---------- ZOOM: clicar na imagem amplia, clicar de novo volta ao normal ----------
  const zoomOverlay = document.getElementById('zoomOverlay');
  const zoomImage = document.getElementById('zoomImage');
  const zoomableImages = document.querySelectorAll('.page img');
  let zoomOpen = false;

  function openZoom(img){
    zoomImage.src = img.src;
    zoomImage.alt = img.alt || '';
    zoomOverlay.classList.add('show');
    zoomOpen = true;
  }

  function closeZoom(){
    if(!zoomOpen) return;
    zoomOverlay.classList.remove('show');
    zoomOpen = false;
  }

  zoomableImages.forEach(function(img){
    img.addEventListener('click', function(e){
      e.stopPropagation();
      // clicar na mesma imagem de novo fecha; clicar em outra abre ela ampliada
      if(zoomOpen && zoomImage.src === img.src){
        closeZoom();
      } else {
        openZoom(img);
      }
    });
  });

  // clicar em qualquer lugar do overlay (fundo ou a própria imagem ampliada) fecha
  zoomOverlay.addEventListener('click', closeZoom);

  // ---------- TILT: a carta acompanha a inclinação do celular ----------
  // Só ativa em dispositivos touch que suportam deviceorientation (celulares/tablets).
  // Em desktop nada acontece.
  (function initTilt(){
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const hasOrientation = typeof window.DeviceOrientationEvent !== 'undefined';
    if(!isTouchDevice || !hasOrientation) return;

    const tiltEnvelope = document.getElementById('tiltEnvelope');

    const MAX_TILT = 18;      // graus máximos de inclinação do cartão (igual em todos os eixos)

    let targetTiltY = 0, targetTiltX = 0;
    let curTiltY = 0, curTiltX = 0;
    let betaBaseline = null;
    let listening = false;
    let rafId = null;

    function onOrientation(e){
      if(e.gamma !== null){
        const gamma = Math.max(-45, Math.min(45, e.gamma)); // esquerda/direita
        targetTiltY = (gamma / 45) * MAX_TILT; // gira o cartão em torno do eixo vertical (esquerda/direita)
      }

      if(e.beta !== null){
        if(betaBaseline === null) betaBaseline = e.beta; // calibra a postura inicial de quem segura o celular
        const betaDelta = Math.max(-45, Math.min(45, e.beta - betaBaseline));
        targetTiltX = -(betaDelta / 45) * MAX_TILT; // gira o cartão em torno do eixo horizontal (frente/trás)
      }
    }

    function loop(){
      curTiltY += (targetTiltY - curTiltY) * .12;
      curTiltX += (targetTiltX - curTiltX) * .12;

      // rotateX + rotateY combinados permitem qualquer ângulo, incluindo diagonais
      // (ex: cima+direita), exatamente como inclinar um cartão físico na mão
      const cardTransform = 'perspective(700px) rotateX(' + curTiltX.toFixed(2) + 'deg) rotateY(' + curTiltY.toFixed(2) + 'deg)';
      if(tiltEnvelope) tiltEnvelope.style.transform = cardTransform;

      rafId = requestAnimationFrame(loop);
    }

    function startListening(){
      if(listening) return;
      listening = true;
      window.addEventListener('deviceorientation', onOrientation);
      if(!rafId) rafId = requestAnimationFrame(loop);
    }

    function requestPermissionThenStart(){
      if(typeof DeviceOrientationEvent.requestPermission === 'function'){
        // iOS 13+ exige permissão explícita disparada por um gesto do usuário
        DeviceOrientationEvent.requestPermission()
          .then(state => { if(state === 'granted') startListening(); })
          .catch(() => {});
      } else {
        startListening();
      }
    }

    if(typeof DeviceOrientationEvent.requestPermission === 'function'){
      // aguarda o primeiro toque na tela (ex: abrir o envelope) para pedir permissão
      document.body.addEventListener('touchend', requestPermissionThenStart, {once:true});
      document.body.addEventListener('click', requestPermissionThenStart, {once:true});
    } else {
      // Android e a maioria dos navegadores não exigem permissão explícita
      startListening();
    }
  })();
})();