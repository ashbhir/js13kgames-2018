let D = document,
    w = window,
    DOM = document.getElementsByClassName("canvas-container")[0],
    VIEW_WIDTH = DOM.clientWidth,
    mobile = window.navigator.userAgent.match(/andro|ipho|ipa|ipo|windows ph/i),
    C, // canvas
    context, // canvas context
    G, // Game
    WS, // WireSet
    GP, // Gun Pointer
    P, // Player
    PS, // PlanetSet
    E, // Enemy
    B, // Bullet
    TB, // TextBox
    PC, // PlayerCount
    HT, // HealthText
    WT, // WinText
    HS, // High Score
    PI = Math.PI,
    CANVAS_WIDTH = (window.innerWidth && window.innerWidth * 3) || 4000,
    CANVAS_HEIGHT = (window.innerHeight && window.innerHeight - 100) || 400,
    PLAYER_WIDTH = 10,
    PLAYER_HEIGHT = 10,
    PLAYER_SPEED = 20,
    ENEMY_WIDTH = 10,
    ENEMY_HEIGHT = 10,
    ENEMY_SPEED = 10,
    POINTER_LENGTH = CANVAS_HEIGHT / 6,
    POINTER_MAX_ANGLE = 160,
    POINTER_MIN_ANGLE = 20,
    PLAYER_GUN_GAP = 0,
    PLANET_WIDTH = Math.max(CANVAS_HEIGHT / 10, 30),
    PLANET_HEIGHT = PLANET_WIDTH,
    PLANET_SPEED = 10,
    BULLET_WIDTH = 40,
    BULLET_HEIGHT = 10,
    BULLET_SPEED = mobile ? 5: 10,
    WINNING_BULLET_SPEED = 30,
    DAMAGE_WIDTH = PLANET_WIDTH / 2,
    DIALOG_WIDTH = (mobile ? 2: 1) * VIEW_WIDTH / 3,
    DIALOG_HEIGHT = 2 * CANVAS_HEIGHT / 3,
    CRISP_TEXT_WIDTH = 200,
    CRISP_TEXT_HEIGHT = 50,
    MAX_BULLETS = 8,
    PLAY_BTN_HEIGHT = 40,
    PLAY_BTN_WIDTH = 120,
    game_started = false,
    game_won = false,
    game_won_scrolled = false,
    game_won_bullets_fired = false,
    skipped = false,
    currentTime = null,
    bestTime = {
        time: 99999999,
        dom: document.getElementsByClassName('best-time__timer')[0]
     }
    ;

// Request animation frame setup
window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame        ||
            window.webkitRequestAnimationFrame  ||
            window.mozRequestAnimationFrame     ||
            function(callback){window.setTimeout(callback, 17);};
})();

let Player_dY = 0,
    lastPlanet = null,
    lastX = 0,
    PrevPlayerY = null;

const jump = jsfxr([0,,0.1948,0.1242,0.3918,0.7943,0.0103,-0.5478,,,,,,0.3884,0.1022,,0.1452,-0.0243,1,,,0.027,,0.5]),
    explosion = jsfxr([3,,0.3197,0.6861,0.154,0.0513,,-0.2049,,,,0.261,0.6416,,,,,,1,,,,,0.5]),
    hit = jsfxr([0,,0.309,,0.1242,0.4867,,0.3666,,,,,,0.2139,,0.4974,,,1,,,,,0.5]),
    message = jsfxr([0,0.0022,0.4543,0.2404,0.8076,0.5005,,,0.5697,,,-0.0109,0.5901,,-0.3525,,0.0004,0.2765,0.9915,0.7359,0.4253,,0.0097,0.26]),
    init = jsfxr([1,,0.2975,,0.4004,0.244,,0.4834,,,,,,,,0.486,,,1,,,,,0.26]),
    winning = jsfxr([3,0.5512,0.0161,0.5228,0.8802,0.0014,,0.362,0.0582,,-0.3579,0.1778,0.4555,0.5,0.992,-0.0377,-0.0339,0.072,0.495,0.0101,0.8163,0.0362,0.3013,0.5]),
    enemyDecay = jsfxr([3,0.03,0.27,0.75,0.76,0.0237,,,,,,,,,,0.5116,,,1,,,,,0.5])
;

const PLANETS = [];

