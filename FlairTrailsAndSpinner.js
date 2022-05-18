// ==UserScript==
// @name            TagPro Flair Trails and Spin
// @version         0.3.0
// @description     Have sick trails for all your flairs just like the arc reactor. (Without having to level up) But wait there's more. You can also have your flairs spin like the level 4 donor flair absolutely free.
// @match           *://*.koalabeast.com/*
// @author          Pindelta
// @supportURL      https://www.reddit.com/message/compose/?to=Pindelta
// @require         https://greasyfork.org/scripts/371240-TPUL.js
// @namespace       https://github.com/Pindelta/TagPro-Flair-Trails-and-Spin

// ==/UserScript==

// - v0.3.0: added settings menu in the in-game settings
// - v0.2.2: fixed arc reactor flair not showing it's original trail, you don't need to put your display name anymore
// - v0.2.1: changed included domains to *://*.koalabeast.com/*, which should encompass all koalabeast url variations
// - v0.2.0: added https://koalabeast.com* to list of domains, added option to apply spin effect to all balls

// ========= SETTINGS =========
// All settings can be configured from the settings in TagPro!

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
  if (tpul.playerLocation == "profile") {
    $("#settings, .card:first").before(
      '<div id=flair-trail-and-spin-select class="profile-settings block"><h3 class=header-title>Flair Trail and Spin</h3><form class=form-horizontal><div class=form-group></div><hr><div id=save-group class=form-group>'
    );

    $("#flair-trail-and-spin-select .form-group:first").before(
      '<label class="col-sm-4 control-label">Effects</label><div class="col-sm-8" style="margin-bottom: 15px"><div class="checkbox"><label for="spin"><input id="spin" name="spin" type="checkbox" checked="">Enable Flair Spin</label></div><div class="checkbox"><label for="trail"><input id="trail" name="trail" type="checkbox" checked="">Enable Flair Trail</label></div></div><label class="col-sm-4 control-label">Apply Effects To All Players</label><div class="col-sm-8"><div class="checkbox"><label for="spinToAll"><input id="spinToAll" name="spinToAll" type="checkbox" checked="">Flair Spin</label></div></div>'
    );

    $("#flair-trail-and-spin-select")
      .find("input")
      .each(function () {
        var name = $(this).prop("name");
        $(this).prop("checked", $.cookie(name) == "true");
      })
      .prop("disabled", false);

    $("#save-group").append(
      '<div class="col-sm-12 text-right"><div id=script-status style="display: none;">Settings saved!</div><button id="scriptScriptSettings" class="btn" type="button">Save Script Settings'
    );
    $("#script-status").css("margin-bottom", "20px");

    $("#save-group button").click(function () {
      // Get the current selection

      var settings = $("#settings .js-cookie:checked")
        .map(function (i, setting) {
          $(setting).data("setting");
        })
        .get();

      // Save to the cookies

      $("#flair-trail-and-spin-select")
        .find("input")
        .each(function () {
          var name = $(this).prop("name"),
            checked = $(this).prop("checked");
          $.cookie(name, checked, {
            expires: 36500,
            path: "/",
            domain: tagproConfig.cookieHost,
          });
        });

      // Show some feedback

      $("#script-status").slideDown();
      setTimeout(function () {
        $("#script-status").slideUp();
      }, 3e3);
    });
  }

  if (tpul.playerLocation === "game") {
    const spinFlair = $.cookie("spin") ? $.cookie("spin") : false;
    const useTrail = $.cookie("trail") ? $.cookie("trail") : false;
    const addSpinToAllBalls = $.cookie("spinToAll")
      ? $.cookie("spinToAll")
      : false;

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
