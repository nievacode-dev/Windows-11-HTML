// const swipeDiv = document.getElementById('lockScreen');

// let isDragging = false;
// let startY = 0;
// let currentY = 0;

// swipeDiv.addEventListener('mousedown', (e) => {
//   isDragging = true;
//   startY = e.clientY;
//   swipeDiv.style.transition = 'none'; // Disable transition during drag
//   swipeDiv.style.cursor = 'grabbing';
// });

// document.addEventListener('mousemove', (e) => {
//   if (!isDragging) return;
//   currentY = e.clientY;
//   let deltaY = currentY - startY;
//   if (deltaY < 0) { // Only allow upward drag
//     swipeDiv.style.transform = `translateY(${100 + deltaY}px)`; // 100% + deltaY px
//   }
// });

// document.addEventListener('mouseup', (e) => {
//   if (!isDragging) return;
//   isDragging = false;
//   swipeDiv.style.transition = 'transform 0.5s ease';
//   let deltaY = e.clientY - startY;

//   if (deltaY < -50) { // Threshold for swipe up
//     swipeDiv.classList.add('active'); // Slide up fully
//     swipeDiv.style.transform = 'translateY(0)';
//   } else {
//     swipeDiv.classList.remove('active'); // Return to bottom
//     swipeDiv.style.transform = 'translateY(100%)';
//   }
//   swipeDiv.style.cursor = 'grab';
// });

const lockScreen = document.getElementById('lockScreen');

let isDragging = false;
let startY = 0;

// Mouse swipe up detection
lockScreen.addEventListener('mousedown', (e) => {
  isDragging = true;
  startY = e.clientY;
  lockScreen.style.transition = 'none';
  lockScreen.style.cursor = 'grabbing';
});

// document.addEventListener('mousemove', (e) => {
//   if (!isDragging) return;
//   let deltaY = e.clientY - startY;
//   if (deltaY < 0) {
//     lockScreen.style.transform = `translateY(${100 + deltaY}px)`; // 100% + deltaY px
//   }
// });

document.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  lockScreen.style.transition = 'transform 0.5s ease';
  let deltaY = e.clientY - startY;
  if (deltaY < -50) { // threshold for swipe up
    lockScreen.classList.add('active');
    lockScreen.style.transform = 'translateY(0)';
  } else {
    lockScreen.classList.remove('active');
    lockScreen.style.transform = 'translateY(-100%)';
  }
  lockScreen.style.cursor = 'grab';
});

// Keyboard spacebar detection
// document.addEventListener('keydown', (e) => {
//   if (e.key === ' ') {
//     e.preventDefault();
//     if (!lockScreen.classList.contains('active')) {
//       lockScreen.classList.add('active');
//       lockScreen.style.transform = 'translateY(0)';
//     } else {
//       lockScreen.classList.remove('active');
//       lockScreen.style.transform = 'translateY(-100%)';
//     }
//   }
// });