(function planetInitialize() {
    let i = 0;
    const step = mobile ? 80 : 160;
    while (i * (step) < CANVAS_WIDTH) {
        const xPos = Math.min(Math.max(i * (CANVAS_WIDTH / 10), PLANET_WIDTH), CANVAS_WIDTH - PLANET_WIDTH);
        PLANETS.push({
            x: xPos,
            speed: (i % 3) + 1,
            onTop: !!(i % 2),
            movingLeft: Math.random(0,1) > 0.5 ? true: false,
            zone: (xPos < CANVAS_WIDTH / 3) ? 1 : (xPos < 2 * CANVAS_WIDTH / 3 ? 2 : 3)
        });

        if (i * (step * 2) < CANVAS_WIDTH) {
            PLANETS.push({
                x: Math.min(Math.max(Math.floor(i * (4/3) *(CANVAS_WIDTH / 10)), PLANET_WIDTH), CANVAS_WIDTH - PLANET_WIDTH),
                speed: 2.5,
                onTop: !!(i % 2),
                movingLeft: Math.random(0,1) > 0.5 ? true: false,
                zone: 0
            });
        }
        i++;
    }
})();

const Utils = {
    drawLine: function(x1, y1, x2, y2, dashed) {
        context.beginPath();
        context.strokeStyle='white';
        dashed && context.setLineDash([10, 5]);
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    },
    renderOnce: function(cb) {
        context.save();
        cb();
        context.restore();
    },
    isIntersecting: function(rect1X, rect1Y, rect1W, rect1H, rect2X, rect2Y, rect2W, rect2H) {
        const rect1XStart = rect1X - rect1W / 2;
        const rect1XEnd = rect1X + rect1W / 2;
        const rect1YStart = rect1Y - rect1H / 2;
        const rect1YEnd = rect1Y + rect1H / 2;
        const rect2XStart = rect2X - rect2W / 2;
        const rect2XEnd = rect2X + rect2W / 2;
        const rect2YStart = rect2Y - rect2H / 2;
        const rect2YEnd = rect2Y + rect2H / 2;

        return (
            ((rect2XStart < rect1XEnd && rect2XEnd > rect1XStart) && (rect2YStart < rect1YEnd && rect2YEnd > rect1YStart)) || 
            ((rect1XStart < rect2XEnd && rect1XEnd > rect2XStart) && (rect2YStart < rect1YEnd && rect2YEnd > rect1YStart)) ||
            ((rect1XStart < rect2XEnd && rect1XEnd > rect2XStart) && (rect1YStart < rect2YEnd && rect1YEnd > rect2YStart)) ||
            ((rect2XStart < rect1XEnd && rect2XEnd > rect1XStart) && (rect1YStart < rect2YEnd && rect1YEnd > rect2YStart))
        );
        
    },
    calculateDistance: (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },
    isCircleRectangleIntersecting: (cx, cy, r, rect1X, rect1Y, rect1W, rect1H) => {
        const dist = Utils.calculateDistance({x: cx, y: cy}, {x:rect1X, y:rect1Y});
        return dist < r ? true: false;
    },
    scrollIntoView: () => {
        if (game_won) return;
        const currentValue = DOM.scrollLeft;
        const finalValue = Math.max(Math.min(P.x - VIEW_WIDTH / 3, C.width - VIEW_WIDTH), 0);

        if (finalValue > currentValue) {
            const inc = setInterval(() => {
                const currentScroll = DOM.scrollLeft;
                if (currentScroll >= finalValue) {
                    clearInterval(inc);
                    return;
                }
                DOM.scrollLeft = currentScroll + 10;
            }, 10);
        } else {
            const dec = setInterval(() => {
                const currentScroll = DOM.scrollLeft;
                if (currentScroll <= finalValue) {
                    clearInterval(dec);
                    return;
                }
                DOM.scrollLeft = currentScroll - 10;
            }, 10);
        }
    },
    winningScroll: () => {
        const finalValue = CANVAS_WIDTH - VIEW_WIDTH;

        const inc = setInterval(() => {
            const currentScroll = DOM.scrollLeft;
            if (currentScroll >= finalValue) {
                game_won_scrolled = true;
                clearInterval(inc);
                return;
            }
            DOM.scrollLeft = currentScroll + 10;
        }, 10);
    },
    playSound: (sound) => {
        let player = new Audio();
        player.src = sound;
        player.play();
    },
    sleep: async function(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        })
    }
}

function Bullet(x, y, theta, targetPlanet, top) {
    B = this;
    B.x = x;
    B.y = y;
    B.theta = theta;
    B.targetPlanet = targetPlanet;
    B.top = top;

    B.isTravellingUp = () => B.top;

    B.update = () => {
        const radians = (B.theta / 180) * PI;
        const nextX = B.x - BULLET_SPEED * Math.cos(radians);
        const nextY = B.y + (B.isTravellingUp() ? -1 : 1) * BULLET_SPEED * Math.sin(radians);
        
        B.x = nextX;
        B.y = nextY;
    };

    B.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle='orange';
            context.translate(B.x + BULLET_WIDTH / 2, B.y + BULLET_HEIGHT / 2);
            context.rotate((B.isTravellingUp() ? 1 : -1) * PI / 180 * B.theta);
            context.fillRect(-BULLET_WIDTH / 2, -BULLET_HEIGHT / 2, BULLET_WIDTH, BULLET_HEIGHT);
        });
    };
}

