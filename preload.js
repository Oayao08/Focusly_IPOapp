'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/* Expose a minimal, typed API to the renderer.
   No raw ipcRenderer access is given to renderer code. */
contextBridge.exposeInMainWorld('flowvityAPI', {

  /* ── Auth ── */
  register:        (d) => ipcRenderer.invoke('auth:register',          d),
  verify:          (d) => ipcRenderer.invoke('auth:verify',            d),
  login:           (d) => ipcRenderer.invoke('auth:login',             d),
  logout:          (d) => ipcRenderer.invoke('auth:logout',            d),
  validateSession: (d) => ipcRenderer.invoke('auth:validate-session',  d),
  resendCode:      (d) => ipcRenderer.invoke('auth:resend-code',       d),

  /* ── Window controls ── */
  window: {
    minimize:    () => ipcRenderer.invoke('win:minimize'),
    maximize:    () => ipcRenderer.invoke('win:maximize'),
    close:       () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:is-maximized'),
    platform:    () => ipcRenderer.invoke('win:platform'),
  },
});
