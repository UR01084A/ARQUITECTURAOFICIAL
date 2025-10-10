// Selecciona todos los elementos con la clase fade-in
const faders = document.querySelectorAll('.fade-in');

// Opciones para el Intersection Observer
const appearOptions = {
  threshold: 0.3, // Qué porcentaje del elemento debe estar visible
  rootMargin: "0px 0px -50px 0px"
};

// Función que se ejecuta cuando los elementos aparecen en pantalla
const appearOnScroll = new IntersectionObserver(function(entries, observer){
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    // Agrega la clase visible para animación fade-in
    entry.target.classList.add('visible');

    // Animar las barras de habilidades
    const bars = entry.target.querySelectorAll('.level-fill');
    bars.forEach(bar => {
      // Llenar la barra según el width definido en el HTML
      bar.style.width = bar.style.width || bar.getAttribute('style').match(/\d+%/)[0];
    });

    // Dejar de observar el elemento
    observer.unobserve(entry.target);
  });
}, appearOptions);

// Observa cada elemento fade-in
faders.forEach(fader => {
  appearOnScroll.observe(fader);
});