function WinningBullet(x, y, theta, top) {
    const B = this;
    B.x = x;
    B.y = y;
    B.theta = theta;
    B.top = top;

    B.isTravellingUp = () => B.top;

    B.update = () => {
        const radians = (B.theta / 180) * PI;
        const nextX = B.x + WINNING_BULLET_SPEED * Math.cos(radians);
        const nextY = B.y + (B.isTravellingUp() ? -1 : 1) * WINNING_BULLET_SPEED * Math.sin(radians);
        
        B.x = nextX;
        B.y = nextY;
    };

    B.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle='orange';
            context.translate(B.x + BULLET_WIDTH / 2, B.y + BULLET_HEIGHT / 2);
            context.rotate((B.isTravellingUp() ? 1 : -1) * PI / 180 * B.theta);
            context.fillRect(-BULLET_WIDTH / 2, -BULLET_HEIGHT / 2, BULLET_WIDTH, BULLET_HEIGHT);
        });
    };
    return B;
}

function Enemy() {
    E = this;
    E.x = C.width - 40;
    E.y = C.height / 2;
    E.theta = 0;
    E.bullet = null;
    
    E.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle='blue';
            context.beginPath();
            
            context.moveTo(C.width, E.y - 15);
            context.lineTo(C.width, E.y + 15);
            context.lineTo(E.x, E.y);
            context.fill();
            if (game_won_bullets_fired) {
                Utils.playSound(enemyDecay);
                E.y++;
            }
        });
        if (game_won) {
            E.bullet = null;
        }
        E.bullet && E.bullet.render();
    }

    E.update = async () => {
        if (lastPlanet && E.bullet == null) {
            const P = Utils.calculateDistance(lastPlanet, {x: lastPlanet.x, y: E.y});
            const H = Utils.calculateDistance(E, lastPlanet);
            const theta = Math.asin(P / H) * 180 / PI; // Sin-1(P/H)
            E.bullet = new Bullet(E.x, C.height / 2, theta, lastPlanet, lastPlanet.y < C.height / 2);
        } else if (E.bullet !== null) {
            E.bullet.update();
            if (E.bullet.x < 0 || E.bullet.x > CANVAS_WIDTH || E.bullet.y > CANVAS_HEIGHT || E.bullet.y < 0) {
                E.bullet = null;
            }
            if (Utils.isCircleRectangleIntersecting(
                E.bullet.targetPlanet.x,
                E.bullet.targetPlanet.y,
                PLANET_WIDTH / 2,
                E.bullet.x,
                E.bullet.y,
                BULLET_WIDTH,
                BULLET_HEIGHT
            )) {
                Utils.playSound(explosion);
                const targetPlanet = E.bullet.targetPlanet;
                targetPlanet.bulletsCount++;
                let bulletsCount = targetPlanet.bulletsCount;
                const HEALTH = Math.floor((MAX_BULLETS - bulletsCount) * 100 / MAX_BULLETS);
                if (HEALTH < 100) {
                    HT = new CrispText();
                    HT.setText(`HEALTH:${HEALTH}/100`,
                        targetPlanet.x + 20, 
                        targetPlanet.y + (targetPlanet.y > C.height / 2 ? -1 : 1) * (PLANET_WIDTH / 2 + 20), 
                        HEALTH > 25 ? 'white': 'red');
                }
                if (targetPlanet.bulletsCount >= MAX_BULLETS) {
                    // destroy Planet
                    console.log('removing planet');
                    G.init();
                    if (targetPlanet.hasPlayer) {
                        // Game Over
                        console.log('Game over!');
                    }
                }
                E.bullet = null;
            }
        }
    }
}

function GunPointer(theta) {
    GP = this;
    GP.theta = theta;

    GP.render = () => {
        if (P.crossing) {
            return;
        }
        const theta = GP.theta;
        const radians = (theta / 180) * PI;
        const x1 = P.x;
        const y1 = P.y;
        const x2 = P.x + POINTER_LENGTH * Math.cos(radians);
        const y2 = P.y + (P.isTop() ? 1 : -1) * POINTER_LENGTH * Math.sin(radians);
        Utils.renderOnce(() => {
            Utils.drawLine(x1, y1, x2, y2, true);
        });
    }
}

function Wire(x1, y1, x2, y2) {
    return {
        x1,
        y1,
        x2,
        y2
    };
}

