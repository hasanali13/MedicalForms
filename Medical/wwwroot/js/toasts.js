/*
  toasts.js
  Layout-level toast helper + TempData bootstrap.
*/

(function () {
  window.showToast = function (message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'success');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    var icon = document.createElement('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle text-success';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle text-danger';
    } else {
        icon.className = 'fas fa-info-circle text-info';
    }
    icon.style.fontSize = '18px';
    icon.style.marginRight = '8px';

    var msg = document.createElement('span');
    msg.textContent = message;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-sm btn-light';
    closeBtn.style.marginLeft = 'auto';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'inherit';
    closeBtn.style.cursor = 'pointer';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function () {
      removeToast(toast);
    };

    toast.appendChild(icon);
    toast.appendChild(msg);
    toast.appendChild(closeBtn);

    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      removeToast(toast);
    }, 3000);
  };

  function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 300);
  }

  window.__initTempDataToasts = function (successMsg, errorMsg) {
    if (successMsg) window.showToast(successMsg, 'success');
    if (errorMsg) window.showToast(errorMsg, 'error');
  };
})();
