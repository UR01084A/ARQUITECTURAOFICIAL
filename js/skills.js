// Animar barras de skills al hacer scroll
document.addEventListener("DOMContentLoaded", () => {
  const skills = document.querySelectorAll(".skill");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const bar = entry.target.querySelector(".skill-fill");
        const percent = entry.target.getAttribute("data-percent");
        bar.style.width = percent + "%";
      }
    });
  }, { threshold: 0.5 });

  skills.forEach(skill => observer.observe(skill));
});
