let D = document,
    w = window,
    DOM = document.getElementsByClassName("canvas-container")[0],
    VIEW_WIDTH = DOM.clientWidth,
    C, // canvas
    context, // canvas context
    G, // Game
    WS, // WireSet
    GP, // Gun Pointer
    P, // Player
    PS, // PlanetSet
    E, // Enemy
    B, // Bullet
    PI = Math.PI,
    CANVAS_WIDTH = 4000,
    CANVAS_HEIGHT = 400,
    PLAYER_WIDTH = 10,
    PLAYER_HEIGHT = 10,
    PLAYER_SPEED = 20,
    ENEMY_WIDTH = 10,
    ENEMY_HEIGHT = 10,
    ENEMY_SPEED = 10,
    POINTER_LENGTH = 60,
    POINTER_MAX_ANGLE = 160,
    POINTER_MIN_ANGLE = 20,
    PLAYER_GUN_GAP = 0,
    PLANET_WIDTH = 40,
    PLANET_HEIGHT = 40,
    PLANET_SPEED = 10,
    BULLET_WIDTH = 40,
    BULLET_HEIGHT = 10,
    BULLET_SPEED = 10
    ;

let Player_dY = 0,
    lastPlanet = null;


const PLANETS = [
    {x: 80, speed: 2, vertical: 't', horizontalDir: 'r'},
    {x: 80*4, speed: 3, vertical: 'b', horizontalDir: 'r'},
    {x: 120*4, speed: 3, vertical: 't', horizontalDir: 'l'},
    {x: 160*4, speed: 1, vertical: 'b', horizontalDir: 'l'},
    {x: 200*4, speed: 1, vertical: 't', horizontalDir: 'r'},
    {x: 240*4, speed: 3, vertical: 'b', horizontalDir: 'r'},
    {x: 280*4, speed: 3, vertical: 't', horizontalDir: 'l'},
    {x: 320*4, speed: 1, vertical: 'b', horizontalDir: 'l'},
    {x: 360*4, speed: 1, vertical: 't', horizontalDir: 'r'},
    {x: 80, speed: 2, vertical: 't', horizontalDir: 'r'},
    {x: 80*6, speed: 3, vertical: 'b', horizontalDir: 'r'},
    {x: 120*6, speed: 3, vertical: 't', horizontalDir: 'l'},
    {x: 160*6, speed: 1, vertical: 'b', horizontalDir: 'l'},
    {x: 200*6, speed: 1, vertical: 't', horizontalDir: 'r'},
    {x: 240*6, speed: 3, vertical: 'b', horizontalDir: 'r'},
    {x: 280*6, speed: 3, vertical: 't', horizontalDir: 'l'},
    {x: 320*6, speed: 1, vertical: 'b', horizontalDir: 'l'},
    {x: 360*6, speed: 1, vertical: 't', horizontalDir: 'r'},
    {x: 80, speed: 2, vertical: 't', horizontalDir: 'r'},
    {x: 80*8, speed: 3, vertical: 'b', horizontalDir: 'r'},
    {x: 120*8, speed: 3, vertical: 't', horizontalDir: 'l'},
    {x: 160*8, speed: 1, vertical: 'b', horizontalDir: 'l'},
    {x: 200*8, speed: 1, vertical: 't', horizontalDir: 'r'},
    {x: 240*8, speed: 3, vertical: 'b', horizontalDir: 'r'},
    {x: 280*8, speed: 3, vertical: 't', horizontalDir: 'l'},
    {x: 320*8, speed: 1, vertical: 'b', horizontalDir: 'l'},
    {x: 360*8, speed: 1, vertical: 't', horizontalDir: 'r'},
]

