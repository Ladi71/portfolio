//––––––––––––––––––––––––-–––––––––––––––––––––––––––-–––––––––––––––––––––––––––-–––––––––––––––––––––––––––-–––––––––––––––––––––––––––------------------
//SWIPER –––––––––––––––––––––––––––-–––––––––––––––––––––––––––-–––––––––––––––––––––––––––-–––––––––––––––––––––––––––-–––––––––––––––––––––––––––-––––––––––––––
// Stellt sicher, dass das DOM vollständig geladen ist, bevor der Swiper initialisiert wird.
document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".swiper", {
    // Optionale Parameter

    // Deaktiviert die Endlosschleife, da sie in Kombination mit
    // "slidesPerView: 'auto'" und "freeMode: true" oft Performance-Probleme
    // verursacht und zu unsauberen Übergängen führt.
    loop: false,

    // Ermöglicht es dem Swiper, nur so viele Slides anzuzeigen, wie in den
    // CSS-Einstellungen definiert sind, ideal für horizontale Scroll-Layouts.
    slidesPerView: "auto",

    // Erlaubt das freie Scrollen, anstatt an bestimmten Slides einzurasten.
    freeMode: true,

    // Abstand zwischen den Slides in Pixeln.
    spaceBetween: 4,

    // Ermöglicht das Steuern des Sliders mit dem Mausrad.
    mousewheel: true,

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
});
