(function (G) {
  let canvas, ctx, getLevel;
  let bgDots = [];

  G.initBackground = function (c, context2d, levelGetter) {
    canvas = c; ctx = context2d; getLevel = levelGetter;
    bgDots = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.6,
      s: Math.random() * 20 + 10,
      a: Math.random() * 0.6 + 0.2
    }));
  };

  G.drawBackground = function (dt) {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#0f2027");
    g.addColorStop(0.5, "#203a43");
    g.addColorStop(1, "#2c5364");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const p of bgDots) {
      p.y += (p.s + getLevel() * 6) * dt;
      if (p.y > canvas.height + 5) { p.y = -5; p.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const v = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2.2,
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 1.05
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
})(window.Game = window.Game || {});