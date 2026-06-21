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
    envelopeScene.classList.remove('hide');
    envelopeHit.classList.remove('opening','lock');
  }

  envelopeHit.addEventListener('click', openInvite);
  envelopeHit.addEventListener('touchend', function(e){ e.preventDefault(); openInvite(); }, {passive:false});
  replayBtn.addEventListener('click', resetInvite);

  // ---------- TILT: a carta acompanha a inclinação do celular ----------
  // Só ativa em dispositivos touch que suportam deviceorientation (celulares/tablets).
  // Em desktop nada acontece.
  (function initTilt(){
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const hasOrientation = typeof window.DeviceOrientationEvent !== 'undefined';
    if(!isTouchDevice || !hasOrientation) return;

    const tiltEnvelope = document.getElementById('tiltEnvelope');
    const bgLayer = document.querySelector('.bg-layer');

    const MAX_TILT = 16;      // graus máximos de inclinação do cartão (mesmo valor em todos os eixos)
    const MAX_PARALLAX = 8;   // px máximos de deslocamento do fundo

    let targetRotate = 0, targetTiltX = 0, targetParX = 0, targetParY = 0;
    let curRotate = 0, curTiltX = 0, curParX = 0, curParY = 0;
    let betaBaseline = null;
    let listening = false;
    let rafId = null;

    function onOrientation(e){
      if(e.gamma === null) return;
      const gamma = Math.max(-45, Math.min(45, e.gamma)); // esquerda/direita
      targetRotate = (gamma / 45) * MAX_TILT;
      targetParX = -(gamma / 45) * MAX_PARALLAX;

      if(e.beta !== null){
        if(betaBaseline === null) betaBaseline = e.beta; // calibra a postura inicial de quem segura o celular
        const betaDelta = Math.max(-45, Math.min(45, e.beta - betaBaseline));
        targetTiltX = (betaDelta / 45) * MAX_TILT; // frente/trás, mesma intensidade do eixo esquerda/direita
        targetParY = -(betaDelta / 45) * MAX_PARALLAX;
      }
    }

    function loop(){
      curRotate += (targetRotate - curRotate) * .12;
      curTiltX  += (targetTiltX  - curTiltX)  * .12;
      curParX   += (targetParX   - curParX)   * .08;
      curParY   += (targetParY   - curParY)   * .08;

      const cardTransform = 'perspective(700px) rotateZ(' + curRotate.toFixed(2) + 'deg) rotateX(' + (-curTiltX).toFixed(2) + 'deg)';
      if(tiltEnvelope) tiltEnvelope.style.transform = cardTransform;
      if(bgLayer) bgLayer.style.transform = 'translate(' + curParX.toFixed(2) + 'px,' + curParY.toFixed(2) + 'px)';

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