function WireSet() {
    WS = this;

    WS.attached = [];

    WS.addWire = function(x1, y1, x2, y2) {
        WS.attached.push(new Wire(
            x1,
            y1,
            x2,
            y2
        ));
    }

    WS.render = () => {

        WS.attached.forEach(wire => {
            Utils.renderOnce(() => {
                Utils.drawLine(
                    wire.x1,
                    wire.y1,
                    wire.x2,
                    wire.y2,
                    false
                );
            });
        });
    }

}

function WireHolder(x, y) {
    return {
        x,
        y
    };
}

function Planet(x, y, speed, movingLeft, zone) {
    return {
        x,
        y,
        speed,
        movingLeft,
        zone,
        isMoving: true,
        hasPlayer: false,
        wireHolders: [],
        bullet: null,
        bulletsCount: 0
    };
}

function PlanetSet() {
    PS = this;
    PS.attached = [];

    PS.addPlanet = (x, speed, onTop, movingLeft, zone) => {
        onTop ? 
            PS.attached.push(new Planet(x, PLANET_HEIGHT / 2, speed, movingLeft, zone)) :
            PS.attached.push(new Planet(x, C.height - PLANET_HEIGHT / 2, speed, movingLeft, zone));
    }

    PS.intersects = (planetPrev, planetNext) => {
        return planetPrev ? 
                Utils.isIntersecting(
                    planetPrev.x,
                    planetPrev.y,
                    PLANET_WIDTH,
                    PLANET_HEIGHT,
                    planetNext.x,
                    planetNext.y,
                    PLANET_WIDTH,
                    PLANET_HEIGHT,
                ) : false;
    }

    PS.isPlayerIntersecting = (planetArr) => {
        let intersectingPlanet = null;
        planetArr.some((planet) => {
            if (Utils.isCircleRectangleIntersecting(
                    planet.x,
                    planet.y,
                    PLANET_WIDTH / 2,
                    P.x,
                    P.y,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT)
                ) {
                intersectingPlanet = planet;
                return true;
            }
            return false;
        });
        return intersectingPlanet;
    }

    PS.renderFirstPlanet = () => {
        Utils.renderOnce(() => {
            context.fillStyle = `hsla(120, 100%, 50%, 1)`;
            context.beginPath();
            context.arc(PLANET_WIDTH / 2, C.height / 2, PLANET_WIDTH / 2, 0, 10);
            context.fill();
        });
    }

    PS.render = () => {
        PS.renderFirstPlanet();
        PS.attached.forEach((planet, index) => {
            Utils.renderOnce(() => {
                if (planet.isMoving) {
                    context.fillStyle = `hsla(0, 0%, 50%, 1)`;
                    context.beginPath();
                    context.arc(planet.x, planet.y, PLANET_WIDTH / 2, 0, 10);
                    context.fill();
                } else {
                    let g = context.createRadialGradient(planet.x, planet.y, PLANET_WIDTH / 8, planet.x, planet.y, PLANET_WIDTH);
                    g.addColorStop(0, `hsla(${index*20}, 100%, 50%, 1)`);
                    g.addColorStop(1, `hsla(0, 100%, 100%, 0.5)`)
                    context.fillStyle = g;
                    context.beginPath();
                    context.arc(planet.x, planet.y, PLANET_WIDTH / 2, 0, 10);
                    context.fill();

                    let bulletsCount = planet.bulletsCount;
                    
                    const coords = [
                        { x: planet.x + PLANET_WIDTH / 2 - DAMAGE_WIDTH / 2, y: planet.y },
                        { x: planet.x, y: planet.y + PLANET_HEIGHT / 2 - DAMAGE_WIDTH / 2},
                        { x: planet.x - PLANET_WIDTH / 2 + DAMAGE_WIDTH / 2, y: planet.y },
                        { x: planet.x, y: planet.y - PLANET_HEIGHT / 2 + DAMAGE_WIDTH / 2},
                    ];
                    let i = 0, coord = null;
                    while (bulletsCount) {
                        coord = coords[i % 4];
                        context.fillStyle = 'hsla(0, 0%, 50%, 0.5)';
                        
                        context.beginPath();
                        context.arc(coord.x, coord.y, DAMAGE_WIDTH / 2, 0, 10);
                        context.fill();
                        bulletsCount--;
                        i++;
                    }
                    
                }
 
                context.fillStyle='black';
                context.font='20px sans-serif';
                context.fillText(index, planet.x, planet.y);
            });

            Utils.renderOnce(() => {
                // Check for Wire Holders
                planet.wireHolders.forEach((wireHolder) => {
                    context.fillStyle = 'white';
                    context.beginPath();
                    context.arc(wireHolder.x, wireHolder.y, 3, 0, 10);
                    context.fill();
                });
            });

            planet.bullet && planet.bullet.render();
        });
    }

    PS.update = () => {
        let prevPlanet = null;
        PS.attached.forEach((planet, index) => {
            if (planet.isMoving) {
                const prevX = planet.x;
                planet.x = planet.x + (planet.movingLeft ? -1 : 1) * planet.speed;

                if (planet.zone === 1) {
                    const lowerX = 0;
                    const upperX = CANVAS_WIDTH / 3;
                    if (planet.x < lowerX || planet.x > upperX) {
                        planet.movingLeft = !planet.movingLeft;
                        planet.x = prevX;
                    }

                } else if (planet.zone === 2) {
                    const lowerX = CANVAS_WIDTH / 3;
                    const upperX = 2 * CANVAS_WIDTH / 3;
                    if (planet.x < lowerX || planet.x > upperX) {
                        planet.movingLeft = !planet.movingLeft;
                        planet.x = prevX;
                    }
                    
                } else if (planet.zone === 3) {
                    const lowerX = 2 * CANVAS_WIDTH / 3;
                    const upperX = CANVAS_WIDTH;
                    if (planet.x < lowerX || planet.x > upperX) {
                        planet.movingLeft = !planet.movingLeft;
                        planet.x = prevX;
                    }

                } else if (planet.x < 0 || planet.x > C.width) {
                    planet.movingLeft = !planet.movingLeft;
                    planet.x = prevX;
                }
            }

            prevPlanet = planet;

            if (game_won_scrolled && planet.bullet == null) {
                const P = Utils.calculateDistance(E, {x: E.x, y: planet.y});
                const H = Utils.calculateDistance(E, planet);
                const theta = Math.asin(P / H) * 180 / PI; // Sin-1(P/H)
                planet.bullet = new WinningBullet(planet.x, planet.y, theta, lastPlanet.y > C.height / 2);
            } else if (planet.bullet !== null) {
                planet.bullet.update();
                if (Utils.isCircleRectangleIntersecting(
                    E.x,
                    E.y,
                    ENEMY_WIDTH / 2,
                    planet.bullet.x,
                    planet.bullet.y,
                    BULLET_WIDTH,
                    BULLET_HEIGHT
                )) {
                    Utils.playSound(explosion);
                    planet.bullet = null;
                }
            }
        });
        prevPlanet = null
    }
}

