/* インストールの合図を「いちばん先に」受け取る。
 *
 * Chrome は条件が揃うと即座に beforeinstallprompt を出すため、
 * React やスタイルの読み込みより後に置くと合図を取りこぼし、
 * 通信が遅い校内Wi-Fiで「ホームにいれる」ボタンが出なくなる。
 * index.html の <head> で、ほかの読み込みより前に（defer も async も付けずに）読むこと。
 *
 * 以前は index.html に直接書いていた。CSP（script-src 'self'）を入れるために
 * 外のファイルへ出した。中身は同じ。
 */
window.__deferredInstallPrompt = null;
addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__deferredInstallPrompt = e;
  dispatchEvent(new Event('pwa-installable'));
});
addEventListener('appinstalled', function () {
  window.__deferredInstallPrompt = null;
  dispatchEvent(new Event('pwa-installed'));
});
