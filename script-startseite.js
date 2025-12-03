// ******************************************************
// WICHTIG: Das gesamte Skript in window.onload einschließen,
// um sicherzustellen, dass alle HTML-Elemente (wie der Header)
// geladen sind, bevor ihre Größe ausgelesen wird.
// ******************************************************
window.onload = function () {
  // ******************************************************
  // 1. CANVAS-INITIALISIERUNG UND GRUNDKONFIGURATION
  // ******************************************************

  // Referenz auf das <canvas>-Element aus der HTML-Seite
  const canvas = document.getElementById("canvas");
  // Der 2D-Rendering-Kontext, der alle Zeichenfunktionen bereitstellt
  const ctx = canvas.getContext("2d");
  // Referenz auf den Header (neu hinzugefügt, um die Höhe dynamisch zu messen)
  const headerGrid = document.getElementById("headerGrid");

  // Basis-Werte für die dynamische Rechteckgröße (bereits responsive)
  const RECT_BASE_W_VW = 8.0;
  const RECT_BASE_H_VW = 10.13;

  // Globale Variable für die dynamische Header-Höhe in Pixeln
  let HEADER_HEIGHT_PX = 0;

  // Globale Variablen für die Mausposition
  let mouseX = -1;
  let mouseY = -1;
  // Letzter Zeitstempel für die Animationssteuerung (wird in draw() initialisiert)
  let lastTime = 0;

  // Konstanten für die Hover-Animation
  const SCALE_FACTOR = 1.5; // Faktor der Vergrößerung
  const ANIMATION_DURATION_MS = 500; // Dauer der Animation in Millisekunden

  // Konstanten für die zeitbasierte Bewegung
  const MAX_SPEED_PX_PER_SEC = 800; // Steuert die zufällige Geschwindigkeit, wenn nicht abgestoßen
  const COLLISION_FORCE_MULTIPLIER = 200; // Stärke des Wegdrückens, wenn sich Löcher begegnen
  const MAX_COLLISION_SPEED_PX_PER_SEC = 100; // Max. Geschwindigkeit, die nach Abstoßen erreicht werden kann

  // Konstanten zur Stabilisierung der Bewegung
  const DAMPING_FACTOR = 1; // Dämpfung/Reibung: Je näher an 1, desto weniger Dämpfung
  const DRIVE_FORCE_PX_PER_SEC_SQUARED = 300; // Konstante Beschleunigung, um die Bewegung aufrechtzuerhalten
  const MIN_VELOCITY_ON_STOP = 800; // Mindestgeschwindigkeit (px/s), die zugewiesen wird, wenn ein Rechteck stillsteht

  // Variablen zur dynamischen Speicherung der aktuellen Pixel-Größen
  let w = 0;
  let h = 0;

  // Funktion zur Größenanpassung des Canvas an das Browserfenster
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // NEU: Die tatsächliche Pixel-Höhe des responsiven Headers abrufen
    // Dies funktioniert, da der Header in CSS mit 'vh' (responsiv) definiert ist
    // Zuerst muss headerGrid initialisiert sein (durch window.onload garantiert)
    HEADER_HEIGHT_PX = headerGrid.offsetHeight;

    // Berechne w und h neu basierend auf der aktuellen Fensterbreite
    w = (window.innerWidth / 100) * RECT_BASE_W_VW;
    h = (window.innerWidth / 100) * RECT_BASE_H_VW;

    // Muss die baseW und baseH der Rechtecke bei jeder Größenänderung aktualisieren,
    // da sie als Basis für die Animation dienen.
    if (typeof rects !== "undefined") {
      // Prüfen, ob rects schon definiert ist
      rects.forEach((r) => {
        r.baseW = w;
        r.baseH = h;
        // Setzt auch die aktuellen und Zielgrößen zurück (wichtig für responsive Darstellung)
        r.w = w;
        r.h = h;
        r.targetW = w;
        r.targetH = h;
      });
    }
  }
  // Event-Listener: Ruft 'resize' auf, wenn das Fenster in der Größe geändert wird
  window.addEventListener("resize", resize);

  // Funktion zur Speicherung der Mausposition
  function handleMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
  window.addEventListener("mousemove", handleMouseMove);

  // ******************************************************
  // 2. HILFSFUNKTIONEN (overlap wird weiterhin nicht verwendet)
  // ******************************************************

  function overlap(a, b) {
    // ... (Kollisionslogik)
    return !(
      a.x + a.w < b.x ||
      a.x > b.x + b.w ||
      a.y + a.h < b.y ||
      a.y > b.y + b.h
    );
  }

  // ******************************************************
  // 3. RECHTECK-DEFINITIONEN UND STARTPOSITIONEN
  // ******************************************************

  // Initialisierung der Rechteck-Größen (wird später durch resize() überschrieben)
  w = (window.innerWidth / 100) * RECT_BASE_W_VW;
  h = (window.innerWidth / 100) * RECT_BASE_H_VW;

  // Definiert Startpositionen als Prozentsatz der Bildschirmgröße (0.0 bis 1.0).
  const positions = [
    { x: 0.14, y: 0.12 },
    { x: 0.4, y: 0.1 },
    { x: 0.8, y: 0.15 },
    { x: 0.08, y: 0.42 },
    { x: 0.33, y: 0.47 },
    { x: 0.59, y: 0.6 },
    { x: 0.85, y: 0.52 },
    { x: 0.16, y: 0.78 },
    { x: 0.42, y: 0.83 },
    { x: 0.74, y: 0.8 },
  ];

  // Erstellt das finale Array von Rechteck-Objekten.
  const rects = positions.map((pos, i) => ({
    // Startpositionen werden initial auf die Canvas-Größe skaliert
    x: pos.x * window.innerWidth - w / 2,
    y: pos.y * window.innerHeight - h / 2,

    baseW: w, // Initial auf den berechneten Pixelwert setzen
    baseH: h, // Initial auf den berechneten Pixelwert setzen
    w: w,
    h: h,
    targetW: w,
    targetH: h,
    transitionStartW: w,
    transitionStartH: h,
    transitionStartTime: 0,
    isHovered: false,

    // Bewegungs-Eigenschaften: Startwerte in Pixel/Sekunde
    vx: (Math.random() - 0.5) * MAX_SPEED_PX_PER_SEC * 0.5,
    vy: (Math.random() - 0.5) * MAX_SPEED_PX_PER_SEC * 0.5,
  }));

  // Jetzt den resize-Handler einmal ausführen, um w/h und HEADER_HEIGHT_PX richtig zu setzen
  // Dies geschieht NACHDEM rects definiert wurde.
  resize();

  // ******************************************************
  // 4. ANIMATIONSSCHLEIFE (DIE HAUPTLOGIK)
  // ******************************************************

  function draw(currentTime) {
    // ----------------------------------------------------
    // 4a. Delta Time Berechnung (Verstrichene Zeit in Sekunden)
    // ----------------------------------------------------
    if (lastTime === 0) lastTime = currentTime;

    const deltaTime_s = (currentTime - lastTime) / 1000;
    // Limitiert auf max. 30 FPS, falls der Browser den Tab pausiert und dann reaktiviert
    const deltaTime_safe = Math.min(deltaTime_s, 1 / 30);

    // 4b. Hintergrund malen (Die Maske)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4c. Löcher in die Maske schneiden
    ctx.globalCompositeOperation = "destination-out";

    // Iteriert über jedes Rechteck
    rects.forEach((r, i) => {
      // Speichert die aktuelle Größe für die Zentrierungs-Korrektur
      const w_prev = r.w;
      const h_prev = r.h;

      // ----------------------------------------------------
      // 4d. HOVER-ERKENNUNG UND GRÖSSEN-ANIMATION
      // ----------------------------------------------------

      const isMouseOver =
        mouseX >= r.x &&
        mouseX <= r.x + r.w &&
        mouseY >= r.y &&
        mouseY <= r.y + r.h;

      // * Logik zum Starten der Animation (Vergrößern/Verkleinern) *
      if (isMouseOver && !r.isHovered) {
        r.isHovered = true;
        r.transitionStartW = r.w;
        r.transitionStartH = r.h;
        r.targetW = r.baseW * SCALE_FACTOR;
        r.targetH = r.baseH * SCALE_FACTOR;
        r.transitionStartTime = currentTime;
      } else if (!isMouseOver && r.isHovered) {
        // START der Verkleinerung: Zielgröße auf Basisgröße zurücksetzen
        r.isHovered = false;
        r.transitionStartW = r.w;
        r.transitionStartH = r.h;
        r.targetW = r.baseW;
        r.targetH = r.baseH;
        r.transitionStartTime = currentTime;

        // Geschwindigkeit wiederherstellen (Anstupsen)
        r.vx = (Math.random() - 0.5) * MAX_SPEED_PX_PER_SEC;
        r.vy = (Math.random() - 0.5) * MAX_SPEED_PX_PER_SEC;
      }

      // * Größen-Tweening (Animation) *
      if (r.w !== r.targetW) {
        const elapsed = currentTime - r.transitionStartTime;
        const progress = Math.min(1, elapsed / ANIMATION_DURATION_MS);

        // Linear Interpolation: r.w wird von transitionStartW zu targetW animiert
        r.w = r.transitionStartW + (r.targetW - r.transitionStartW) * progress;
        r.h = r.transitionStartH + (r.targetH - r.transitionStartH) * progress;

        if (progress === 1) {
          r.w = r.targetW;
          r.h = r.targetH;
        }
      }

      // ----------------------------------------------------
      // 4e. Physik und Bewegung (Delta Time basiert)
      // ----------------------------------------------------

      // Kollisionsvermeidung mit anderen Rechtecken
      rects.forEach((other, j) => {
        if (i !== j) {
          const dx = r.x + r.w / 2 - (other.x + other.w / 2);
          const dy = r.y + r.h / 2 - (other.y + other.h / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          // Hier verwenden wir einen Mindestabstand, der sich nach der
          // maximalen Hover-Größe richtet, um eine sauberere Abstoßung zu gewährleisten.
          const minDistance = Math.max(r.w, r.h, other.w, other.h) * 0.8;

          if (distance < minDistance && distance > 0) {
            // Kraft mit Multiplikator und deltaTime skaliert
            const force =
              ((minDistance - distance) / distance) *
              COLLISION_FORCE_MULTIPLIER *
              deltaTime_safe;
            r.vx += dx * force;
            r.vy += dy * force;
          }
        }
      });

      // Bewegungslogik überspringen, wenn gehovert
      if (!r.isHovered) {
        // Dämpfung/Reibung anwenden
        r.vx *= Math.pow(DAMPING_FACTOR, deltaTime_safe * 60);
        r.vy *= Math.pow(DAMPING_FACTOR, deltaTime_safe * 60);

        // Sanfte Antriebskraft in Bewegungsrichtung, um Steckenbleiben zu verhindern
        const speedSq = r.vx * r.vx + r.vy * r.vy;
        const speed = Math.sqrt(speedSq);

        if (
          speedSq < MIN_VELOCITY_ON_STOP * MIN_VELOCITY_ON_STOP &&
          speedSq > 0
        ) {
          // Wenn die Geschwindigkeit unter einem Minimum liegt, gib ihm einen sanften Schubs
          r.vx +=
            (r.vx / speed) * DRIVE_FORCE_PX_PER_SEC_SQUARED * deltaTime_safe;
          r.vy +=
            (r.vy / speed) * DRIVE_FORCE_PX_PER_SEC_SQUARED * deltaTime_safe;
        } else if (speed === 0) {
          // Wenn Geschwindigkeit Null ist (steckengeblieben), gib ihm einen zufälligen Schubs
          r.vx = (Math.random() - 0.5) * MAX_SPEED_PX_PER_SEC * 0.5;
          r.vy = (Math.random() - 0.5) * MAX_SPEED_PX_PER_SEC * 0.5;
        }

        // Positions-Update (SKALIERT MIT DELTA TIME FÜR KONSISTENTE GESCHWINDIGKEIT)
        r.x += r.vx * deltaTime_safe;
        r.y += r.vy * deltaTime_safe;

        // NEU: Robuste Randkollision (Bouncing) mit DYNAMISCHER HEADER-Höhe als oberer Grenze

        // Linker Rand
        if (r.x < 0) {
          r.x = 0;
          r.vx *= -1;
        }
        // Rechter Rand
        else if (r.x + r.w > canvas.width) {
          r.x = canvas.width - r.w;
          r.vx *= -1;
        }

        // OBERER RAND (Verhindert, dass das Rechteck über den Header stößt)
        if (r.y < HEADER_HEIGHT_PX) {
          r.y = HEADER_HEIGHT_PX; // Position an die Unterkante des Headers setzen
          r.vy *= -1; // Richtung umkehren
        }
        // Unterer Rand
        else if (r.y + r.h > canvas.height) {
          r.y = canvas.height - r.h;
          r.vy *= -1;
        }

        // Geschwindigkeitslimitierung (Muss Px/s limitieren)
        const maxSpeedSq =
          MAX_COLLISION_SPEED_PX_PER_SEC * MAX_COLLISION_SPEED_PX_PER_SEC;
        const currentSpeedSq = r.vx * r.vx + r.vy * r.vy;

        if (currentSpeedSq > maxSpeedSq) {
          const limitedSpeed = Math.sqrt(currentSpeedSq);
          r.vx = (r.vx / limitedSpeed) * MAX_COLLISION_SPEED_PX_PER_SEC;
          r.vy = (r.vy / limitedSpeed) * MAX_COLLISION_SPEED_PX_PER_SEC;
        }
      } else {
        // Wenn gehovert: Die Geschwindigkeit für den nächsten Frame auf Null setzen.
        r.vx = 0;
        r.vy = 0;
      }

      // ----------------------------------------------------
      // 4f. ZENTRIERUNGS-KORREKTUR
      // ----------------------------------------------------

      // Die X/Y-Position muss verschoben werden, um den Mittelpunkt des Rechtecks
      // während der Vergrößerung/Verkleinerung an Ort und Stelle zu halten.
      const shiftX = (w_prev - r.w) / 2;
      const shiftY = (h_prev - r.h) / 2;

      r.x += shiftX;
      r.y += shiftY;

      // ----------------------------------------------------
      // 4g. Rechteck zeichnen (Das Loch)
      // ----------------------------------------------------

      ctx.fillStyle = "white";
      // Zeichnet das Rechteck mit der aktuellen, animierten Größe und korrigierten Position
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    // Speichert die aktuelle Zeit für die nächste Berechnung
    lastTime = currentTime;

    // Fragt den Browser, die 'draw'-Funktion erneut aufzurufen.
    requestAnimationFrame(draw);
  }

  // Startet die Animation zum ersten Mal, nachdem alles initialisiert ist.
  requestAnimationFrame(draw);
};