function Player(x, y) {
    P = this;

    P.x = x;
    P.y = y;
    P.top = 1;
    P.crossingStart = {
        x,
        y
    };
    P.crossing = false;

    P.setCoords = (x, y) => {
        P.x = x;
        P.y = y;
    }

    P.isTop = () => P.top;

    P.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle='red';
            context.fillRect(P.x - PLAYER_WIDTH / 2, P.y - PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);
        });
        Utils.renderOnce(() => {
            Utils.drawLine(P.crossingStart.x, P.crossingStart.y, P.x, P.y, true);
        });
    }

    P.update = () => {
        if (P.crossing) {
            const theta = GP.theta;
            const radians = (theta / 180) * PI;
            const nextX = P.x + PLAYER_SPEED * Math.cos(radians);
            const nextY = P.y + (P.isTop() ? 1 : -1) * PLAYER_SPEED * Math.sin(radians);
            
            P.setCoords(nextX, nextY);

            const PLAYER_MAX_Y = C.height - PLANET_HEIGHT - PLAYER_HEIGHT / 2;
            const PLAYER_MIN_Y = PLANET_HEIGHT + PLAYER_HEIGHT / 2;
            let intersectingPlanet = null;
            
            if (P.y > C.height) {
                // Game over
                P.x = P.crossingStart.x;
                P.y = P.crossingStart.y;
                P.crossing = false;
            } else if (Player_dY > 0 && P.y > PLAYER_MAX_Y) {
                const inLowerHalf = (planet) => planet.y > C.height / 2;
                if (intersectingPlanet = PS.isPlayerIntersecting(PS.attached.filter(inLowerHalf))) {
                    Utils.playSound(hit);
                    if (intersectingPlanet.isMoving) {
                        PC.meta.connectedPlanets++;
                        PC.setText(`${PC.meta.connectedPlanets}/${PC.meta.totalPlanets} planets online`, P.x + VIEW_WIDTH / 3, C.height / 2);
                        if (PC.meta.connectedPlanets === PC.meta.totalPlanets) {
                            console.log('win!');
                            game_won = true;
                            Utils.playSound(winning);
                            Utils.winningScroll();
                        }
                    }
                    if (lastPlanet) lastPlanet.hasPlayer = false;
                    intersectingPlanet.hasPlayer = true;
                    intersectingPlanet.isMoving = false;
                    intersectingPlanet.wireHolders.push({x: P.x, y: P.y});
                    lastPlanet = intersectingPlanet;
                    P.setCoords(P.x, P.y);
                    P.crossing = false;
                    P.top = 0;
                    WS.addWire(
                        P.crossingStart.x,
                        P.crossingStart.y,
                        P.x,
                        P.y
                    );
                    P.crossingStart = {
                        x: P.x,
                        y: P.y
                    };
                    Utils.scrollIntoView();
                } 
            } else if (P.y < 0) {
                // Game over
                P.x = P.crossingStart.x;
                P.y = P.crossingStart.y;
                P.crossing = false;
            } else if (Player_dY < 0 && P.y < PLAYER_MIN_Y) {
                const inUpperHalf = (planet) => planet.y < C.height / 2;
                if (intersectingPlanet = PS.isPlayerIntersecting(PS.attached.filter(inUpperHalf))) {
                    // Using P.x doesn't cause the issue of showing some weird X position where objects meet
                    // At the same time it does cause that slip on intersection
                    Utils.playSound(hit);
                    if (intersectingPlanet.isMoving) {
                        PC.meta.connectedPlanets++;
                        PC.setText(`${PC.meta.connectedPlanets}/${PC.meta.totalPlanets} planets online`, P.x + VIEW_WIDTH / 3, C.height / 2);
                        if (PC.meta.connectedPlanets === PC.meta.totalPlanets) {
                            console.log('win!');
                            game_won = true;
                            Utils.playSound(winning);
                            Utils.winningScroll();
                        }
                    }
                    if (lastPlanet) lastPlanet.hasPlayer = false;
                    intersectingPlanet.hasPlayer = true;
                    intersectingPlanet.isMoving = false;
                    intersectingPlanet.wireHolders.push({x: P.x, y: P.y});
                    lastPlanet = intersectingPlanet;
                    P.setCoords(P.x, P.y);
                    P.crossing = false;
                    P.top = 1;
                    WS.addWire(
                        P.crossingStart.x,
                        P.crossingStart.y,
                        P.x,
                        P.y
                    );
                    P.crossingStart = {
                        x: P.x,
                        y: P.y
                    };
                    Utils.scrollIntoView();
                }
            }
        }
    }
}