const Utils = {
    drawLine: (x1, y1, x2, y2, dashed) => {
        context.beginPath();
        context.strokeStyle='white';
        dashed && context.setLineDash([10, 5]);
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    },
    renderOnce: (cb) => {
        context.save();
        cb();
        context.restore();
    },
    isIntersecting: (rect1X, rect1Y, rect1W, rect1H, rect2X, rect2Y, rect2W, rect2H) => {
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

function Enemy() {
    E = this;
    E.x = C.width - 40;
    // E.x = 280;
    E.y = C.height / 2;
    E.theta = 0;
    E.bullet = null;
    // bullets throw at the Player with constant speed
    // PRO TIP: You can short circuit the enemy too
    E.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle='blue';
            context.beginPath();
            
            context.moveTo(C.width, E.y - 15);
            context.lineTo(C.width, E.y + 15);
            context.lineTo(E.x, C.height / 2);
            // context.moveTo(300, E.y - 15);
            // context.lineTo(300, E.y + 15);
            // context.lineTo(280, C.height / 2);
            context.fill();
        });
        E.bullet && E.bullet.render();
    }

    E.update = () => {
        if (lastPlanet && E.bullet == null) {
            const P = Utils.calculateDistance(lastPlanet, {x: lastPlanet.x, y: E.y});
            const H = Utils.calculateDistance(E, lastPlanet);
            const theta = Math.asin(P / H) * 180 / PI; // Sin-1(P/H)
            E.bullet = new Bullet(E.x, C.height / 2, theta, lastPlanet, lastPlanet.y < C.height / 2);
        } else if (E.bullet !== null) {
            E.bullet.update();
            if (Utils.isCircleRectangleIntersecting(
                E.bullet.targetPlanet.x,
                E.bullet.targetPlanet.y,
                PLANET_WIDTH / 2,
                E.bullet.x,
                E.bullet.y,
                BULLET_WIDTH,
                BULLET_HEIGHT
            )) {
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
        //const y1 = P.y + (P.isTop() ? 1 : -1) * (PLAYER_HEIGHT / 2) + (P.isTop() ? 1 : -1) * PLAYER_GUN_GAP;
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

function Planet(x, y, speed, dir) {
    return {
        x,
        y,
        speed,
        dir,
        isMoving: true,
        hasPlayer: false,
        wireHolders: []
    };
}

function PlanetSet() {
    PS = this;
    PS.attached = {
        top: [],
        bottom: []
    };

    PS.addPlanet = (x, speed, vertical, horizontalDir) => {
        vertical === 't' ? 
            PS.attached.top.push(new Planet(x, PLANET_HEIGHT / 2, speed, horizontalDir)) :
            PS.attached.bottom.push(new Planet(x, C.height - PLANET_HEIGHT / 2, speed, horizontalDir));
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

    PS.attachPlayerIfIntersecting = (planetArr) => {
        return planetArr.some((planet) => {
            if (Utils.isCircleRectangleIntersecting(
                    planet.x,
                    planet.y,
                    PLANET_WIDTH / 2,
                    P.x,
                    P.y,
                    PLAYER_WIDTH,
                    PLAYER_HEIGHT)
                ) {
                planet.hasPlayer = true;
                planet.isMoving = false;
                planet.wireHolders.push({x: P.x, y: P.y});
                lastPlanet = planet;
                return true;
            }
            planet.hasPlayer = false;
            return false;
        });
    }

    PS.render = () => {
        for (dir in PS.attached) {
            PS.attached[dir].forEach((planet, index) => {
                Utils.renderOnce(() => {
                    if (planet.isMoving) {
                        context.fillStyle = `hsla(0, 0%, 50%, 1)`;
                    } else {
                        let g = context.createRadialGradient(planet.x, planet.y, PLANET_WIDTH / 8, planet.x, planet.y, PLANET_WIDTH);
                        g.addColorStop(0, `hsla(${index*20}, 100%, 50%, 1)`);
                        g.addColorStop(1, `hsla(0, 100%, 100%, 0.5)`)
                        context.fillStyle = g;
                    }
                    context.beginPath();
                    context.arc(planet.x, planet.y, PLANET_WIDTH / 2, 0, 10);
                    context.fill();
                    
                    // context.fillRect(
                    //     planet.x - PLANET_WIDTH / 2,
                    //     planet.y - PLANET_HEIGHT / 2,
                    //     PLANET_WIDTH,
                    //     PLANET_HEIGHT
                    // );
                    // context.fillStyle='black';
                    // context.font='20px sans-serif';
                    // context.fillText(index, planet.x, planet.y);
                });

                Utils.renderOnce(() => {
                    // Check for Wire Holders
                    planet.wireHolders.forEach((wireHolder) => {
                        context.fillStyle = 'white';
                        context.beginPath();
                        context.arc(wireHolder.x, wireHolder.y, 3, 0, 10);
                        context.fill();
                    });
                })
            });
        }
    }

    PS.update = () => {
        let prevPlanet = null;
        for (dir in PS.attached) {
            PS.attached[dir].forEach(planet => {
                if (planet.isMoving) {
                    planet.x = planet.x + (planet.dir==='l'? -1 : 1) * planet.speed;
    
                    if (PS.intersects(prevPlanet, planet)) {
                        planet.dir = planet.dir === 'l'? 'r': 'l';
                        prevPlanet.dir = prevPlanet.dir === 'l'? 'r': 'l';
                    }
        
                    if (planet.x < PLANET_WIDTH / 2 || planet.x > C.width - PLANET_WIDTH / 2) {
                        planet.dir = planet.dir === 'l'? 'r': 'l';
                    }
                }

                // if (planet.hasPlayer) {
                //     P.x = planet.x;
                //     P.y = planet.y + (dir === 'top'? 1 : -1) * PLANET_HEIGHT / 2 + (dir === 'top'? 1 : -1) * PLAYER_HEIGHT / 2;
                // }
    
                prevPlanet = planet;
            });
            prevPlanet = null
        }
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
            // let g = context.createRadialGradient(P.x, P.y, PLAYER_WIDTH / 2, P.x, P.y, PLAYER_WIDTH);
            // g.addColorStop(0, `hsla(0, 100%, 100%, 1)`);
            // g.addColorStop(1, `hsla(0, 100%, 100%, 0.5)`)
            // context.fillStyle = 'white';
            // context.arc(P.x, P.y, PLAYER_WIDTH / 2 + 2, 0, 10);
            // context.fill();
            context.fillStyle='red';
            context.fillRect(P.x - PLAYER_WIDTH / 2, P.y - PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);
        });
        Utils.renderOnce(() => {
            Utils.drawLine(P.crossingStart.x, P.crossingStart.y, P.x, P.y, true);
        });
    }

    P.update = () => {
        if (P.crossing) {
            let PrevX = P.x;
            const theta = GP.theta;
            const radians = (theta / 180) * PI;
            const nextX = P.x + PLAYER_SPEED * Math.cos(radians);
            const nextY = P.y + (P.isTop() ? 1 : -1) * PLAYER_SPEED * Math.sin(radians);
            
            P.setCoords(nextX, nextY);

            const PLAYER_MAX_Y = C.height - PLANET_HEIGHT - PLAYER_HEIGHT / 2;
            const PLAYER_MIN_Y = PLANET_HEIGHT + PLAYER_HEIGHT / 2;
            
            if (P.y > C.height) {
                // Game over
                P.x = P.crossingStart.x;
                P.y = P.crossingStart.y;
                P.crossing = false;
            } else if (Player_dY > 0 && P.y > PLAYER_MAX_Y) {
                if (PS.attachPlayerIfIntersecting(PS.attached['bottom'])) {
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
                if (PS.attachPlayerIfIntersecting(PS.attached['top'])) {
                    // Using P.x doesn't cause the issue of showing some weird X position where objects meet
                    // At the same time it does cause that slip on intersection
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

function Game() {
    let PrevPlayerY = null;
    G = this;
    P = new Player(PLAYER_WIDTH / 2, C.height / 2 - PLAYER_HEIGHT / 2);
    WS = new WireSet();
    GP = new GunPointer(30);
    PS = new PlanetSet();
    E = new Enemy();

    PLANETS.forEach((planet) => {
        PS.addPlanet(planet.x, planet.speed, planet.vertical, planet.horizontalDir);
    });

    G.render = () => {
        Utils.renderOnce(() => {
            context.fillStyle = 'black';
            context.fillRect(0, 0, C.width, C.height);
        });
        P.render();
        PS.render();
        WS.render();
        GP.render();
        E.render();
    }

    G.update = () => {
        PS.update();
        P.update();
        E.update();
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

    gameLoop();
    
}

onload = function() {
    C = D.querySelector('#canvas');
    C.width = CANVAS_WIDTH;
    C.height = CANVAS_HEIGHT;
    context = C.getContext('2d');

    new Game();
}

window.addEventListener("mousemove", (evt) => {
    if (!P.crossing) {
        GP.theta = Math.min(POINTER_MAX_ANGLE, Math.max(POINTER_MIN_ANGLE, GP.theta - evt.movementX));
    }
});

window.addEventListener("click", (evt) => {
    if (P.crossing) {
        return;
    }
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
})

