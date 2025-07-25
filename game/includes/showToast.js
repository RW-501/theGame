let toastNumber = 0;
let toastQueue = [];
let activeToasts = new Set();
let createTosatBool = false;

/**
 * Main toast display function
 */
export function showToast(
  message,
  type = 'info',
  duration = 3500,
  link = null,
  confirm = false,
  linkTitle = 'Click Here',
  progress = null
) {
  const toastId = `toast_${toastNumber}`;
  const toastKey = `${type}_${message}`;

  if (activeToasts.has(toastKey) || toastQueue.length > 0 || document.querySelector('.mainShowToast')) {
    if (!activeToasts.has(toastKey)) {
      toastQueue.push({ message, type, duration, link, confirm, linkTitle, progress });
    }
    createTosatBool = false;
    return;
  } else {
    createTosatBool = true;
  }

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = "mainShowToast";
  toastNumber++;

  activeToasts.add(toastKey);

  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('duration', duration);
  toast.setAttribute('type', type);
  toast.setAttribute('message', message);
  toast.setAttribute('link', link);
  toast.setAttribute('confirm', confirm);
  toast.setAttribute('linkTitle', linkTitle);
  toast.setAttribute('progress', progress);

  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 18px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  toast.style.color = '#fff';
  toast.style.zIndex = '9999';
  toast.style.fontFamily = 'Arial, sans-serif';
  toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease, bottom 0.3s ease';
  toast.style.transform = 'translateY(20px)';
  toast.style.opacity = 1;

  const icon =
    type === 'error' ? '<i class="fas fa-exclamation-circle" style="color: white; font-size: 28px;"></i>' :
    type === 'success' ? '<i class="fas fa-check-circle" style="color: white; font-size: 28px;"></i>' :
    type === 'warning' ? '<i class="fas fa-exclamation-triangle" style="color: white; font-size: 28px;"></i>' :
    type === 'notification' ? '<i class="fas fa-bell" style="color: white; font-size: 28px;"></i>' :
    '<i class="fas fa-info-circle" style="color: white; font-size: 28px;"></i>';

  switch (type) {
    case 'success': toast.style.backgroundColor = '#4CAF50'; break;
    case 'error': toast.style.backgroundColor = '#F44336'; break;
    case 'info': toast.style.backgroundColor = '#2196F3'; break;
    case 'warning': toast.style.backgroundColor = '#FF9800'; break;
    case 'notification': toast.style.backgroundColor = '#FFEB3B'; break;
    default: toast.style.backgroundColor = '#2196F3'; break;
  }

  if (link) {
    message = `${message} <a href="${link}" target="_blank" style="color: #fff; text-decoration: underline;">${linkTitle}</a>`;
  }

  const progressBarHTML = progress !== null ? `
    <div style="width: 100%; background: rgba(255, 255, 255, 0.3); border-radius: 4px; margin-top: 8px;">
      <div id="toastProgressBar" style="height: 4px; width: 0%; background: white; border-radius: 4px;"></div>
    </div>
  ` : '';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="material-icons" style="color: white; font-size: 28px;">${icon}</span>
        <span style="font-size: 16px; font-weight: 500;">${message}</span>
        ${progressBarHTML}
      </div>
      ${confirm
        ? `<button onclick="dismissToast(this)" style="background: transparent; border: none; color: white; font-size: 18px; cursor: pointer;">Confirm</button>`
        : `<button onclick="dismissToast(this)" style="background: transparent; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>`
      }
    </div>
  `;

  if (createTosatBool) {
    document.body.appendChild(toast);

    if (!confirm) {
      setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateY(20px)';
        toast.classList.add('fade-out');
        toast.style.bottom = '-50px';
      }, duration);

      setTimeout(() => {
        toast.remove();
        activeToasts.delete(toastKey);
        processNextToast();
      }, duration + 300);
    }
  }
}

/**
 * Process queued toasts
 */
function processNextToast() {
  if (toastQueue.length > 0) {
    const nextToast = toastQueue.shift();
    showToast(nextToast.message, nextToast.type, nextToast.duration, nextToast.link, nextToast.confirm, nextToast.linkTitle, nextToast.progress);
  }
}

/**
 * Remove the toast from DOM and process queue
 */
export function dismissToast(button) {
  const toast = button.closest('.mainShowToast');
  if (toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      toast.remove();
      activeToasts.delete(toast.id);
      processNextToast();
    }, 300);
  }
}

/**
 * Utility to fade button after showing a message
 */
export function showMessageAndFadeBtn(buttonId, message, delay = 1000) {
  const btn = document.getElementById(buttonId);
  if (!btn) {
    console.error("Button with the specified ID not found.");
    return;
  }

  btn.innerText = message;
  setTimeout(() => {
    btn.style.transition = "opacity 1s";
    btn.style.opacity = 0;
    setTimeout(() => {
      btn.style.display = "none";
    }, 1000);
  }, delay);
}