function CrispText(x, y, bordered) {
    const CT = {};
    CT.x = x;
    CT.y = y;
    CT.text = '';
    CT.renderCount = 0;
    CT.bordered = bordered;
    CT.meta = {};
    CT.setText = (text, x, y, color) => {
        CT.text = text;
        CT.renderCount = 200;
        CT.x = Math.min(Math.max(x, CRISP_TEXT_WIDTH / 2), C.width - CRISP_TEXT_WIDTH);
        CT.y = y;
        CT.color = color;
    }
    CT.render = () => {
        if (CT.renderCount > 0) {
            Utils.renderOnce(() => {
                if (CT.bordered) {
                    context.strokeStyle='white';
                    context.strokeRect(CT.x - CRISP_TEXT_WIDTH / 2, CT.y - CRISP_TEXT_HEIGHT / 2, CRISP_TEXT_WIDTH, CRISP_TEXT_HEIGHT);
                }
                context.fillStyle = CT.color || '#ecf0f1';
                context.textAlign = 'left';
                context.font = '14px sans-serif';       
                context.fillText(CT.text, CT.x - CRISP_TEXT_WIDTH / 2 + 10, CT.y);
            });
            CT.renderCount--;
        }
    }
    return CT;
}

function TextBox() {
    TB = this;
    TB.textArr = [];

    TB.newMessage = async function(text) {

        context.save();
        
        let translations = 0;

        context.fillStyle = '#ecf0f1';
        context.textAlign = 'left';
        context.font = mobile ? '10px sans-serif': '14px sans-serif';

        function waitForTranslateLoop() {
            return new Promise((resolve) => {
                const translateLoop = setInterval(() => {
                    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                    // draw skip button
                    context.strokeStyle='white';
                    context.strokeRect(VIEW_WIDTH / 2 - PLAY_BTN_WIDTH / 2, C.height - PLAY_BTN_HEIGHT - 10, PLAY_BTN_WIDTH, PLAY_BTN_HEIGHT);
                    context.fillText('SKIP >', VIEW_WIDTH / 2 - PLAY_BTN_WIDTH / 2 + 10, C.height - PLAY_BTN_HEIGHT + 5);
    
                    context.strokeStyle='white';
                    context.strokeRect(VIEW_WIDTH / 2 - DIALOG_WIDTH / 2, C.height / 2 - DIALOG_HEIGHT / 2, DIALOG_WIDTH, DIALOG_HEIGHT);
                    
                    TB.textArr.forEach((textMsg) => {
                        const textY = C.height / 2 + DIALOG_HEIGHT / 2 - textMsg.translateY - 10;
                        const textX = VIEW_WIDTH / 2 - DIALOG_WIDTH / 2 + 10;
                        context.fillText(textMsg.text, textX, textY);
                        textMsg.translateY += translations;
                    });
                    translations++;
                    if (translations > 8) {
                        clearInterval(translateLoop);
                        resolve();
                    }
                }, 30);
            });
        }

        await waitForTranslateLoop();

        Utils.playSound(message);
        const textY = C.height / 2 + DIALOG_HEIGHT / 2 - 10;
        const textX = VIEW_WIDTH / 2 - DIALOG_WIDTH / 2 + 10;
        context.fillText(text, textX, textY);

        await Utils.sleep(2000);
        TB.textArr.push({
            text,
            translateY: 0
        });

        context.restore();
        
    }
}

