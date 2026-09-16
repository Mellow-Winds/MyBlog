window.MyBlogFooter = (() => {
  function updateDate() {
    const node = document.querySelector('[data-site-date]');
    if (!node || document.hidden) return;
    const date = window.MyBlogBackground.getDate();
    const formatted = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.date).padStart(2, '0')}`;
    if (node.dateTime === formatted) return;
    node.dateTime = formatted;
    node.textContent = formatted;
    document.querySelector('[data-copyright-year]').textContent = date.year;
  }
  document.addEventListener('visibilitychange', updateDate);
  window.addEventListener('pageshow', updateDate);
  setInterval(updateDate, 1000);
  return { updateDate };
})();
