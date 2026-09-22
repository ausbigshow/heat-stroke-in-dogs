const fs = require('fs');

let css = fs.readFileSync('css/act2-screen.css', 'utf8');

// Add animations for the lines
css += `
/* Accumulating conversation lines animations */
.act2-check-tech-line.is-new-line {
  animation: act2SlideFadeLeft var(--dur-base) var(--ease-out-expo) forwards;
}

.act2-check-callie-line.is-new-line {
  animation: act2SlideFadeRight var(--dur-base) var(--ease-out-expo) forwards;
}

@keyframes act2SlideFadeLeft {
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes act2SlideFadeRight {
  from {
    opacity: 0;
    transform: translateX(15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Reduced motion for conversation lines */
@media (prefers-reduced-motion: reduce) {
  .act2-check-tech-line.is-new-line,
  .act2-check-callie-line.is-new-line {
    animation-duration: 0.01s !important;
    animation-delay: 0s !important;
  }
}
`;

fs.writeFileSync('css/act2-screen.css', css);