function Time() {
    const T = this;
    T.time = 0;
    document.getElementsByClassName('current-time')[0].classList.remove('hidden');
    document.getElementsByClassName('best-time')[0].classList.remove('hidden');
    T.dom = document.getElementsByClassName('current-time__timer')[0];
    T.dom.innerText = '00:00',
    T.reset = () => {
        T.time = 0;
        T.dom.innerText = '00:00';
    },
    T.increment = () => {
        T.time++;
        T.dom.innerText = T.convertToText(T.time);
    },
    T.convertToText = (time) => {
        const min = T.pad(String(Math.floor(time / 60)));
        const sec = T.pad(String(time % 60));
        return `${min}:${sec}`;
    },
    T.pad = (timeStr) => {
        if (timeStr.length === 1) {
            return `0${timeStr[0]}`;
        }
        return timeStr;
    }
}

function Game() {

    G = this;

    currentTime = new Time();
    setInterval(() => {
        currentTime.increment();
    }, 1000);

    G.init = () => {
        Utils.playSound(init);
        currentTime.reset();
        DOM.scrollLeft = 0;
        Player_dY = 0;
        lastPlanet = null;
        lastX = 0;
        PrevPlayerY = null;
        G = this;
        P = new Player(PLANET_WIDTH, C.height / 2);
        GP = new GunPointer(30);
        WS = new WireSet();
        PS = new PlanetSet();
        E = new Enemy();
        TB = new TextBox();
        PC = new CrispText(P.x + VIEW_WIDTH / 3, C.height / 2, true);
        PC.meta.connectedPlanets = 0;
        PC.meta.totalPlanets = PLANETS.length;
        PLANETS.forEach((planet) => {
            PS.addPlanet(planet.x, planet.speed, planet.onTop, planet.movingLeft, planet.zone);
        });
        game_won_scrolled = false;
        game_won = false;
        game_won_bullets_fired = false;
    };

    G.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle = 'black';
            context.fillRect(0, 0, C.width, C.height);
        });
        PS.render();
        WS.render();
        GP.render();
        P.render();
        E.render();
        PC.render();
        HT && HT.render();
        HS && HS.render();
        WT && WT.render();
    }

    G.update = () => {
        PS.update();
        P.update();
        E.update();
        if (game_won_scrolled) {
            game_won_scrolled = false;
            WT = new CrispText(CANVAS_WIDTH - 100, CANVAS_HEIGHT / 3, true);
            WT.setText('@all: Let\'s kill the beast', CANVAS_WIDTH - 100, CANVAS_HEIGHT / 3);
            // fire the bullets
            setTimeout(() => {
                game_won_bullets_fired = true;
                if (currentTime.time < bestTime.time) {
                    bestTime.time = currentTime.time;
                    bestTime.dom.innerText = currentTime.dom.innerText;
                    HS = new CrispText(CANVAS_WIDTH - 100, 2 * CANVAS_HEIGHT / 3, false);
                    HS.setText('Congrats! High Score achieved!', CANVAS_WIDTH - 100, 2 * CANVAS_HEIGHT / 3);
                }
                setTimeout(() => {
                    G.init();
                }, 2000);
            }, 2000);
        }
    }

    G.clear = () => {
        context.clearRect(0, 0, C.width, C.height);
    }

    G.deltaPlayerY = () => {
        if (PrevPlayerY) {
            Player_dY = P.y - PrevPlayerY;
        }
        PrevPlayerY = P.y;
    }

    const gameLoop = () => requestAnimationFrame(() => {
        G.clear();
        G.deltaPlayerY();
        G.update();
        G.render();
        gameLoop();
    });

    G.init();
    gameLoop();
    
}

