// ==UserScript==
// @name            TagPro Flair Trails and Spinner
// @version         0.2.2
// @description     Have sick trails for all your flairs just like the arc reactor. (Without having to level up) But wait there's more. You can also have your flairs spin like the level 4 donor flair absolutely free.
// @match           *://*.koalabeast.com/*
// @author          Pindelta
// @supportURL      https://www.reddit.com/message/compose/?to=Pindelta
// @require      https://greasyfork.org/scripts/371240-TPUL.js
// @namespace       https://github.com/Pindelta/TagPro-Flair-Trails-and-Spinner

// ==/UserScript==

// - v0.2.2: fixed arc reactor flair not showing it's original trail, you don't need to put your display name anymore
// - v0.2.1: changed included domains to *://*.koalabeast.com/*, which should encompass all koalabeast url variations
// - v0.2.0: added https://koalabeast.com* to list of domains, added option to apply spin effect to all balls

// ========= SETTINGS =========
// Set either of these to true to enable the respective effect.
// It looks wonky with both on, so set one to true and the other to false.
// Feel free to do turn em both on tho, it won't break anything(I think)
const spinFlair = true;
const useTrail = false;

// set this to true to add spin effect to everyone's ball
const addSpinToAllBalls = false;
// ========= END OF SETTINGS =========

const customTrailDefinition = {
  acceleration: { x: 0, y: 0 },
  addAtBack: false,
  alpha: { start: 1, end: 0 },
  blendMode: "normal",
  color: { start: "#ffffff", end: "#ffffff" },
  emitterLifetime: -1,
  frequency: 0.001,
  lifetime: { min: 0.25, max: 0.25 },
  maxParticles: 500,
  maxSpeed: 0,
  noRotation: true,
  pos: { x: 0, y: 0 },
  rotationSpeed: { min: 0, max: 0 },
  scale: { start: 1, end: 0.25, minimumScaleMultiplier: 1 },
  spawnType: "point",
  speed: { start: 0, end: 0, minimumSpeedMultiplier: 1 },
  startRotation: { min: 0, max: 0 },
};

/* global tagpro, tagproConfig, $, tpul */

tagpro.ready(function () {
  if (tpul.playerLocation === "game") {
    // Override the drawFlair function
    tagpro.renderer.drawFlair = function (player) {
      const isYourBall = player.id === tagpro.playerId; // check if this is your ball

      player.sprites.flair &&
        player.sprites.flair.flairName !== player.flair &&
        (player.sprites.info.removeChild(player.sprites.flair),
        (player.sprites.flair = null));

      if (player.flair && !player.sprites.flair) {
        var n = "flair-" + player.flair.x + "," + player.flair.y,
          r = tagpro.renderer.getFlairTexture(n, player.flair);
        (player.sprites.flair = new PIXI.Sprite(r)),
          (player.sprites.flair.pivot.x = 8),
          (player.sprites.flair.pivot.y = 8),
          (player.sprites.flair.x = 20),
          (player.sprites.flair.y = -9),
          player.sprites.info.addChild(player.sprites.flair),
          (player.sprites.flair.flairName = player.flair),
          (player.sprites.rotation = 0),
          (player.rotateFlairSpeed = 0);

        const shouldActivateTrail = useTrail && isYourBall; // we should activate the trail if the setting is set to true and this is your ball
        const isArcReactorFlair = player.flair.description === "Arc Reactor";
        if (!tagpro.renderer.options.disableParticles) {
          if (isArcReactorFlair) {
            createPixiEmitter(
              tagpro.renderer.particleTexture,
              tagpro.particleDefinitions.arcReactor,
              player
            );
          } else if (shouldActivateTrail) {
            createPixiEmitter(r, customTrailDefinition, player);
          }
        }
      }

      const shouldActivateSpin = spinFlair && (isYourBall || addSpinToAllBalls);
      if (
        player.sprites.flair &&
        (player.flair.description === "Level 4 Donor" || shouldActivateSpin)
      ) {
        player.lastFrame ||
          (player.lastFrame = { "s-captures": 0, "s-tags": 0 });
        if (
          player.lastFrame["s-captures"] !== player["s-captures"] ||
          player.lastFrame["s-tags"] !== player["s-tags"]
        )
          (player.tween = new Tween(0.4, -0.38, 4e3, "quadOut")),
            (player.rotateFlairSpeed = player.tween.getValue());
        player.rotateFlairSpeed > 0.02 &&
          (player.rotateFlairSpeed = player.tween.getValue()),
          (player.rotateFlairSpeed = Math.max(0.02, player.rotateFlairSpeed)),
          (player.sprites.flair.rotation += player.rotateFlairSpeed),
          (player.lastFrame["s-captures"] = player["s-captures"]),
          (player.lastFrame["s-tags"] = player["s-tags"]);
      }

      !player.flair &&
        player.sprites.flair &&
        player.sprites.info.removeChild(player.sprites.flair);

      if (player.flairEmitter) {
        var s = true && !player.dead,
          o = s;

        (player.flairEmitter.emit = s),
          player.flairEmitter.updateOwnerPos(player.x + 20, player.y - 9),
          o && player.flairEmitter.resetPositionTracking();
      }
    };

    function createPixiEmitter(particleTexture, particleDefinition, player) {
      var i = new PIXI.particles.Emitter(
        tagpro.renderer.layers.midground,
        [particleTexture],
        particleDefinition
      );
      tagpro.renderer.emitters.push(i),
        (player.flairEmitter = i),
        (player.flairEmitter.keep = !0);
    }
  }
});
