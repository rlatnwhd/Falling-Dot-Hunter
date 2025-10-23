(function (G) {
  let ctx;
  const effects = [];

  G.initEffects = function (c, context2d) {
    ctx = context2d;
  };

  G.spawnEffect = function (x, y, color) {
    effects.push({ x, y, radius: 8, alpha: 1, color });
  };

  G.updateEffects = function (dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.radius += 120 * dt;
      e.alpha -= 2 * dt;
      if (e.alpha <= 0) { effects.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.alpha);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };
})(window.Game = window.Game || {});