onload = async function() {
    C = D.querySelector('#canvas');
    C.width = CANVAS_WIDTH;
    C.height = CANVAS_HEIGHT;
    context = C.getContext('2d');

    context.fillStyle = 'white';
    context.textAlign = 'left';
    context.font = mobile ? '12px Courier New' : '18px Courier New';
    
    context.fillText('Together Again', VIEW_WIDTH / 3 - 100, C.height / 2);
    context.strokeStyle='white';
    context.strokeRect(2 * VIEW_WIDTH / 3 - PLAY_BTN_WIDTH / 2, C.height / 2 - PLAY_BTN_HEIGHT / 2, PLAY_BTN_WIDTH, PLAY_BTN_HEIGHT);
    
    context.fillText('Play', 2 * VIEW_WIDTH / 3 - PLAY_BTN_WIDTH / 2 + 10, C.height / 2);
}

const checkIfSkipped = function(evt) {
    const targetX = evt.x || (evt.touches && evt.touches[0] && evt.touches[0].clientX);
    const targetY = evt.y || (evt.touches && evt.touches[0] && evt.touches[0].clientY);

    console.log(targetX, VIEW_WIDTH / 2);
    console.log(targetY, C.height - 100);

    if (targetX > VIEW_WIDTH / 2 - PLAY_BTN_WIDTH / 2 && targetX < VIEW_WIDTH / 2 + PLAY_BTN_WIDTH / 2 && 
        targetY > CANVAS_HEIGHT - PLAY_BTN_HEIGHT - 10 && targetY < CANVAS_HEIGHT + PLAY_BTN_HEIGHT - 10) {
        skipped = true;
        // only touchend event is required for mobile gameplay
        window.removeEventListener("touchstart", handleClick, true);
        setTimeout(() => {
            window.addEventListener("touchend", handleClick, true);
        }, 100);
        new Game();
    }
}

const checkPlayButtonClicked = async function(evt) {

    const targetX = evt.x || (evt.touches && evt.touches[0] && evt.touches[0].clientX);
    const targetY = evt.y || (evt.touches && evt.touches[0] && evt.touches[0].clientY);

    if (targetX > 2 * VIEW_WIDTH / 3 - PLAY_BTN_WIDTH / 2 && targetX < 2 * VIEW_WIDTH / 3 + PLAY_BTN_WIDTH / 2 && 
        targetY > C.height / 2 - PLAY_BTN_HEIGHT / 2 && targetY < C.height / 2 + PLAY_BTN_HEIGHT / 2) {

        game_started = true;
        context.clearRect(0, 0, C.width, C.height);

        let text = new TextBox();

        !skipped && await text.newMessage('Little Nobi: Hello, is anyone online ?');
        !skipped && await text.newMessage('0 / 29 planets online');
        !skipped && await text.newMessage('Oh no, looks like..');
        !skipped && await text.newMessage('Tadka, the alien spaceship');
        !skipped && await text.newMessage('has destroyed the connectivity of all the planets.');
        
        !skipped && await text.newMessage('I have to re-connect the world');
        !skipped && await text.newMessage('through my special wires..');
        !skipped && await text.newMessage('Only when we are Together Again');
        !skipped && await text.newMessage('is when Tadka will be destroyed !');
        !skipped && await text.newMessage('Let\'s go .!');

        !skipped && setTimeout(() => {
            // only touchend event is required for mobile gameplay
            window.removeEventListener("touchstart", handleClick, true);
            window.addEventListener("touchend", handleClick, true);
            new Game();
        }, 2000);
    }
}

const handleMovement = (evt) => {
    const posX = evt.clientX || (evt.targetTouches && evt.targetTouches[0].clientX);
    const movementX = posX - lastX;
    lastX = posX;
    if (P && !P.crossing) {
        GP.theta = Math.min(POINTER_MAX_ANGLE, Math.max(POINTER_MIN_ANGLE, GP.theta - movementX));
    }
}

const handleClick = (evt) => {
    if (!game_started) {
        checkPlayButtonClicked(evt);
        return;
    }
    if (!P && !skipped) {
        checkIfSkipped(evt);
        return;
    }
    
    if (P && P.crossing) {
        return;
    }
    Utils.playSound(jump);
    if (P) {
        P.crossing = true;
        WS.addWire(
            P.crossingStart.x,
            P.crossingStart.y,
            P.x,
            P.y
        );
        P.crossingStart = {
            x: P.x,
            y: P.y
        };
    }
    
}

if (mobile) {
    window.addEventListener("touchmove", handleMovement, true);
    window.addEventListener("touchstart", handleClick, true);
} else {
    window.addEventListener("mousemove", handleMovement, true);
    window.addEventListener("click", handleClick, true)
}
